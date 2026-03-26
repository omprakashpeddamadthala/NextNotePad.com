import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Snackbar, Alert, useMediaQuery, Button
} from '@mui/material';
import MenuBar from '../components/MenuBar/MenuBar';
import NppToolbar from '../components/NppToolbar/NppToolbar';
import Tabs from '../components/Tabs/Tabs';
import Editor from '../components/Editor/Editor';
import Sidebar from '../components/Sidebar/Sidebar';
import CompareDialog from '../components/CompareDialog/CompareDialog';
import RenameDialog from '../components/RenameDialog/RenameDialog';
import AboutDialog from '../components/AboutDialog/AboutDialog';
import WorkspaceLayout from '../components/WorkspaceManagement/WorkspaceLayout';
import SettingsDialog from '../components/SettingsDialog/SettingsDialog';
import MobileLayout from '../components/MobileLayout/MobileLayout';
import MobileEditor from '../components/MobileLayout/MobileEditor';
import { DiffEditor } from '@monaco-editor/react';
import { useNotes } from '../hooks/useNotes';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useEditorSync } from '../hooks/useEditorSync';
import { useGoogleLogin } from '@react-oauth/google';
import type { GoogleUser } from '../services/authService';
import {
    fetchUserProfile, setAccessToken, getAccessToken, clearAccessToken,
    saveUserProfile, getSavedUserProfile, validateToken,
} from '../services/authService';
import { clearAllWorkspaceData } from '../services/localStorageService';
import {
    getOrCreateBackupFolder, uploadNoteToDrive, deleteNoteFromDrive, renameNoteOnDrive,
    downloadSettings, uploadSettings
} from '../services/googleDriveService';
import { downloadFile, downloadAllAsZip } from '../services/fileExportService';
import type * as monaco from 'monaco-editor';
import { getPalette } from '../theme/colors';

const ClockWidget: React.FC = () => {
    const [clock, setClock] = useState('');
    useEffect(() => {
        const formatClock = () => {
            const now = new Date();
            const day = now.toLocaleDateString(undefined, { weekday: 'long' });
            const date = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            return `${day}, ${date}  ${time}  (${tz})`;
        };
        setClock(formatClock());
        const timer = setInterval(() => setClock(formatClock()), 1000);
        return () => clearInterval(timer);
    }, []);
    return <>{clock}</>;
};

const EditorPage: React.FC = () => {
    // Workspace state (must come before useNotes so we have activeWorkspaceId)
    const [rootDriveFolderId, setRootDriveFolderId] = useState<string | null>(null);
    const {
        workspaces, activeWorkspaceId, activeWorkspace,
        createWorkspace, switchWorkspace, updateWorkspace,
        renameWorkspace,
        deleteWorkspace,
        syncWorkspacesFromDrive,
        resetWorkspaces,
    } = useWorkspaces(rootDriveFolderId);

    const {
        notes, setNotes, workspaceNotes, activeNote, openTabs, dirtyIds, settings, setSettings,
        createNote, deleteNote, renameNote, updateContent,
        openTab, closeTab, setActiveTab, reorderTabs,
        toggleWordWrap, toggleSidebar, setTheme, setFontSize, applyDriveSettings,
        reassignNotesToWorkspace,
    } = useNotes(activeWorkspaceId);

    const isMobile = useMediaQuery('(max-width: 600px)');

    // fontSize from settings (no longer local state)
    const fontSize = settings.fontSize;
    const [showAllChars, setShowAllChars] = useState(false);
    const showMinimap = settings.showMinimap;
    const [cursorLine, setCursorLine] = useState(1);
    const [cursorCol, setCursorCol] = useState(1);
    const [selChars, setSelChars] = useState(0);
    const [selLines, setSelLines] = useState(0);
    const encoding = settings.encoding;
    const eol = 'Windows (CR LF)';
    const [insertMode, setInsertMode] = useState(true);

    // Restore user from sessionStorage on mount (survives page refresh)
    const [user, setUser] = useState<GoogleUser | null>(() => getSavedUserProfile());

    // User session types: 'google' (OAuth), 'guest' (localStorage-only), null (no session).
    // Workspace management is only visible when a session exists (google or guest).
    const [guestMode, setGuestMode] = useState(false);
    const userMode: 'google' | 'guest' | null = user ? 'google' : guestMode ? 'guest' : null;
    const isLoggedIn = userMode !== null;
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
    const [aboutOpen, setAboutOpen] = useState(false);
    // Current view: 'editor' (normal editor) or 'workspace-management' (full-page workspace view)
    const [currentView, setCurrentView] = useState<'editor' | 'workspace-management'>('editor');
    const [compareDialogOpen, setCompareDialogOpen] = useState(false);
    const [compareMode, setCompareMode] = useState(false);
    const [compareTargetId, setCompareTargetId] = useState<string | null>(null);
    const [renameDialog, setRenameDialog] = useState<{ open: boolean; noteId: string; name: string }>({ open: false, noteId: '', name: '' });
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);


    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    // Refs for Drive auto-save
    const notesRef = useRef(notes);
    useEffect(() => { notesRef.current = notes; }, [notes]);
    const driveUploadTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const uploadingNoteIdsRef = useRef<Set<string>>(new Set());
    const p = getPalette(settings.theme);
    const isDark = settings.theme === 'dark';

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, severity });
    };



    /** Shared post-login setup: fetch root folder, sync workspaces, start sync timer */
    const initDriveSession = useCallback(async (accessToken: string) => {
        try {
            const folderId = await getOrCreateBackupFolder(accessToken);
            setRootDriveFolderId(folderId);
            // Download and apply saved settings from Drive
            try {
                const remote = await downloadSettings(accessToken, folderId);
                if (remote) applyDriveSettings(remote);
            } catch { /* ignore */ }
            // Pass folderId directly so we don't depend on stale React state
            await syncWorkspacesFromDrive(folderId);
        } catch (err) {
            console.error('Drive session init failed:', err);
        }
    }, [applyDriveSettings, syncWorkspacesFromDrive]);

    // Restore session on mount: if we have a saved token+user, validate and resume
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
                // Token expired — clear stale session silently
                clearAccessToken();
                setUser(null);
                showSnackbar('Session expired — please sign in again', 'info');
            }
        })();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Google Auth
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
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
        setGuestMode(false);
        setSyncStatus('idle');
        setLastSyncTime(null);
        setRootDriveFolderId(null);
        setCurrentView('editor');
        // Clear ALL workspace data from state and localStorage
        setNotes([]);
        resetWorkspaces();
        clearAllWorkspaceData();
        showSnackbar('Signed out — all data cleared', 'info');
    }, [setNotes, resetWorkspaces]);

    /** Enter guest mode (localStorage-only, no Google account required) */
    const handleGuestLogin = useCallback(() => {
        setGuestMode(true);
        showSnackbar('Entered as guest — files saved locally', 'info');
    }, []);

    // DEV-ONLY: mock login to test logged-in UI without real Google OAuth
    const handleDevLogin = useCallback(() => {
        if (!import.meta.env.DEV) return;
        setUser({
            name: 'Dev User',
            email: 'dev@localhost',
            picture: 'https://ui-avatars.com/api/?name=Dev+User&background=007acc&color=fff&size=64',
        });
        showSnackbar('[DEV] Logged in as Dev User', 'info');
    }, []);

    const { handleSync } = useEditorSync({
        user,
        activeWorkspaceId,
        activeWorkspace,
        workspaceNotes,
        setNotes,
        updateWorkspace,
        setSyncing,
        setSyncStatus,
        setLastSyncTime,
        showSnackbar,
        googleLogin,
        setUser
    });

    // ── Drive-aware CRUD wrappers ──────────────────────────────────────────
    // When logged in, these also push changes to Google Drive in the active
    // workspace folder. When not logged in they fall back to localStorage only.

    /** Create a note locally and, if logged in, upload it to Drive */
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
                    // If content was updated while uploading (e.g. file import), re-upload
                    const latest = notesRef.current.find(n => n.id === note.id);
                    if (latest && latest.content !== note.content) {
                        return uploadNoteToDrive(accessToken, folderId, latest.name, latest.content, driveFileId);
                    }
                })
                .catch(err => console.error('Drive: failed to save new file', err))
                .finally(() => { uploadingNoteIdsRef.current.delete(note.id); });
        }
        return note;
    }, [createNote, activeWorkspace, setNotes]);

    /** Delete a note locally and, if logged in, remove it from Drive */
    const handleDeleteNote = useCallback((id: string) => {
        const note = notes.find(n => n.id === id);
        deleteNote(id);
        // Clear any pending Drive upload timer for this note
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

    /** Update note content locally and, if logged in, debounced auto-save to Drive */
    const handleUpdateContent = useCallback((id: string, content: string) => {
        updateContent(id, content);
        const accessToken = getAccessToken();
        const folderId = activeWorkspace?.driveId;
        if (!accessToken || !folderId) return;

        if (driveUploadTimersRef.current[id]) {
            clearTimeout(driveUploadTimersRef.current[id]);
        }
        driveUploadTimersRef.current[id] = setTimeout(() => {
            // Skip if the note is still being created on Drive
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

    /** Rename a note locally and, if logged in, rename on Drive */
    const handleRenameNote = useCallback((id: string, newName: string) => {
        renameNote(id, newName);
        const note = notes.find(n => n.id === id);
        const accessToken = getAccessToken();
        if (accessToken && note?.driveFileId) {
            renameNoteOnDrive(accessToken, note.driveFileId, newName)
                .catch(err => console.error('Drive: failed to rename file', err));
        }
    }, [notes, renameNote]);

    // Drag and drop file import
    const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop({
        onFileCreate: handleCreateNote,
        onContentUpdate: handleUpdateContent,
        onShowSnackbar: showSnackbar
    });

    // Cursor change handler
    const handleCursorChange = useCallback((line: number, col: number, sc: number, sl: number) => {
        setCursorLine(line);
        setCursorCol(col);
        setSelChars(sc);
        setSelLines(sl);
    }, []);

    // Theme toggle
    const handleThemeToggle = useCallback(() => {
        setTheme(settings.theme === 'dark' ? 'light' : 'dark');
    }, [settings.theme, setTheme]);

    // Editor actions
    const triggerEditorAction = useCallback((actionId: string) => {
        if (editorRef.current) {
            editorRef.current.trigger('menu', actionId, null);
        }
    }, []);

    const handleFind = useCallback(() => triggerEditorAction('actions.find'), [triggerEditorAction]);
    const handleReplace = useCallback(() => triggerEditorAction('editor.action.startFindReplaceAction'), [triggerEditorAction]);
    const handleUndo = useCallback(() => triggerEditorAction('undo'), [triggerEditorAction]);
    const handleRedo = useCallback(() => triggerEditorAction('redo'), [triggerEditorAction]);
    const handleSelectAll = useCallback(() => {
        if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.trigger('menu', 'editor.action.selectAll', null);
        }
    }, []);
    const handleGoToLine = useCallback(() => triggerEditorAction('editor.action.gotoLine'), [triggerEditorAction]);
    const handleCut = useCallback(() => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('cut');
        }
    }, []);
    const handleCopy = useCallback(() => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('copy');
        }
    }, []);
    const handlePaste = useCallback(async () => {
        if (editorRef.current) {
            editorRef.current.focus();
            const text = await navigator.clipboard.readText();
            editorRef.current.trigger('paste', 'type', { text });
        }
    }, []);
    const handleIndent = useCallback(() => triggerEditorAction('editor.action.indentLines'), [triggerEditorAction]);
    const handleUnindent = useCallback(() => triggerEditorAction('editor.action.outdentLines'), [triggerEditorAction]);

    // Format text — auto-detects type from content, works on selection or full doc
    const handleFormatText = useCallback(() => {
        if (!editorRef.current) {
            showSnackbar('No editor available', 'info');
            return;
        }
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        // Get selected text or full content directly from Monaco model
        const selection = editor.getSelection();
        const hasSelection = selection && !selection.isEmpty();
        const textToFormat = hasSelection
            ? model.getValueInRange(selection)
            : model.getValue();

        if (!textToFormat.trim()) {
            showSnackbar('Nothing to format', 'info');
            return;
        }

        // Auto-detect content type from the text itself
        const detectType = (text: string): string => {
            const trimmed = text.trim();
            // JSON: starts with { or [
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try { JSON.parse(trimmed); return 'json'; } catch { /* not json */ }
            }
            // XML/HTML: starts with <
            if (trimmed.startsWith('<') && trimmed.endsWith('>')) return 'xml';
            // SQL: contains SQL keywords
            if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i.test(trimmed)) return 'sql';
            // CSS: contains { } with ; inside
            if (/\{[^}]*;[^}]*\}/.test(trimmed)) return 'css';
            return 'unknown';
        };

        const detectedType = detectType(textToFormat);
        let formatted = textToFormat;

        try {
            if (detectedType === 'json') {
                formatted = JSON.stringify(JSON.parse(textToFormat.trim()), null, 2);
            } else if (detectedType === 'xml') {
                let indent = 0;
                const lines: string[] = [];
                const tags = textToFormat.replace(/>\s*</g, '>\n<').split('\n');
                for (const rawTag of tags) {
                    const tag = rawTag.trim();
                    if (!tag) continue;
                    if (tag.startsWith('</')) {
                        indent = Math.max(0, indent - 1);
                        lines.push('  '.repeat(indent) + tag);
                    } else if (tag.startsWith('<') && !tag.startsWith('<!') && !tag.endsWith('/>') && tag.endsWith('>') && !tag.includes('</')) {
                        lines.push('  '.repeat(indent) + tag);
                        indent++;
                    } else {
                        lines.push('  '.repeat(indent) + tag);
                    }
                }
                formatted = lines.join('\n');
            } else if (detectedType === 'css') {
                formatted = textToFormat
                    .replace(/\s*\{\s*/g, ' {\n  ')
                    .replace(/\s*\}\s*/g, '\n}\n')
                    .replace(/;\s*/g, ';\n  ')
                    .replace(/\n\s*\n/g, '\n')
                    .replace(/ {2}\}/g, '}')
                    .trim();
            } else if (detectedType === 'sql') {
                const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'AS', 'IN', 'NOT', 'NULL', 'IS', 'LIKE', 'BETWEEN', 'UNION', 'ALL', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];
                formatted = textToFormat;
                for (const kw of keywords) {
                    formatted = formatted.replace(new RegExp('\\b' + kw + '\\b', 'gi'), kw);
                }
                formatted = formatted
                    .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP BY|ORDER BY|HAVING|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE|CREATE TABLE|DROP|ALTER|UNION)\b/g, '\n$1')
                    .replace(/^\n/, '')
                    .trim();
            } else {
                // Unknown type — try Monaco's built-in formatter
                if (hasSelection) {
                    editor.trigger('format', 'editor.action.formatSelection', null);
                } else {
                    editor.trigger('format', 'editor.action.formatDocument', null);
                }
                showSnackbar('Formatted with editor', 'success');
                return;
            }

            if (formatted !== textToFormat) {
                const range = hasSelection ? selection : model.getFullModelRange();
                editor.executeEdits('format', [{
                    range: range,
                    text: formatted,
                }]);
                if (!hasSelection && activeNote) {
                    handleUpdateContent(activeNote.id, formatted);
                }
                const typeLabels: Record<string, string> = {
                    json: 'JSON', xml: 'XML/HTML', css: 'CSS', sql: 'SQL',
                };
                showSnackbar(`Formatted as ${typeLabels[detectedType]}${hasSelection ? ' (selection)' : ''}`, 'success');
            } else {
                showSnackbar('Already formatted', 'info');
            }
        } catch (err) {
            showSnackbar(`Format error: ${(err as Error).message}`, 'error');
        }
    }, [activeNote, handleUpdateContent]);

    // Minimap toggle
    const handleToggleMinimap = useCallback(() => setSettings((prev) => ({ ...prev, showMinimap: !prev.showMinimap })), [setSettings]);

    // Zoom
    const handleZoomIn = useCallback(() => setFontSize(Math.min(fontSize + 2, 40)), [fontSize, setFontSize]);
    const handleZoomOut = useCallback(() => setFontSize(Math.max(fontSize - 2, 8)), [fontSize, setFontSize]);
    const handleZoomReset = useCallback(() => setFontSize(14), [setFontSize]);
    // Upload settings to Drive whenever they change (debounced 2 s)
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

    // File operations
    const handleNewFile = useCallback(() => handleCreateNote(), [handleCreateNote]);
    const handleCloseFile = useCallback(() => {
        if (activeNote) closeTab(activeNote.id);
    }, [activeNote, closeTab]);
    const handleCloseAllFiles = useCallback(() => {
        openTabs.forEach((tab) => closeTab(tab.id));
    }, [openTabs, closeTab]);
    const handleCloseOthers = useCallback((keepId: string) => {
        openTabs.forEach((tab) => {
            if (tab.id !== keepId) closeTab(tab.id);
        });
    }, [openTabs, closeTab]);
    const handleSaveFile = useCallback(() => {
        showSnackbar('File saved to browser storage', 'success');
    }, []);
    const handleOpenFile = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.txt,.js,.ts,.jsx,.tsx,.html,.css,.json,.md,.py,.java,.xml,.yaml,.yml,.sql,.sh,.c,.cpp,.h,.go,.rs,.rb,.php';
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files) return;
            for (const file of Array.from(files)) {
                const content = await file.text();
                const note = handleCreateNote(file.name);
                if (note) {
                    handleUpdateContent(note.id, content);
                }
            }
        };
        input.click();
    }, [handleCreateNote, handleUpdateContent]);
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    // File download
    const handleDownloadFile = useCallback(() => {
        if (activeNote) {
            downloadFile(activeNote.name, activeNote.content);
            showSnackbar(`Downloaded ${activeNote.name}`, 'success');
        } else {
            showSnackbar('No file to download', 'info');
        }
    }, [activeNote]);

    const handleDownloadAllAsZip = useCallback(async () => {
        if (workspaceNotes.length === 0) {
            showSnackbar('No files to download', 'info');
            return;
        }
        try {
            await downloadAllAsZip(workspaceNotes);
            showSnackbar(`Downloaded ${workspaceNotes.length} files as ZIP`, 'success');
        } catch (err) {
            console.error('ZIP export error:', err);
            showSnackbar('Failed to create ZIP', 'error');
        }
    }, [workspaceNotes]);

    // Plugins: Word Count
    const handleWordCount = useCallback(() => {
        if (!activeNote) {
            showSnackbar('No file open', 'info');
            return;
        }
        const text = activeNote.content;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = (text.match(/\n/g) || []).length + 1;
        const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0;
        showSnackbar(`Words: ${words} | Chars: ${chars} | Lines: ${lines} | Paragraphs: ${paragraphs}`, 'info');
    }, [activeNote]);

    // Plugins: Sort Lines
    const handleSortLines = useCallback(() => {
        if (!editorRef.current || !activeNote) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        const selection = editor.getSelection();
        const hasSelection = selection && !selection.isEmpty();
        const text = hasSelection ? model.getValueInRange(selection) : model.getValue();
        const sorted = text.split('\n').sort().join('\n');

        const range = hasSelection ? selection : model.getFullModelRange();
        editor.executeEdits('sort', [{ range, text: sorted }]);
        if (!hasSelection) handleUpdateContent(activeNote.id, sorted);
        showSnackbar('Lines sorted', 'success');
    }, [activeNote, handleUpdateContent]);

    // Plugins: Remove Duplicate Lines
    const handleRemoveDuplicateLines = useCallback(() => {
        if (!editorRef.current || !activeNote) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        const text = model.getValue();
        const unique = [...new Set(text.split('\n'))].join('\n');
        const range = model.getFullModelRange();
        editor.executeEdits('dedup', [{ range, text: unique }]);
        handleUpdateContent(activeNote.id, unique);
        showSnackbar('Duplicate lines removed', 'success');
    }, [activeNote, handleUpdateContent]);

    // Plugins: Trim Trailing Whitespace
    const handleTrimWhitespace = useCallback(() => {
        if (!editorRef.current || !activeNote) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        if (!model) return;

        const text = model.getValue();
        const trimmed = text.split('\n').map(line => line.trimEnd()).join('\n');
        const range = model.getFullModelRange();
        editor.executeEdits('trim', [{ range, text: trimmed }]);
        handleUpdateContent(activeNote.id, trimmed);
        showSnackbar('Trailing whitespace removed', 'success');
    }, [activeNote, handleUpdateContent]);

    // Plugins: Convert Case
    const handleUpperCase = useCallback(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        const selection = editor.getSelection();
        if (!model || !selection || selection.isEmpty()) {
            showSnackbar('Select text first', 'info');
            return;
        }
        const text = model.getValueInRange(selection);
        editor.executeEdits('upper', [{ range: selection, text: text.toUpperCase() }]);
        showSnackbar('Converted to UPPERCASE', 'success');
    }, []);

    const handleLowerCase = useCallback(() => {
        if (!editorRef.current) return;
        const editor = editorRef.current;
        const model = editor.getModel();
        const selection = editor.getSelection();
        if (!model || !selection || selection.isEmpty()) {
            showSnackbar('Select text first', 'info');
            return;
        }
        const text = model.getValueInRange(selection);
        editor.executeEdits('lower', [{ range: selection, text: text.toLowerCase() }]);
        showSnackbar('Converted to lowercase', 'success');
    }, []);

    // Run: Execute HTML/JS in browser
    const handleRunInBrowser = useCallback(() => {
        if (!activeNote) {
            showSnackbar('No file open to run', 'info');
            return;
        }
        const lang = activeNote.language;
        let htmlContent: string;

        if (lang === 'html') {
            htmlContent = activeNote.content;
        } else if (lang === 'javascript' || lang === 'typescript') {
            const scriptClose = '<' + '/script>';
            htmlContent = '<!DOCTYPE html>\n<html><head><title>Run - ' + activeNote.name + '</title></head>\n' +
                '<body><pre id="output"></pre>\n<script>\n' +
                'const _log = console.log;\n' +
                'console.log = function(...args) {\n' +
                '    _log(...args);\n' +
                '    document.getElementById("output").textContent += args.join(" ") + "\\n";\n' +
                '};\ntry {\n' + activeNote.content + '\n} catch(e) { document.getElementById("output").textContent += "Error: " + e.message; }\n' +
                scriptClose + '</body></html>';
        } else {
            showSnackbar('Run is only supported for HTML and JavaScript files', 'info');
            return;
        }
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showSnackbar(`Running ${activeNote.name} in browser`, 'success');
    }, [activeNote]);

    const handleCompareOpen = useCallback(() => {
        setCompareDialogOpen(true);
    }, []);

    const handleCompareProcess = useCallback((targetId: string) => {
        setCompareTargetId(targetId);
        setCompareMode(true);
    }, []);

    const handleCompareExit = useCallback(() => {
        setCompareMode(false);
        setCompareTargetId(null);
    }, []);

    // Encoding/Language/EOL
    const handleSetEncoding = useCallback((enc: string) => setSettings((prev) => ({ ...prev, encoding: enc })), [setSettings]);
    const handleSetLanguage = useCallback((lang: string) => {
        if (activeNote) {
            renameNote(activeNote.id, activeNote.name); // Keep same name (no Drive rename needed)
            // Update language through renaming with the correct extension isn't great,
            setNotes((prev) =>
                prev.map((n) => n.id === activeNote.id ? { ...n, language: lang } : n)
            );
        }
    }, [activeNote, renameNote, setNotes]);

    // Rename dialog
    const handleRenameOpen = useCallback((noteId: string) => {
        const note = notes.find((n) => n.id === noteId);
        if (note) {
            setRenameDialog({ open: true, noteId, name: note.name });
        }
    }, [notes]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onNewFile: () => handleCreateNote(),
        onSaveFile: handleSaveFile,
        onSaveAllFiles: () => {
            handleSaveFile();
            showSnackbar('All files saved to browser storage', 'success');
        },
        onOpenFile: handleOpenFile,
        onCloseTab: () => { if (activeNote) closeTab(activeNote.id); },
        onToggleInsertMode: () => setInsertMode((prev) => !prev),
    });

    // Computed values
    const docLength = activeNote ? activeNote.content.length : 0;
    const docLines = activeNote ? (activeNote.content.match(/\n/g) || []).length + 1 : 0;

    // Format last sync time
    const formatSyncTime = (ts: number | null): string => {
        if (!ts) return '';
        const diff = Math.floor((Date.now() - ts) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };



    /* ────────────────────────────── MOBILE LAYOUT ──────────────────────────────
       On mobile, we render a streamlined UI with a hamburger drawer menu,
       a file-list drawer, and a floating action button. Desktop is unchanged.
    ────────────────────────────────────────────────────────────────────────── */
    if (isMobile) {
        return (
            <>
                <MobileLayout
                    theme={settings.theme}
                    notes={workspaceNotes}
                    activeNote={activeNote}
                    activeId={settings.activeTabId}
                    wordWrap={settings.wordWrap}
                    activeWorkspaceName={activeWorkspace?.name}
                    onNewFile={handleNewFile}
                    onFileClick={openTab}
                    onDelete={handleDeleteNote}
                    onRename={handleRenameOpen}
                    onSaveFile={handleSaveFile}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onFind={handleFind}
                    onReplace={handleReplace}
                    onSyncDrive={handleSync}
                    onThemeToggle={handleThemeToggle}
                    onToggleWordWrap={toggleWordWrap}
                    onAbout={() => setAboutOpen(true)}
                    onDownloadFile={handleDownloadFile}
                    onOpenSettingsJson={() => setSettingsDialogOpen(true)}
                    onManageWorkspaces={isLoggedIn ? () => setCurrentView('workspace-management') : undefined}
                >
                    {currentView === 'workspace-management' ? (
                        <WorkspaceLayout
                            workspaces={workspaces}
                            activeWorkspaceId={activeWorkspaceId}
                            notes={notes}
                            palette={p}
                            loading={syncing}
                            onSelect={(id) => { switchWorkspace(id); setCurrentView('editor'); }}
                            onCreate={async (name) => {
                                await createWorkspace(name);
                                showSnackbar(`Workspace "${name}" created`, 'success');
                            }}
                            onRename={(id, newName) => {
                                renameWorkspace(id, newName);
                                showSnackbar(`Workspace renamed to "${newName}"`, 'success');
                            }}
                            onDelete={(id: string) => {
                                const ws = workspaces.find((w) => w.id === id);
                                const fallback = workspaces.find((w) => w.id !== id);
                                if (fallback) reassignNotesToWorkspace(id, fallback.id);
                                deleteWorkspace(id);
                                showSnackbar(`Workspace "${ws?.name || ''}" deleted`, 'success');
                            }}
                        />
                    ) : (
                        <MobileEditor
                            note={activeNote}
                            theme={settings.theme}
                            wordWrap={settings.wordWrap}
                            fontSize={fontSize}
                            onChange={handleUpdateContent}
                        />
                    )}
                </MobileLayout>

                {/* Dialogs shared with desktop */}
                <RenameDialog
                    open={renameDialog.open}
                    initialName={renameDialog.name}
                    onRename={(newName: string) => { renameNote(renameDialog.noteId, newName); setRenameDialog({ open: false, noteId: '', name: '' }); }}
                    onClose={() => setRenameDialog({ open: false, noteId: '', name: '' })}
                />
                <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} theme={settings.theme} />
                <SettingsDialog
                    open={settingsDialogOpen}
                    onClose={() => setSettingsDialogOpen(false)}
                    settings={settings}
                    onSaveSettings={(newSettings) => {
                        setSettings(newSettings);
                        showSnackbar('Settings updated successfully', 'success');
                    }}
                    theme={settings.theme}
                />
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={3000}
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 0 }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </>
        );
    }

    // ──────────────────────────── DESKTOP LAYOUT ────────────────────────────
    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                background: p.bg,
                fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: p.active,
                    border: `3px dashed ${p.accent}`,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}>
                    <div style={{
                        padding: '24px 48px',
                        background: isDark ? '#2d2d2d' : '#ffffff',
                        borderRadius: 8,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        fontSize: 18,
                        fontWeight: 600,
                        color: isDark ? '#007acc' : '#0078d4',
                    }}>
                        Drop files here to import
                    </div>
                </div>
            )}
            {/* Menu Bar with Clock */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? '#3b3b3b' : '#e8e8e8',
                borderBottom: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                flexShrink: 0,
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none', // Hide scrollbar for a cleaner look
            }}>
                <div style={{ flex: 1, minWidth: 'min-content' }}>
                    <MenuBar
                        onNewFile={handleNewFile}
                        onCloseFile={handleCloseFile}
                        onCloseAllFiles={handleCloseAllFiles}
                        onToggleWordWrap={toggleWordWrap}
                        onThemeToggle={handleThemeToggle}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        onFind={handleFind}
                        onReplace={handleReplace}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomReset={handleZoomReset}
                        onSelectAll={handleSelectAll}
                        onSetEncoding={handleSetEncoding}
                        onSetLanguage={handleSetLanguage}
                        onOpenSettingsJson={() => setSettingsDialogOpen(true)}
                        onSaveFile={handleSaveFile}
                        onOpenFile={handleOpenFile}
                        onPrint={handlePrint}
                        onGoToLine={handleGoToLine}
                        wordWrap={settings.wordWrap}
                        showAllChars={showAllChars}
                        onToggleShowAllChars={() => setShowAllChars(!showAllChars)}
                        sidebarOpen={settings.sidebarOpen}
                        onToggleSidebar={toggleSidebar}
                        currentEncoding={encoding}
                        currentLanguage={activeNote?.language || 'plaintext'}
                        theme={settings.theme}
                        onSyncDrive={handleSync}
                        onAbout={() => setAboutOpen(true)}
                        onDownloadFile={handleDownloadFile}
                        onDownloadAllAsZip={handleDownloadAllAsZip}
                        showMinimap={showMinimap}
                        onToggleMinimap={handleToggleMinimap}
                        onWordCount={handleWordCount}
                        onSortLines={handleSortLines}
                        onRemoveDuplicateLines={handleRemoveDuplicateLines}
                        onTrimWhitespace={handleTrimWhitespace}
                        onUpperCase={handleUpperCase}
                        onLowerCase={handleLowerCase}
                        onRunInBrowser={handleRunInBrowser}
                        onCompare={handleCompareOpen}
                    />
                </div>
                {!isMobile && (
                    <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isDark ? '#c0c0c0' : '#444',
                        padding: '0 10px',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    }}>
                        <ClockWidget />
                    </div>
                )}
            </div>

            {/* Icon Toolbar */}
            <NppToolbar
                onNewFile={handleNewFile}
                onOpenFile={handleOpenFile}
                onSaveFile={handleSaveFile}
                onSaveAll={handleSaveFile}
                onCloseFile={handleCloseFile}
                onPrint={handlePrint}
                onCut={handleCut}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onFind={handleFind}
                onReplace={handleReplace}
                onCompare={handleCompareOpen}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onToggleWordWrap={toggleWordWrap}
                onToggleShowAllChars={() => setShowAllChars(!showAllChars)}
                onIndent={handleIndent}
                onUnindent={handleUnindent}
                onFormatText={handleFormatText}
                onSyncDrive={handleSync}
                onThemeToggle={handleThemeToggle}
                onGoogleLogin={() => googleLogin()}
                onGoogleLogout={handleLogout}
                onGuestLogin={!isLoggedIn ? handleGuestLogin : undefined}
                onDevLogin={import.meta.env.DEV ? handleDevLogin : undefined}
                onManageWorkspaces={isLoggedIn ? () => setCurrentView('workspace-management') : undefined}
                onDownloadFile={handleDownloadFile}
                onDownloadAllAsZip={handleDownloadAllAsZip}
                wordWrap={settings.wordWrap}
                showAllChars={showAllChars}
                theme={settings.theme}
                syncing={syncing}
                syncStatus={syncStatus}
                user={user}
            />

            {/* Main content area: Sidebar + (Tabs + Editor) */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* Sidebar Overlay (Mobile only) */}
                {isMobile && settings.sidebarOpen && (
                    <div 
                        style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(0,0,0,0.5)' }} 
                        onClick={toggleSidebar} 
                    />
                )}
                
                {/* Sidebar */}
                <Sidebar
                    notes={workspaceNotes}
                    activeId={settings.activeTabId}
                    onFileClick={openTab}
                    onNewFile={handleNewFile}
                    onRename={handleRenameOpen}
                    onDelete={handleDeleteNote}
                    theme={settings.theme}
                    visible={settings.sidebarOpen}
                    isMobile={isMobile}
                    activeWorkspaceName={activeWorkspace?.name}
                />

                {/* Tabs + Editor column */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    {currentView === 'workspace-management' ? (
                        <WorkspaceLayout
                            workspaces={workspaces}
                            activeWorkspaceId={activeWorkspaceId}
                            notes={notes}
                            palette={p}
                            loading={syncing}
                            onSelect={(id) => { switchWorkspace(id); setCurrentView('editor'); }}
                            onCreate={async (name) => {
                                await createWorkspace(name);
                                showSnackbar(`Workspace "${name}" created`, 'success');
                            }}
                            onRename={(id, newName) => {
                                renameWorkspace(id, newName);
                                showSnackbar(`Workspace renamed to "${newName}"`, 'success');
                            }}
                            onDelete={(id: string) => {
                                const ws = workspaces.find((w) => w.id === id);
                                const fallback = workspaces.find((w) => w.id !== id);
                                if (fallback) {
                                    reassignNotesToWorkspace(id, fallback.id);
                                }
                                deleteWorkspace(id);
                                showSnackbar(`Workspace "${ws?.name || ''}" deleted`, 'success');
                            }}
                        />
                    ) : !compareMode ? (
                        <>
                            {/* Tab Bar */}
                            <Tabs
                                tabs={openTabs}
                                activeId={settings.activeTabId}
                                dirtyIds={dirtyIds}
                                onTabClick={setActiveTab}
                                onTabClose={closeTab}
                                onCloseAll={handleCloseAllFiles}
                                onCloseOthers={handleCloseOthers}
                                onReorder={reorderTabs}
                                onRename={handleRenameOpen}
                                theme={settings.theme}
                            />

                            {/* Editor */}
                            <Editor
                                note={activeNote}
                                theme={settings.theme}
                                wordWrap={settings.wordWrap}
                                fontSize={fontSize}
                                showAllChars={showAllChars}
                                showMinimap={showMinimap}
                                onChange={handleUpdateContent}
                                onCursorChange={handleCursorChange}
                                editorRef={editorRef}
                            />
                        </>
                    ) : (() => {
                        const targetNote = notes.find(n => n.id === compareTargetId);
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '4px 16px', background: isDark ? '#252526' : '#f0f0f0',
                                    borderBottom: `1px solid ${isDark ? '#3c3c3c' : '#bcbcbc'}`, fontSize: 13
                                }}>
                                    <div style={{ color: isDark ? '#e0e0e0' : '#333' }}>
                                        <strong>{targetNote?.name}</strong> (Original) <span>&rarr;</span> <strong>{activeNote?.name}</strong> (Modified)
                                    </div>
                                    <Button size="small" variant="contained" color="primary" onClick={handleCompareExit} disableElevation style={{ borderRadius: 0, textTransform: 'none', height: 24, padding: '0 8px' }}>
                                        Close Compare Mode
                                    </Button>
                                </div>
                                <DiffEditor
                                    theme={isDark ? 'vs-dark' : 'eye-protection'}
                                    beforeMount={(monaco) => {
                                        monaco.editor.defineTheme('eye-protection', {
                                            base: 'vs',
                                            inherit: true,
                                            rules: [],
                                            colors: {
                                                'editor.background': '#DFEEDD',
                                                'editor.lineHighlightBackground': '#CFE6CD',
                                                'editorLineNumber.foreground': '#7A997A',
                                                'editorIndentGuide.background': '#BCE2C1',
                                                'editorGutter.background': '#DFEEDD',
                                            }
                                        });
                                    }}
                                    original={targetNote?.content || ''}
                                    modified={activeNote?.content || ''}
                                    language={activeNote?.language || 'plaintext'}
                                    options={{
                                        readOnly: true,
                                        wordWrap: settings.wordWrap ? 'on' : 'off',
                                        fontSize,
                                        fontFamily: "'Courier New', 'Consolas', monospace",
                                        minimap: { enabled: showMinimap },
                                        renderWhitespace: showAllChars ? 'all' : 'none',
                                    }}
                                />
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Status Bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 24,
                    background: isDark ? '#202020' : '#f0f0f0',
                    borderTop: `1px solid ${isDark ? '#555' : '#a0a0a0'}`,
                    padding: '0 8px',
                    fontSize: '12px',
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    color: isDark ? '#c0c0c0' : '#000',
                    flexShrink: 0,
                    userSelect: 'none',
                    gap: 1,
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                }}
            >
                {/* Left: Ln, Col, Sel */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, minWidth: 0,
                    borderRight: `1px solid ${isDark ? '#555' : '#a0a0a0'}`,
                    paddingRight: 8,
                }}>
                    <span>Ln : {cursorLine}</span>
                    <span>Col : {cursorCol}</span>
                    {!isMobile && <span>Sel : {selChars}{selLines > 0 ? ` | ${selLines}` : ''}</span>}
                </div>

                {/* Center: Doc stats + Sync status */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16,
                    borderLeft: `1px solid ${isDark ? '#444' : '#ffffff'}`,
                    borderRight: isMobile ? 'none' : `1px solid ${isDark ? '#555' : '#a0a0a0'}`,
                    padding: isMobile ? '0 8px' : '0 16px',
                }}>
                    {!isMobile && <span>length : {docLength}</span>}
                    {!isMobile && <span>lines : {docLines}</span>}
                    {user && (
                        <span style={{
                            color: syncStatus === 'synced' ? '#4caf50' :
                                syncStatus === 'syncing' ? '#ff9800' :
                                syncStatus === 'error' ? '#f44336' :
                                isDark ? '#888' : '#999',
                            whiteSpace: 'nowrap'
                        }}>
                            {syncStatus === 'syncing' ? 'Syncing...' :
                             syncStatus === 'synced' ? (isMobile ? 'Synced' : `Synced ${formatSyncTime(lastSyncTime)}`) :
                             syncStatus === 'error' ? 'Sync error' :
                             'Not synced'}
                        </span>
                    )}
                </div>

                {/* Right: EOL, Encoding, INS/OVR */}
                {!isMobile && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 16, minWidth: 0,
                        borderLeft: `1px solid ${isDark ? '#444' : '#ffffff'}`,
                        paddingLeft: 16,
                    }}>
                        <span>{eol}</span>
                        <span>{encoding}</span>
                        <span
                            style={{ cursor: 'pointer', minWidth: 32 }}
                            onClick={() => setInsertMode(!insertMode)}
                        >
                            {insertMode ? 'INS' : 'OVR'}
                        </span>
                    </div>
                )}
            </div>

            {/* About Dialog */}
            <AboutDialog
                open={aboutOpen}
                onClose={() => setAboutOpen(false)}
                theme={settings.theme}
            />

            {/* Rename Dialog */}
            <RenameDialog
                open={renameDialog.open}
                initialName={renameDialog.name}
                onClose={() => setRenameDialog({ open: false, noteId: '', name: '' })}
                onRename={(newName) => {
                    handleRenameNote(renameDialog.noteId, newName);
                    setRenameDialog({ open: false, noteId: '', name: '' });
                }}
            />

            {/* Settings Dialog (JSON) */}
            <SettingsDialog
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
                settings={settings}
                onSaveSettings={(newSettings) => {
                    setSettings(newSettings);
                    showSnackbar('Settings updated successfully', 'success');
                }}
                theme={settings.theme}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ mt: 5 }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Compare Dialog */}
            <CompareDialog
                open={compareDialogOpen}
                onClose={() => setCompareDialogOpen(false)}
                currentNote={activeNote}
                notes={workspaceNotes}
                onCompare={handleCompareProcess}
                theme={settings.theme}
            />
        </div>
    );
};

export default EditorPage;
