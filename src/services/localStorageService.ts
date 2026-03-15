import type { Note, AppSettings, Workspace } from '../types/Note';
import { DEFAULT_SETTINGS, DEFAULT_WORKSPACE_ID } from '../types/Note';

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
