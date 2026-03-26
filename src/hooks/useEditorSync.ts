import { useEffect, useRef, useCallback } from 'react';
import { getAccessToken, clearAccessToken } from '../services/authService';
import type { GoogleUser } from '../services/authService';
import {
    getOrCreateBackupFolder, getOrCreateWorkspaceFolder, listDriveNotes,
    downloadNoteFromDrive, uploadNoteToDrive
} from '../services/googleDriveService';
import type { Note, Workspace } from '../types/Note';

const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

export interface UseEditorSyncProps {
    user: GoogleUser | null;
    activeWorkspaceId: string | null;
    activeWorkspace?: Workspace;
    workspaceNotes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
    setSyncing: (s: boolean) => void;
    setSyncStatus: (s: 'idle' | 'syncing' | 'synced' | 'error') => void;
    setLastSyncTime: (t: number) => void;
    showSnackbar: (msg: string, sev: 'success' | 'error' | 'info') => void;
    googleLogin: () => void;
    setUser: (u: GoogleUser | null) => void;
}

export function useEditorSync({
    user, activeWorkspaceId, activeWorkspace, workspaceNotes,
    setNotes, updateWorkspace, setSyncing, setSyncStatus,
    setLastSyncTime, showSnackbar, googleLogin, setUser
}: UseEditorSyncProps) {
    const handleSyncRef = useRef<(() => void) | null>(null);
    const autoSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleSync = useCallback(async () => {
        const accessToken = getAccessToken();
        if (!accessToken) {
            showSnackbar('Please sign in with Google first', 'info');
            googleLogin();
            return;
        }
        if (!activeWorkspaceId) {
            showSnackbar('No active workspace selected', 'error');
            return;
        }

        setSyncing(true);
        setSyncStatus('syncing');
        try {
            if (!activeWorkspace?.driveId) {
                showSnackbar('Workspace not synced. Creating remote folder...', 'info');
                const rootFolderId = await getOrCreateBackupFolder(accessToken);
                const folderId = await getOrCreateWorkspaceFolder(accessToken, rootFolderId, activeWorkspace?.name || 'My Workspace');
                updateWorkspace(activeWorkspaceId, { driveId: folderId });
                setTimeout(() => handleSync(), 300);
                setSyncing(false);
                return;
            }

            const folderId = activeWorkspace.driveId;
            const driveFiles = await listDriveNotes(accessToken, folderId);

            const updatedNotes = [...workspaceNotes];
            for (let i = 0; i < updatedNotes.length; i++) {
                const note = updatedNotes[i];
                const existingDriveFile = driveFiles.find((f) => f.name === note.name);
                const driveFileId = await uploadNoteToDrive(
                    accessToken, folderId, note.name, note.content,
                    existingDriveFile?.id || note.driveFileId
                );
                updatedNotes[i] = { ...note, driveFileId, workspaceId: activeWorkspaceId };
            }

            for (const driveFile of driveFiles) {
                const existsLocally = updatedNotes.some(
                    (n) => n.driveFileId === driveFile.id || n.name === driveFile.name
                );
                if (!existsLocally) {
                    const content = await downloadNoteFromDrive(accessToken, driveFile.id);
                    const { v4: uuidv4 } = await import('uuid');
                    const { getLanguageFromFilename } = await import('../types/Note');
                    updatedNotes.push({
                        id: uuidv4(), name: driveFile.name, content,
                        language: getLanguageFromFilename(driveFile.name),
                        lastModified: new Date(driveFile.modifiedTime).getTime(),
                        driveFileId: driveFile.id,
                        workspaceId: activeWorkspaceId,
                    });
                }
            }

            setNotes(currentNotes => {
                const merged = currentNotes.map(n => {
                    if (n.workspaceId !== activeWorkspaceId) return n;
                    const synced = updatedNotes.find(u => u.id === n.id);
                    return synced ? { ...n, driveFileId: synced.driveFileId } : n;
                });
                const newFromDrive = updatedNotes.filter(u => !currentNotes.some(n => n.id === u.id));
                return [...merged, ...newFromDrive];
            });
            setSyncStatus('synced');
            setLastSyncTime(Date.now());
            showSnackbar(`Synced ${updatedNotes.length} notes with Google Drive`, 'success');
        } catch (err: unknown) {
            console.error('Sync error:', err);
            const is401 = err instanceof Error && err.message?.includes('401');
            if (is401) {
                clearAccessToken();
                setUser(null);
                setSyncStatus('idle');
                showSnackbar('Session expired — please sign in again', 'info');
            } else {
                setSyncStatus('error');
                showSnackbar('Sync failed. Please try again.', 'error');
            }
        } finally {
            setSyncing(false);
        }
    }, [
        setNotes, googleLogin, workspaceNotes, activeWorkspace, activeWorkspaceId,
        updateWorkspace, setSyncing, setSyncStatus, setLastSyncTime, showSnackbar, setUser
    ]);

    useEffect(() => {
        handleSyncRef.current = handleSync;
    }, [handleSync]);

    useEffect(() => {
        if (user && getAccessToken()) {
            if (autoSyncTimerRef.current) {
                clearInterval(autoSyncTimerRef.current);
            }
            autoSyncTimerRef.current = setInterval(() => {
                handleSyncRef.current?.();
            }, AUTO_SYNC_INTERVAL);
        } else {
            if (autoSyncTimerRef.current) {
                clearInterval(autoSyncTimerRef.current);
                autoSyncTimerRef.current = null;
            }
        }
        return () => {
            if (autoSyncTimerRef.current) {
                clearInterval(autoSyncTimerRef.current);
            }
        };
    }, [user]);

    return { handleSync, autoSyncTimerRef };
}
