/**
 * Storage Service Abstraction
 *
 * Provides a unified interface for file CRUD operations that works
 * identically in both Google Drive mode and LocalStorage (guest) mode.
 * Consumers call the same functions regardless of the active backend.
 */

import type { Note, Workspace } from '../types/Note';
import { getLanguageFromFilename, DEFAULT_WORKSPACE_ID } from '../types/Note';
import { v4 as uuidv4 } from 'uuid';
import * as local from './localStorageService';
import { getAccessToken } from './authService';
import {
    listDriveNotes,
    uploadNoteToDrive,
    downloadNoteFromDrive,
    deleteNoteFromDrive,
} from './googleDriveService';

// ── Helpers ──────────────────────────────────────────────────────────────

/** Resolve the Drive folder ID for a workspace. Returns null when not applicable. */
function resolveDriveFolderId(
    workspaces: Workspace[],
    workspaceId: string,
): string | null {
    const ws = workspaces.find((w) => w.id === workspaceId);
    return ws?.driveId ?? null;
}

/** True when the user is signed in and has an access token */
function isDriveMode(): boolean {
    return !!getAccessToken();
}

// ── Fetch files ──────────────────────────────────────────────────────────

export interface FetchFilesOptions {
    workspaceId: string;
    workspaces: Workspace[];
}

/**
 * Fetch all files for a given workspace.
 * - Drive mode: lists files from the workspace's Drive folder and merges with local state.
 * - Guest mode: returns files from LocalStorage filtered by workspaceId.
 */
export async function fetchFiles(opts: FetchFilesOptions): Promise<Note[]> {
    const { workspaceId, workspaces } = opts;

    // Always start with local notes for the workspace
    const localNotes = local.getNotesByWorkspace(workspaceId);

    if (!isDriveMode()) return localNotes;

    const token = getAccessToken()!;
    const folderId = resolveDriveFolderId(workspaces, workspaceId);
    if (!folderId) return localNotes; // workspace not yet synced to Drive

    try {
        const driveFiles = await listDriveNotes(token, folderId);
        const merged: Note[] = [...localNotes];

        // Add Drive-only files that don't exist locally
        for (const df of driveFiles) {
            const existsLocally = merged.some(
                (n) => n.driveFileId === df.id || n.name === df.name,
            );
            if (!existsLocally) {
                const content = await downloadNoteFromDrive(token, df.id);
                merged.push({
                    id: uuidv4(),
                    name: df.name,
                    content,
                    language: getLanguageFromFilename(df.name),
                    lastModified: new Date(df.modifiedTime).getTime(),
                    driveFileId: df.id,
                    workspaceId,
                });
            }
        }

        return merged;
    } catch (err) {
        console.error('fetchFiles: Drive fetch failed, falling back to local', err);
        return localNotes;
    }
}

// ── Create file ──────────────────────────────────────────────────────────

export interface CreateFileOptions {
    workspaceId: string;
    workspaces: Workspace[];
    name: string;
    content?: string;
}

/**
 * Create a new file inside the specified workspace.
 * - Always persists to LocalStorage.
 * - In Drive mode, also uploads to the workspace's Drive folder.
 */
export async function createFile(opts: CreateFileOptions): Promise<Note> {
    const { workspaceId, workspaces, name, content = '' } = opts;

    const note: Note = {
        id: uuidv4(),
        name,
        content,
        language: getLanguageFromFilename(name),
        lastModified: Date.now(),
        workspaceId,
    };

    // Persist locally
    const all = local.getNotes();
    local.saveNotes([note, ...all]);

    // Upload to Drive if applicable
    if (isDriveMode()) {
        const token = getAccessToken()!;
        const folderId = resolveDriveFolderId(workspaces, workspaceId);
        if (folderId) {
            try {
                const driveFileId = await uploadNoteToDrive(
                    token, folderId, name, content,
                );
                note.driveFileId = driveFileId;
                // Update local copy with driveFileId
                const updated = local.getNotes().map((n) =>
                    n.id === note.id ? { ...n, driveFileId } : n,
                );
                local.saveNotes(updated);
            } catch (err) {
                console.error('createFile: Drive upload failed', err);
            }
        }
    }

    return note;
}

// ── Update file ──────────────────────────────────────────────────────────

export interface UpdateFileOptions {
    noteId: string;
    workspaces: Workspace[];
    updates: Partial<Pick<Note, 'name' | 'content'>>;
}

/**
 * Update an existing file (name and/or content).
 * - Always updates LocalStorage.
 * - In Drive mode, also patches the file on Drive.
 */
export async function updateFile(opts: UpdateFileOptions): Promise<Note | null> {
    const { noteId, workspaces, updates } = opts;

    const all = local.getNotes();
    const idx = all.findIndex((n) => n.id === noteId);
    if (idx === -1) return null;

    const existing = all[idx];
    const updated: Note = {
        ...existing,
        ...updates,
        lastModified: Date.now(),
        ...(updates.name ? { language: getLanguageFromFilename(updates.name) } : {}),
    };
    all[idx] = updated;
    local.saveNotes(all);

    if (isDriveMode() && updated.driveFileId) {
        const token = getAccessToken()!;
        const folderId = resolveDriveFolderId(workspaces, updated.workspaceId);
        if (folderId) {
            try {
                await uploadNoteToDrive(
                    token, folderId, updated.name, updated.content, updated.driveFileId,
                );
            } catch (err) {
                console.error('updateFile: Drive update failed', err);
            }
        }
    }

    return updated;
}

// ── Delete file ──────────────────────────────────────────────────────────

export interface DeleteFileOptions {
    noteId: string;
    driveFileId?: string;
}

/**
 * Delete a file from LocalStorage and (optionally) from Drive.
 */
export async function deleteFile(opts: DeleteFileOptions): Promise<boolean> {
    const { noteId, driveFileId } = opts;

    const all = local.getNotes();
    const filtered = all.filter((n) => n.id !== noteId);
    if (filtered.length === all.length) return false;
    local.saveNotes(filtered);

    if (isDriveMode() && driveFileId) {
        const token = getAccessToken()!;
        try {
            await deleteNoteFromDrive(token, driveFileId);
        } catch (err) {
            console.error('deleteFile: Drive delete failed', err);
        }
    }

    return true;
}

// ── Re-export for convenience ────────────────────────────────────────────

export { DEFAULT_WORKSPACE_ID };
