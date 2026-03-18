import type { Note, AppSettings, Workspace } from '../types/Note';
import { DEFAULT_SETTINGS, DEFAULT_WORKSPACE_ID, getLanguageFromFilename } from '../types/Note';
import { v4 as uuidv4 } from 'uuid';

const NOTES_KEY = 'notepad_web_notes';
const SETTINGS_KEY = 'notepad_web_settings';
const WORKSPACES_KEY = 'notepad_web_workspaces';
const ACTIVE_WORKSPACE_KEY = 'notepad_web_active_workspace';

export function getNotes(): Note[] {
    try {
        const raw = localStorage.getItem(NOTES_KEY);
        if (!raw) return [];
        const notes = JSON.parse(raw) as Note[];
        // Migration: stamp existing notes with default workspace
        return notes.map((n) => n.workspaceId ? n : { ...n, workspaceId: DEFAULT_WORKSPACE_ID });
    } catch {
        console.error('Failed to parse notes from localStorage');
        return [];
    }
}

export function saveNotes(notes: Note[]): void {
    try {
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
        console.error('Failed to save notes to localStorage', e);
    }
}

export function getSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: AppSettings): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings to localStorage', e);
    }
}

export function getWorkspaces(): Workspace[] {
    try {
        const raw = localStorage.getItem(WORKSPACES_KEY);
        if (!raw) {
            // Default workspace always exists
            return [{ id: DEFAULT_WORKSPACE_ID, name: 'Default' }];
        }
        const parsed = JSON.parse(raw) as Workspace[];
        // Ensure default workspace always present
        if (!parsed.find((w) => w.id === DEFAULT_WORKSPACE_ID)) {
            return [{ id: DEFAULT_WORKSPACE_ID, name: 'Default' }, ...parsed];
        }
        return parsed;
    } catch {
        return [{ id: DEFAULT_WORKSPACE_ID, name: 'Default' }];
    }
}

export function saveWorkspaces(workspaces: Workspace[]): void {
    try {
        localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
    } catch (e) {
        console.error('Failed to save workspaces to localStorage', e);
    }
}

export function getActiveWorkspaceId(): string {
    try {
        const raw = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
        return raw || DEFAULT_WORKSPACE_ID;
    } catch {
        return DEFAULT_WORKSPACE_ID;
    }
}

export function saveActiveWorkspaceId(id: string): void {
    try {
        localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    } catch (e) {
        console.error('Failed to save active workspace ID to localStorage', e);
    }
}

/** Clear all workspace-related data from localStorage (used on logout) */
export function clearAllWorkspaceData(): void {
    try {
        localStorage.removeItem(NOTES_KEY);
        localStorage.removeItem(WORKSPACES_KEY);
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
    } catch (e) {
        console.error('Failed to clear workspace data from localStorage', e);
    }
}

// ── Workspace-scoped file helpers ────────────────────────────────────────

/** Return only the notes belonging to a specific workspace */
export function getNotesByWorkspace(workspaceId: string): Note[] {
    return getNotes().filter((n) => n.workspaceId === workspaceId);
}

/** Create a new note inside the given workspace and persist it */
export function createNoteInWorkspace(
    workspaceId: string,
    name: string,
    content: string = '',
): Note {
    const note: Note = {
        id: uuidv4(),
        name,
        content,
        language: getLanguageFromFilename(name),
        lastModified: Date.now(),
        workspaceId,
    };
    const all = getNotes();
    saveNotes([note, ...all]);
    return note;
}

/** Update an existing note (content / name) and persist */
export function updateNoteInWorkspace(
    noteId: string,
    updates: Partial<Pick<Note, 'name' | 'content'>>,
): Note | null {
    const all = getNotes();
    const idx = all.findIndex((n) => n.id === noteId);
    if (idx === -1) return null;
    const updated: Note = {
        ...all[idx],
        ...updates,
        lastModified: Date.now(),
        ...(updates.name ? { language: getLanguageFromFilename(updates.name) } : {}),
    };
    all[idx] = updated;
    saveNotes(all);
    return updated;
}

/** Delete a note by id and persist */
export function deleteNoteFromWorkspace(noteId: string): boolean {
    const all = getNotes();
    const filtered = all.filter((n) => n.id !== noteId);
    if (filtered.length === all.length) return false;
    saveNotes(filtered);
    return true;
}
