import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Workspace } from '../types/Note';
import { DEFAULT_WORKSPACE_ID } from '../types/Note';
import * as storage from '../services/localStorageService';
import { createWorkspaceFolder, listWorkspaceFolders } from '../services/googleDriveService';
import { getAccessToken } from '../services/authService';

export function useWorkspaces(rootDriveFolderId: string | null) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>(() => storage.getWorkspaces());
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
        () => DEFAULT_WORKSPACE_ID
    );

    // Persist workspace list whenever it changes
    useEffect(() => {
        storage.saveWorkspaces(workspaces);
    }, [workspaces]);

    /** Sync workspace list from Drive subfolders after login */
    const syncWorkspacesFromDrive = useCallback(async () => {
        const token = getAccessToken();
        if (!token || !rootDriveFolderId) return;
        try {
            const driveFolders = await listWorkspaceFolders(token, rootDriveFolderId);
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

    /** Create a new workspace (locally + on Drive if logged in) */
    const createWorkspace = useCallback(async (name: string): Promise<Workspace> => {
        const trimmed = name.trim();
        const newWs: Workspace = { id: uuidv4(), name: trimmed };

        const token = getAccessToken();
        if (token && rootDriveFolderId) {
            try {
                const driveId = await createWorkspaceFolder(token, rootDriveFolderId, trimmed);
                newWs.driveId = driveId;
            } catch (e) {
                console.error('Failed to create Drive folder for workspace', e);
            }
        }

        setWorkspaces((prev) => [...prev, newWs]);
        return newWs;
    }, [rootDriveFolderId]);

    const switchWorkspace = useCallback((id: string) => {
        setActiveWorkspaceId(id);
    }, []);

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

    return {
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        createWorkspace,
        switchWorkspace,
        syncWorkspacesFromDrive,
    };
}
