import type { Note, AppSettings } from '../types/Note';
import { DEFAULT_SETTINGS } from '../types/Note';

const NOTES_KEY = 'notepad_web_notes';
const SETTINGS_KEY = 'notepad_web_settings';

export function getNotes(): Note[] {
    try {
        const raw = localStorage.getItem(NOTES_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as Note[];
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
