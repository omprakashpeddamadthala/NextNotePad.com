import React, { useState, useCallback } from 'react';

interface UseDragAndDropOptions {
    onFileCreate: (name: string) => { id: string } | null;
    onContentUpdate: (id: string, content: string) => void;
    onShowSnackbar: (msg: string, severity: 'success' | 'error' | 'info') => void;
}

export function useDragAndDrop({ onFileCreate, onContentUpdate, onShowSnackbar }: UseDragAndDropOptions) {
    const [isDragging, setIsDragging] = useState(false);

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
                const note = onFileCreate(file.name);
                if (note) {
                    onContentUpdate(note.id, content);
                    imported++;
                }
            } catch (err) {
                console.error('Failed to read dropped file:', err);
                onShowSnackbar(`Failed to import ${file.name}`, 'error');
            }
        }
        if (imported > 0) onShowSnackbar(`Imported ${imported} file(s)`, 'success');
    }, [onFileCreate, onContentUpdate, onShowSnackbar]);

    return { isDragging, handleDragOver, handleDragLeave, handleDrop };
}
