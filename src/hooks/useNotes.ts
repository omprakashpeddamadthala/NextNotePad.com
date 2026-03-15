import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Note, AppSettings } from '../types/Note';
import { getLanguageFromFilename, DEFAULT_WORKSPACE_ID } from '../types/Note';
import * as storage from '../services/localStorageService';

export function useNotes(activeWorkspaceId: string = DEFAULT_WORKSPACE_ID) {
    const [notes, setNotes] = useState<Note[]>(() => storage.getNotes());
    const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
    const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const notesRef = useRef(notes);
    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    // Persist notes to localStorage whenever they change
    useEffect(() => { storage.saveNotes(notes); }, [notes]);

    // Persist settings to localStorage whenever they change
    useEffect(() => { storage.saveSettings(settings); }, [settings]);

    // Restore last session on mount
    useEffect(() => {
        const savedSettings = storage.getSettings();
        const savedNotes = storage.getNotes();
        if (savedSettings.openTabIds.length > 0) {
            const validIds = savedSettings.openTabIds.filter((id) =>
                savedNotes.some((n) => n.id === id)
            );
            const activeId = validIds.includes(savedSettings.activeTabId || '')
                ? savedSettings.activeTabId
                : validIds[0] || null;
            setSettings((s) => ({ ...s, openTabIds: validIds, activeTabId: activeId }));
        }
    }, []);

    const createNote = useCallback((name?: string, workspaceId?: string) => {
        let fileName = name;
        if (!fileName) {
            let maxNew = 0;
            notesRef.current.forEach(n => {
                const match = n.name.match(/^new (\d+)$/i);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNew) maxNew = num;
                }
            });
            fileName = `new ${maxNew + 1}`;
        }
        
        const newNote: Note = {
            id: uuidv4(),
            name: fileName,
            content: '',
            language: getLanguageFromFilename(fileName),
            lastModified: Date.now(),
            workspaceId: workspaceId ?? activeWorkspaceId,
        };
        setNotes((prev) => [newNote, ...prev]);
        setSettings((prev) => ({
            ...prev,
            openTabIds: [...prev.openTabIds, newNote.id],
            activeTabId: newNote.id,
        }));
        return newNote;
    }, [activeWorkspaceId]);

    const deleteNote = useCallback((id: string) => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setSettings((prev) => {
            const openTabIds = prev.openTabIds.filter((tid) => tid !== id);
            const activeTabId = prev.activeTabId === id
                ? openTabIds[openTabIds.length - 1] || null
                : prev.activeTabId;
            return { ...prev, openTabIds, activeTabId };
        });
        setDirtyIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }, []);

    const renameNote = useCallback((id: string, newName: string) => {
        setNotes((prev) => prev.map((n) => n.id === id
            ? { ...n, name: newName, language: getLanguageFromFilename(newName), lastModified: Date.now() }
            : n
        ));
    }, []);

    const updateContent = useCallback((id: string, content: string) => {
        setNotes((prev) => prev.map((n) => n.id === id ? { ...n, content, lastModified: Date.now() } : n));
        setDirtyIds((prev) => new Set(prev).add(id));
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            setDirtyIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        }, 2000);
    }, []);

    const openTab = useCallback((id: string) => {
        setSettings((prev) => {
            const openTabIds = prev.openTabIds.includes(id) ? prev.openTabIds : [...prev.openTabIds, id];
            return { ...prev, openTabIds, activeTabId: id };
        });
    }, []);

    const closeTab = useCallback((id: string) => {
        setSettings((prev) => {
            const openTabIds = prev.openTabIds.filter((tid) => tid !== id);
            let activeTabId = prev.activeTabId;
            if (activeTabId === id) {
                const idx = prev.openTabIds.indexOf(id);
                activeTabId = openTabIds[Math.min(idx, openTabIds.length - 1)] || null;
            }
            return { ...prev, openTabIds, activeTabId };
        });
    }, []);

    const setActiveTab = useCallback((id: string) => {
        setSettings((prev) => ({ ...prev, activeTabId: id }));
    }, []);

    const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
        setSettings((prev) => {
            const tabs = [...prev.openTabIds];
            const [moved] = tabs.splice(fromIndex, 1);
            tabs.splice(toIndex, 0, moved);
            return { ...prev, openTabIds: tabs };
        });
    }, []);

    const toggleSidebar = useCallback(() => {
        setSettings((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
    }, []);

    const toggleWordWrap = useCallback(() => {
        setSettings((prev) => ({ ...prev, wordWrap: !prev.wordWrap }));
    }, []);

    const setTheme = useCallback((theme: 'light' | 'dark') => {
        setSettings((prev) => ({ ...prev, theme }));
    }, []);

    const setFontSize = useCallback((size: number) => {
        setSettings((prev) => ({ ...prev, fontSize: Math.max(8, Math.min(40, size)) }));
    }, []);

    /** Move all notes from one workspace to another (used when deleting a workspace) */
    const reassignNotesToWorkspace = useCallback((fromWorkspaceId: string, toWorkspaceId: string) => {
        setNotes((prev) => prev.map((n) =>
            n.workspaceId === fromWorkspaceId ? { ...n, workspaceId: toWorkspaceId } : n
        ));
    }, []);

    /** Apply settings downloaded from Drive (theme, wordWrap, fontSize, sidebarOpen) */
    const applyDriveSettings = useCallback((remote: { theme?: 'light' | 'dark'; wordWrap?: boolean; fontSize?: number; sidebarOpen?: boolean }) => {
        setSettings((prev) => ({
            ...prev,
            ...(remote.theme !== undefined ? { theme: remote.theme } : {}),
            ...(remote.wordWrap !== undefined ? { wordWrap: remote.wordWrap } : {}),
            ...(remote.fontSize !== undefined ? { fontSize: Math.max(8, Math.min(40, remote.fontSize!)) } : {}),
            ...(remote.sidebarOpen !== undefined ? { sidebarOpen: remote.sidebarOpen } : {}),
        }));
    }, []);

    // Notes filtered by active workspace + search query
    const workspaceNotes = notes.filter((n) => n.workspaceId === activeWorkspaceId);
    const filteredNotes = workspaceNotes
        .filter((n) => n.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => b.lastModified - a.lastModified);

    const activeNote = notes.find((n) => n.id === settings.activeTabId) || null;
    const openTabs = settings.openTabIds
        .map((id) => notes.find((n) => n.id === id))
        .filter(Boolean) as Note[];

    return {
        notes,
        setNotes,
        workspaceNotes,
        filteredNotes,
        activeNote,
        openTabs,
        dirtyIds,
        settings,
        searchQuery,
        setSearchQuery,
        createNote,
        deleteNote,
        renameNote,
        updateContent,
        openTab,
        closeTab,
        setActiveTab,
        reorderTabs,
        toggleSidebar,
        toggleWordWrap,
        setTheme,
        setFontSize,
        applyDriveSettings,
        reassignNotesToWorkspace,
    };
}
