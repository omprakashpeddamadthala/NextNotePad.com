import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Workspace } from '../types/Note';

import * as storage from '../services/localStorageService';
import { getActiveWorkspaceId, saveActiveWorkspaceId } from '../services/localStorageService';
import { getOrCreateWorkspaceFolder, listWorkspaceFolders, renameWorkspaceFolder, deleteWorkspaceFolder } from '../services/googleDriveService';
import { getAccessToken } from '../services/authService';

export function useWorkspaces(rootDriveFolderId: string | null) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>(() => storage.getWorkspaces());
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
        () => {
            const saved = getActiveWorkspaceId();
            // Validate that the saved workspace still exists
            const ws = storage.getWorkspaces();
            return ws.some((w) => w.id === saved) ? saved : (ws[0]?.id || '');
        }
    );

    // Persist workspace list whenever it changes
    useEffect(() => {
        storage.saveWorkspaces(workspaces);
    }, [workspaces]);

    /** Sync workspace list from Drive subfolders after login.
     *  Accepts an optional folderId override so we don't depend on stale React state. */
    const syncWorkspacesFromDrive = useCallback(async (overrideRootFolderId?: string) => {
        const token = getAccessToken();
        const folderId = overrideRootFolderId || rootDriveFolderId;
        if (!token || !folderId) return;
        try {
            const driveFolders = await listWorkspaceFolders(token, folderId);
            setWorkspaces((prev) => {
                const merged = [...prev];
                for (const folder of driveFolders) {
                    const exists = merged.find((w) => w.driveId === folder.id || w.name === folder.name);
                    if (!exists) {
                        merged.push({ id: uuidv4(), name: folder.name, driveId: folder.id });
                    } else if (exists && !exists.driveId) {
                        // Link local workspace to its Drive folder
                        exists.driveId = folder.id;
                    }
                }
                return merged;
            });
        } catch (e) {
            console.error('Failed to sync workspaces from Drive', e);
        }
    }, [rootDriveFolderId]);

    /** Create a new workspace (locally + on Drive if logged in).
     *  Uses idempotent getOrCreateWorkspaceFolder to prevent duplicates. */
    const createWorkspace = useCallback(async (name: string): Promise<Workspace> => {
        const trimmed = name.trim();
        const newWs: Workspace = { id: uuidv4(), name: trimmed };

        const token = getAccessToken();
        if (token && rootDriveFolderId) {
            try {
                const driveId = await getOrCreateWorkspaceFolder(token, rootDriveFolderId, trimmed);
                newWs.driveId = driveId;
            } catch (e) {
                console.error('Failed to create Drive folder for workspace', e);
            }
        }

        setWorkspaces((prev) => [...prev, newWs]);

        setActiveWorkspaceId((current) => {
            if (!current) {
                saveActiveWorkspaceId(newWs.id);
                return newWs.id;
            }
            return current;
        });

        return newWs;
    }, [rootDriveFolderId]);

    const switchWorkspace = useCallback((id: string) => {
        setActiveWorkspaceId(id);
        saveActiveWorkspaceId(id);
    }, []);

    const updateWorkspace = useCallback((id: string, updates: Partial<Workspace>) => {
        setWorkspaces((prev) => prev.map((w) => w.id === id ? { ...w, ...updates } : w));
    }, []);

    const renameWorkspace = useCallback(async (id: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        
        // Find existing workspace
        const wsData = workspaces.find((w) => w.id === id);
        if (!wsData) return;
        
        // Update locally
        updateWorkspace(id, { name: trimmed });
        
        // Update on Drive if applicable
        const token = getAccessToken();
        if (token && wsData.driveId) {
            try {
                await renameWorkspaceFolder(token, wsData.driveId, trimmed);
            } catch (e) {
                console.error('Failed to rename workspace on Drive', e);
            }
        }
    }, [workspaces, updateWorkspace]);

    const deleteWorkspace = useCallback(async (id: string) => {
        // Prevent deleting the very last workspace
        if (workspaces.length <= 1) return;
        
        // Find existing workspace
        const wsData = workspaces.find((w) => w.id === id);
        if (!wsData) return;
        
        // If the active workspace is being deleted, fallback to another one
        if (activeWorkspaceId === id) {
            const fallback = workspaces.find((w) => w.id !== id);
            if (fallback) {
                setActiveWorkspaceId(fallback.id);
                saveActiveWorkspaceId(fallback.id);
            }
        }
        
        // Update locally
        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
        
        // Update on Drive if applicable
        const token = getAccessToken();
        if (token && wsData.driveId) {
            try {
                await deleteWorkspaceFolder(token, wsData.driveId);
            } catch (e) {
                console.error('Failed to delete workspace on Drive', e);
            }
        }
    }, [workspaces, activeWorkspaceId]);

    /** Reset workspaces to default state (used on logout) */
    const resetWorkspaces = useCallback(() => {
        setWorkspaces([]);
        setActiveWorkspaceId('');
        saveActiveWorkspaceId('');
    }, []);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

    return {
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        createWorkspace,
        switchWorkspace,
        updateWorkspace,
        renameWorkspace,
        deleteWorkspace,
        syncWorkspacesFromDrive,
        resetWorkspaces,
    };
}
