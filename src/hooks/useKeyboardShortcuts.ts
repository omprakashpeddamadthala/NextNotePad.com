import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
    onNewFile: () => void;
    onSaveFile: () => void;
    onSaveAllFiles: () => void;
    onOpenFile: () => void;
    onCloseTab: () => void;
    onToggleInsertMode: () => void;
}

export function useKeyboardShortcuts({
    onNewFile,
    onSaveFile,
    onSaveAllFiles,
    onOpenFile,
    onCloseTab,
    onToggleInsertMode,
}: KeyboardShortcutsOptions) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault();
                        onNewFile();
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            onSaveAllFiles();
                        } else {
                            onSaveFile();
                        }
                        break;
                    case 'o':
                        e.preventDefault();
                        onOpenFile();
                        break;
                    case 'w':
                        e.preventDefault();
                        onCloseTab();
                        break;
                    case 'insert':
                        onToggleInsertMode();
                        break;
                }
            }
            if (e.key === 'Insert' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                onToggleInsertMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNewFile, onSaveFile, onSaveAllFiles, onOpenFile, onCloseTab, onToggleInsertMode]);
}
