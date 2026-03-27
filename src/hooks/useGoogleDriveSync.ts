import { useCallback, useEffect, useRef } from 'react';
import { getAccessToken, clearAccessToken, getSavedUserProfile, validateToken, fetchUserProfile, saveUserProfile } from '../services/authService';
import type { GoogleUser } from '../services/authService';
import {
    getOrCreateBackupFolder, uploadNoteToDrive, deleteNoteFromDrive, renameNoteOnDrive,
    downloadSettings, listWorkspaceFolders, listDriveNotes, downloadNoteFromDrive, uploadSettings
} from '../services/googleDriveService';
import { clearAllWorkspaceData } from '../services/localStorageService';
import type { Note, Workspace } from '../types/Note';
import { useGoogleLogin } from '@react-oauth/google';

interface UseGoogleDriveSyncProps {
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    workspaces: Workspace[];
    setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
    activeWorkspaceId: string | null;
    activeWorkspace: Workspace | undefined;
    settings: any;
    user: GoogleUser | null;
    setUser: React.Dispatch<React.SetStateAction<GoogleUser | null>>;
    setRootDriveFolderId: React.Dispatch<React.SetStateAction<string | null>>;
    rootDriveFolderId: string | null;
    setSyncing: (val: boolean) => void;
    setSyncStatus: (val: 'idle' | 'syncing' | 'synced' | 'error') => void;
    setLastSyncTime: (val: number | null) => void;
    setCurrentView: (val: 'editor' | 'workspace-management') => void;
    showSnackbar: (msg: string, sev: 'success' | 'error' | 'info') => void;
    applyDriveSettings: (settings: any) => void;
    resetWorkspaces: () => void;
    createNote: (name?: string, workspaceId?: string) => Note;
    deleteNote: (id: string) => void;
    updateContent: (id: string, content: string) => void;
    renameNote: (id: string, newName: string) => void;
}

export function useGoogleDriveSync({
    notes, setNotes, setWorkspaces, activeWorkspaceId, activeWorkspace, settings,
    user, setUser, setRootDriveFolderId, rootDriveFolderId,
    setSyncing, setSyncStatus, setLastSyncTime, setCurrentView, showSnackbar,
    applyDriveSettings, resetWorkspaces,
    createNote, deleteNote, updateContent, renameNote,
}: UseGoogleDriveSyncProps) {
    const notesRef = useRef(notes);
    useEffect(() => { notesRef.current = notes; }, [notes]);
    const driveUploadTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const uploadingNoteIdsRef = useRef<Set<string>>(new Set());

    const initDriveSession = useCallback(async (accessToken: string) => {
        try {
            const folderId = await getOrCreateBackupFolder(accessToken);
            setRootDriveFolderId(folderId);

            try {
                const remote = await downloadSettings(accessToken, folderId);
                if (remote) applyDriveSettings(remote);
            } catch { /* ignore */ }

            const driveFolders = await listWorkspaceFolders(accessToken, folderId);
            if (driveFolders.length === 0) return;

            const { v4: uuidv4 } = await import('uuid');
            const { getLanguageFromFilename } = await import('../types/Note');

            const driveIdToLocalId = new Map<string, string>();
            setWorkspaces((prev) => {
                const merged = [...prev];
                for (const folder of driveFolders) {
                    const exists = merged.find((w) => w.driveId === folder.id || w.name === folder.name);
                    if (!exists) {
                        const newId = uuidv4();
                        merged.push({ id: newId, name: folder.name, driveId: folder.id });
                        driveIdToLocalId.set(folder.id, newId);
                    } else {
                        if (!exists.driveId) exists.driveId = folder.id;
                        driveIdToLocalId.set(folder.id, exists.id);
                    }
                }
                return merged;
            });

            setSyncing(true);
            setSyncStatus('syncing');

            const noteArrays = await Promise.all(
                driveFolders.map(async (folder) => {
                    const localWsId = driveIdToLocalId.get(folder.id) ?? folder.id;
                    const driveFiles = await listDriveNotes(accessToken, folder.id);
                    return Promise.all(
                        driveFiles.map(async (file) => {
                            const content = await downloadNoteFromDrive(accessToken, file.id);
                            return {
                                id: uuidv4(),
                                name: file.name,
                                content,
                                language: getLanguageFromFilename(file.name),
                                lastModified: new Date(file.modifiedTime).getTime(),
                                driveFileId: file.id,
                                workspaceId: localWsId,
                            };
                        })
                    );
                })
            );

            const allNotes = noteArrays.flat();

            setNotes((prev) => {
                const merged = [...prev];
                for (const note of allNotes) {
                    const duplicate = merged.find(
                        (n) => n.driveFileId === note.driveFileId ||
                               (n.name === note.name && n.workspaceId === note.workspaceId)
                    );
                    if (!duplicate) merged.push(note);
                }
                return merged;
            });

            setSyncStatus('synced');
            setLastSyncTime(Date.now());
        } catch (err) {
            console.error('Drive session init failed:', err);
            setSyncStatus('error');
        } finally {
            setSyncing(false);
        }
    }, [applyDriveSettings, setNotes, setSyncing, setSyncStatus, setLastSyncTime, setWorkspaces, setRootDriveFolderId]);

    // Mount Auth Validate
    useEffect(() => {
        const savedToken = getAccessToken();
        const savedUser = getSavedUserProfile();
        if (!savedToken || !savedUser) return;
        let cancelled = false;
        (async () => {
            const valid = await validateToken(savedToken);
            if (cancelled) return;
            if (valid) {
                setUser(savedUser);
                showSnackbar(`Welcome back, ${savedUser.name}`, 'info');
                await initDriveSession(savedToken);
            } else {
                clearAccessToken();
                setUser(null);
                showSnackbar('Session expired — please sign in again', 'info');
            }
        })();
        return () => { cancelled = true; };
    }, [initDriveSession, setUser, showSnackbar]);

    // Set view on login
    useEffect(() => {
        if (user) {
            setCurrentView('workspace-management');
        }
    }, [user, setCurrentView]);

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const { setAccessToken } = await import('../services/authService');
                setAccessToken(tokenResponse.access_token);
                const profile = await fetchUserProfile(tokenResponse.access_token);
                setUser(profile);
                saveUserProfile(profile);
                showSnackbar(`Signed in as ${profile.name}`, 'success');
                await initDriveSession(tokenResponse.access_token);
            } catch {
                showSnackbar('Failed to sign in', 'error');
            }
        },
        onError: () => showSnackbar('Google sign-in failed', 'error'),
        scope: 'https://www.googleapis.com/auth/drive.file',
    });

    const handleLogout = useCallback(() => {
        clearAccessToken();
        setUser(null);
        setSyncStatus('idle');
        setLastSyncTime(null);
        setRootDriveFolderId(null);
        setCurrentView('editor');
        setNotes([]);
        resetWorkspaces();
        clearAllWorkspaceData();
        showSnackbar('Signed out — all data cleared', 'info');
    }, [setNotes, resetWorkspaces, setUser, setSyncStatus, setLastSyncTime, setRootDriveFolderId, setCurrentView, showSnackbar]);

    const handleCreateNote = useCallback((name?: string, workspaceId?: string) => {
        if (!activeWorkspaceId) {
            showSnackbar('Please create a workspace folder first!', 'info');
            setCurrentView('workspace-management');
            return null;
        }
        const note = createNote(name, workspaceId);
        const accessToken = getAccessToken();
        const folderId = activeWorkspace?.driveId;
        if (accessToken && folderId) {
            uploadingNoteIdsRef.current.add(note.id);
            uploadNoteToDrive(accessToken, folderId, note.name, note.content)
                .then(driveFileId => {
                    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, driveFileId } : n));
                    const latest = notesRef.current.find(n => n.id === note.id);
                    if (latest && latest.content !== note.content) {
                        return uploadNoteToDrive(accessToken, folderId, latest.name, latest.content, driveFileId);
                    }
                })
                .catch(err => console.error('Drive: failed to save new file', err))
                .finally(() => { uploadingNoteIdsRef.current.delete(note.id); });
        }
        return note;
    }, [createNote, activeWorkspace, setNotes, activeWorkspaceId, showSnackbar, setCurrentView]);

    const handleDeleteNote = useCallback((id: string) => {
        const note = notes.find(n => n.id === id);
        deleteNote(id);
        if (driveUploadTimersRef.current[id]) {
            clearTimeout(driveUploadTimersRef.current[id]);
            delete driveUploadTimersRef.current[id];
        }
        const accessToken = getAccessToken();
        if (accessToken && note?.driveFileId) {
            deleteNoteFromDrive(accessToken, note.driveFileId)
                .catch(err => console.error('Drive: failed to delete file', err));
        }
    }, [notes, deleteNote]);

    const handleUpdateContent = useCallback((id: string, content: string) => {
        updateContent(id, content);
        const accessToken = getAccessToken();
        const folderId = activeWorkspace?.driveId;
        if (!accessToken || !folderId) return;

        if (driveUploadTimersRef.current[id]) {
            clearTimeout(driveUploadTimersRef.current[id]);
        }
        driveUploadTimersRef.current[id] = setTimeout(() => {
            if (uploadingNoteIdsRef.current.has(id)) return;
            const note = notesRef.current.find(n => n.id === id);
            if (!note) return;
            uploadNoteToDrive(accessToken, folderId, note.name, content, note.driveFileId)
                .then(driveFileId => {
                    if (!note.driveFileId) {
                        setNotes(prev => prev.map(n => n.id === id ? { ...n, driveFileId } : n));
                    }
                })
                .catch(err => console.error('Drive: auto-save error', err));
            delete driveUploadTimersRef.current[id];
        }, 3000);
    }, [updateContent, activeWorkspace, setNotes]);

    const handleRenameNote = useCallback((id: string, newName: string) => {
        renameNote(id, newName);
        const note = notes.find(n => n.id === id);
        const accessToken = getAccessToken();
        if (accessToken && note?.driveFileId) {
            renameNoteOnDrive(accessToken, note.driveFileId, newName)
                .catch(err => console.error('Drive: failed to rename file', err));
        }
    }, [notes, renameNote]);

    const settingsUploadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        const token = getAccessToken();
        if (!token || !rootDriveFolderId) return;
        if (settingsUploadTimer.current) clearTimeout(settingsUploadTimer.current);
        settingsUploadTimer.current = setTimeout(() => {
            uploadSettings(token, rootDriveFolderId, {
                theme: settings.theme,
                wordWrap: settings.wordWrap,
                fontSize: settings.fontSize,
                sidebarOpen: settings.sidebarOpen,
            }).catch(() => { /* silent */ });
        }, 2000);
        return () => { if (settingsUploadTimer.current) clearTimeout(settingsUploadTimer.current); };
    }, [settings.theme, settings.wordWrap, settings.fontSize, settings.sidebarOpen, rootDriveFolderId]);


    return {
        googleLogin,
        handleLogout,
        handleCreateNote,
        handleDeleteNote,
        handleUpdateContent,
        handleRenameNote,
        uploadingNoteIdsRef
    };
}
