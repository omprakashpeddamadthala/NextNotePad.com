import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Snackbar, Alert, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, TextField,
} from '@mui/material';
import MenuBar from '../components/MenuBar/MenuBar';
import NppToolbar from '../components/NppToolbar/NppToolbar';
import Tabs from '../components/Tabs/Tabs';
import Editor from '../components/Editor/Editor';
import Sidebar from '../components/Sidebar/Sidebar';
import { useNotes } from '../hooks/useNotes';
import { useGoogleLogin } from '@react-oauth/google';
import type { GoogleUser } from '../services/authService';
import {
    fetchUserProfile, setAccessToken, getAccessToken, clearAccessToken,
} from '../services/authService';
import {
    getOrCreateBackupFolder, uploadNoteToDrive, listDriveNotes, downloadNoteFromDrive,
} from '../services/googleDriveService';
import { downloadFile, downloadAllAsZip } from '../services/fileExportService';
import type * as monaco from 'monaco-editor';

const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

const EditorPage: React.FC = () => {
    const {
        notes, setNotes, activeNote, openTabs, dirtyIds, settings,
        createNote, deleteNote, renameNote, updateContent,
        openTab, closeTab, setActiveTab, reorderTabs,
        toggleWordWrap, toggleSidebar, setTheme,
    } = useNotes();

    const [fontSize, setFontSize] = useState(14);
    const [showAllChars, setShowAllChars] = useState(false);
    const [showMinimap, setShowMinimap] = useState(false);
    const [cursorLine, setCursorLine] = useState(1);
    const [cursorCol, setCursorCol] = useState(1);
    const [selChars, setSelChars] = useState(0);
    const [selLines, setSelLines] = useState(0);
    const [encoding, setEncoding] = useState('UTF-8');
    const eol = 'Windows (CR LF)';
    const [insertMode, setInsertMode] = useState(true);
    const [clock, setClock] = useState('');

    const [user, setUser] = useState<GoogleUser | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({ open: false, message: '', severity: 'info' });
    const [aboutOpen, setAboutOpen] = useState(false);
    const [renameDialog, setRenameDialog] = useState<{ open: boolean; noteId: string; name: string }>({ open: false, noteId: '', name: '' });
    const [isDragging, setIsDragging] = useState(false);

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const autoSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const handleSyncRef = useRef<(() => void) | null>(null);
    const isDark = settings.theme === 'dark';

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // Live clock
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

    // Google Auth
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setAccessToken(tokenResponse.access_token);
                const profile = await fetchUserProfile(tokenResponse.access_token);
                setUser(profile);
                showSnackbar(`Signed in as ${profile.name}`, 'success');
                // Hybrid mode: auto-sync on login
                setTimeout(() => {
                    handleSync();
                }, 500);
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
        if (autoSyncTimerRef.current) {
            clearInterval(autoSyncTimerRef.current);
            autoSyncTimerRef.current = null;
        }
        showSnackbar('Signed out', 'info');
    }, []);

    const handleSync = useCallback(async () => {
        const accessToken = getAccessToken();
        if (!accessToken) {
            showSnackbar('Please sign in with Google first', 'info');
            googleLogin();
            return;
        }
        setSyncing(true);
        setSyncStatus('syncing');
        try {
            const folderId = await getOrCreateBackupFolder(accessToken);
            const driveFiles = await listDriveNotes(accessToken, folderId);
            const updatedNotes = [...notes];
            for (let i = 0; i < updatedNotes.length; i++) {
                const note = updatedNotes[i];
                const existingDriveFile = driveFiles.find((f) => f.name === note.name);
                const driveFileId = await uploadNoteToDrive(
                    accessToken, folderId, note.name, note.content,
                    existingDriveFile?.id || note.driveFileId
                );
                updatedNotes[i] = { ...note, driveFileId };
            }
            for (const driveFile of driveFiles) {
                const existsLocally = updatedNotes.some((n) => n.name === driveFile.name);
                if (!existsLocally) {
                    const content = await downloadNoteFromDrive(accessToken, driveFile.id);
                    const { v4: uuidv4 } = await import('uuid');
                    const { getLanguageFromFilename } = await import('../types/Note');
                    updatedNotes.push({
                        id: uuidv4(), name: driveFile.name, content,
                        language: getLanguageFromFilename(driveFile.name),
                        lastModified: new Date(driveFile.modifiedTime).getTime(),
                        driveFileId: driveFile.id,
                    });
                }
            }
            // Use functional updater to merge sync results without overwriting concurrent edits
            setNotes(currentNotes => {
                const merged = currentNotes.map(n => {
                    const synced = updatedNotes.find(u => u.id === n.id);
                    return synced ? { ...n, driveFileId: synced.driveFileId } : n;
                });
                const newFromDrive = updatedNotes.filter(u => !currentNotes.some(n => n.id === u.id));
                return [...merged, ...newFromDrive];
            });
            setSyncStatus('synced');
            setLastSyncTime(Date.now());
            showSnackbar(`Synced ${updatedNotes.length} notes with Google Drive`, 'success');
        } catch (err) {
            console.error('Sync error:', err);
            setSyncStatus('error');
            showSnackbar('Sync failed. Please try again.', 'error');
        } finally {
            setSyncing(false);
        }
    }, [notes, setNotes, googleLogin]);

    // Keep handleSyncRef up-to-date so the stable timer always calls latest handleSync
    useEffect(() => {
        handleSyncRef.current = handleSync;
    }, [handleSync]);

    // Auto-sync timer: sync every 5 minutes when logged in
    // Only depends on `user` so the interval is not reset on every keystroke
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        createNote();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleSaveFile();
                            showSnackbar('All files saved to browser storage', 'success');
                        } else {
                            handleSaveFile();
                        }
                        break;
                    case 'o':
                        e.preventDefault();
                        handleOpenFile();
                        break;
                    case 'w':
                        e.preventDefault();
                        if (activeNote) closeTab(activeNote.id);
                        break;
                    case 'insert':
                        setInsertMode((prev) => !prev);
                        break;
                }
            }
            if (e.key === 'Insert' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                setInsertMode((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createNote, closeTab, activeNote]);

    // Drag and drop file import
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        let imported = 0;
        for (const file of Array.from(files)) {
            try {
                const content = await file.text();
                const note = createNote(file.name);
                updateContent(note.id, content);
                imported++;
            } catch (err) {
                console.error('Failed to read dropped file:', err);
                showSnackbar(`Failed to import ${file.name}`, 'error');
            }
        }
        if (imported > 0) showSnackbar(`Imported ${imported} file(s)`, 'success');
    }, [createNote, updateContent]);

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
                    updateContent(activeNote.id, formatted);
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
    }, [activeNote, updateContent]);

    // Minimap toggle
    const handleToggleMinimap = useCallback(() => setShowMinimap((prev) => !prev), []);

    // Zoom
    const handleZoomIn = useCallback(() => setFontSize((prev) => Math.min(prev + 2, 40)), []);
    const handleZoomOut = useCallback(() => setFontSize((prev) => Math.max(prev - 2, 8)), []);
    const handleZoomReset = useCallback(() => setFontSize(14), []);

    // File operations
    const handleNewFile = useCallback(() => createNote(), [createNote]);
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
                const note = createNote(file.name);
                updateContent(note.id, content);
            }
        };
        input.click();
    }, [createNote, updateContent]);
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
        if (notes.length === 0) {
            showSnackbar('No files to download', 'info');
            return;
        }
        try {
            await downloadAllAsZip(notes);
            showSnackbar(`Downloaded ${notes.length} files as ZIP`, 'success');
        } catch (err) {
            console.error('ZIP export error:', err);
            showSnackbar('Failed to create ZIP', 'error');
        }
    }, [notes]);

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
        if (!hasSelection) updateContent(activeNote.id, sorted);
        showSnackbar('Lines sorted', 'success');
    }, [activeNote, updateContent]);

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
        updateContent(activeNote.id, unique);
        showSnackbar('Duplicate lines removed', 'success');
    }, [activeNote, updateContent]);

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
        updateContent(activeNote.id, trimmed);
        showSnackbar('Trailing whitespace removed', 'success');
    }, [activeNote, updateContent]);

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

    // Encoding/Language/EOL
    const handleSetEncoding = useCallback((enc: string) => setEncoding(enc), []);
    const handleSetLanguage = useCallback((lang: string) => {
        if (activeNote) {
            renameNote(activeNote.id, activeNote.name); // Keep same name
            // Update language through renaming with the correct extension isn't great,
            // so we just update the note's language in the notes array
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
    const handleRenameConfirm = useCallback(() => {
        if (renameDialog.name.trim()) {
            renameNote(renameDialog.noteId, renameDialog.name.trim());
        }
        setRenameDialog({ open: false, noteId: '', name: '' });
    }, [renameDialog, renameNote]);

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
                background: isDark ? '#1e1e1e' : '#ffffff',
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
                    background: isDark ? 'rgba(0, 122, 204, 0.15)' : 'rgba(0, 120, 212, 0.1)',
                    border: `3px dashed ${isDark ? '#007acc' : '#0078d4'}`,
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
            }}>
                <div style={{ flex: 1 }}>
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
                    />
                </div>
                <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isDark ? '#c0c0c0' : '#444',
                    padding: '0 10px',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                }}>
                    {clock}
                </div>
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
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <Sidebar
                    notes={notes}
                    activeId={settings.activeTabId}
                    onFileClick={openTab}
                    onNewFile={handleNewFile}
                    onRename={handleRenameOpen}
                    onDelete={deleteNote}
                    theme={settings.theme}
                    visible={settings.sidebarOpen}
                />

                {/* Tabs + Editor column */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
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
                        onChange={updateContent}
                        onCursorChange={handleCursorChange}
                        editorRef={editorRef}
                    />
                </div>
            </div>

            {/* Status Bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: 24,
                    background: isDark ? '#333333' : '#e8e8e8',
                    borderTop: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                    padding: '0 8px',
                    fontSize: '12px',
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    color: isDark ? '#c0c0c0' : '#444',
                    flexShrink: 0,
                    userSelect: 'none',
                    gap: 4,
                }}
            >
                {/* Left: Ln, Col, Sel */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                    <span>Ln : {cursorLine}</span>
                    <span>Col : {cursorCol}</span>
                    <span>Sel : {selChars}{selLines > 0 ? ` | ${selLines}` : ''}</span>
                </div>

                {/* Center: Doc stats + Sync status */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    borderLeft: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                    borderRight: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                    padding: '0 16px',
                }}>
                    <span>length : {docLength}</span>
                    <span>lines : {docLines}</span>
                    {user && (
                        <span style={{
                            color: syncStatus === 'synced' ? '#4caf50' :
                                syncStatus === 'syncing' ? '#ff9800' :
                                syncStatus === 'error' ? '#f44336' :
                                isDark ? '#888' : '#999',
                        }}>
                            {syncStatus === 'syncing' ? 'Syncing...' :
                             syncStatus === 'synced' ? `Synced ${formatSyncTime(lastSyncTime)}` :
                             syncStatus === 'error' ? 'Sync error' :
                             'Not synced'}
                        </span>
                    )}
                </div>

                {/* Right: EOL, Encoding, INS/OVR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                    <span>{eol}</span>
                    <span>{encoding}</span>
                    <span
                        style={{ cursor: 'pointer' }}
                        onClick={() => setInsertMode(!insertMode)}
                    >
                        {insertMode ? 'INS' : 'OVR'}
                    </span>
                </div>
            </div>

            {/* About Dialog */}
            <Dialog
                open={aboutOpen}
                onClose={() => setAboutOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: isDark ? '#1e1e1e' : '#ffffff',
                        color: isDark ? '#e0e0e0' : '#1a1a1a',
                        border: `1px solid ${isDark ? '#444' : '#ddd'}`,
                    },
                }}
            >
                <DialogTitle sx={{
                    fontFamily: "'Segoe UI', sans-serif",
                    color: isDark ? '#e0e0e0' : '#1a1a1a',
                    borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`,
                    pb: 1.5,
                }}>
                    About NextNotePad.com
                </DialogTitle>
                <DialogContent sx={{ pt: '16px !important' }}>
                    <div style={{
                        textAlign: 'center',
                        marginBottom: 16,
                        padding: '12px 0',
                        borderBottom: `1px solid ${isDark ? '#333' : '#eee'}`,
                    }}>
                        <div style={{
                            fontSize: 22, fontWeight: 700,
                            color: isDark ? '#e0e0e0' : '#222',
                        }}>
                            NextNotePad.com
                        </div>
                        <div style={{
                            fontSize: 13, marginTop: 4,
                            color: isDark ? '#007acc' : '#0078d4',
                            fontWeight: 500,
                        }}>
                            Version 2.0.0
                        </div>
                        <div style={{
                            fontSize: 12, marginTop: 6,
                            color: isDark ? '#888' : '#888',
                        }}>
                            Write. Code. Create — Anywhere.
                            <br />A powerful browser-based code editor built with React, Monaco Editor &amp; Material-UI.
                        </div>
                    </div>

                    {[
                        { icon: '✏️', title: 'Code Editor', desc: 'Syntax highlighting for 50+ languages • Line numbers & code folding • Find & Replace (Ctrl+F/H) • Go to Line (Ctrl+G) • Word wrap • Zoom in/out • Auto-indent & bracket matching' },
                        { icon: '📁', title: 'File Management', desc: 'Create, rename & delete files • Open from computer • Drag & drop import • Multi-tab editing with drag reorder • Sidebar with search • Right-click menus • Auto-save to browser • Download files • Export all as ZIP' },
                        { icon: '✨', title: 'Format Text', desc: 'Auto-detects & formats JSON, XML, HTML, CSS, SQL • Works on selection or full file • Pretty-print & indentation' },
                        { icon: '☁️', title: 'Cloud Sync', desc: 'Google Sign-In • Auto-sync to Google Drive every 5 min • Manual sync • Backup & restore • Access files anywhere • Sync status indicator' },
                        { icon: '🎨', title: 'Customization', desc: 'Dark & Light themes • UTF-8, ANSI, UCS-2 encodings • Line ending options • Language selection • Toggle sidebar & minimap • Font size control' },
                        { icon: '🔌', title: 'Plugins', desc: 'Word count • Sort lines • Remove duplicates • Trim whitespace • UPPERCASE/lowercase conversion • Run HTML/JS in browser' },
                    ].map((section) => (
                        <div key={section.title} style={{ marginBottom: 12 }}>
                            <div style={{
                                fontSize: 13, fontWeight: 600,
                                color: isDark ? '#e0e0e0' : '#222',
                                marginBottom: 3,
                            }}>
                                {section.icon} {section.title}
                            </div>
                            <div style={{
                                fontSize: 12, lineHeight: 1.6,
                                color: isDark ? '#999' : '#666',
                                paddingLeft: 8,
                            }}>
                                {section.desc}
                            </div>
                        </div>
                    ))}

                    <div style={{
                        textAlign: 'center', marginTop: 16, paddingTop: 12,
                        borderTop: `1px solid ${isDark ? '#333' : '#eee'}`,
                        fontSize: 11, color: isDark ? '#555' : '#bbb',
                    }}>
                        © 2026 NextNotePad.com. All rights reserved.
                    </div>
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${isDark ? '#333' : '#eee'}` }}>
                    <Button
                        onClick={() => setAboutOpen(false)}
                        sx={{ color: isDark ? '#007acc' : '#0078d4' }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog
                open={renameDialog.open}
                onClose={() => setRenameDialog({ open: false, noteId: '', name: '' })}
                maxWidth="xs" fullWidth
            >
                <DialogTitle>Rename File</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus fullWidth margin="dense" label="File name"
                        value={renameDialog.name}
                        onChange={(e) => setRenameDialog((s) => ({ ...s, name: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameDialog({ open: false, noteId: '', name: '' })}>Cancel</Button>
                    <Button onClick={handleRenameConfirm} variant="contained">Rename</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default EditorPage;
