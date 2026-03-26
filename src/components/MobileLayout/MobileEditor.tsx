import React, { useEffect, useRef } from 'react';
import type { Note } from '../../types/Note';

interface MobileEditorProps {
    note: Note | null;
    theme: 'light' | 'dark';
    wordWrap: boolean;
    fontSize: number;
    onChange: (id: string, content: string) => void;
}

const MobileEditor: React.FC<MobileEditorProps> = ({ note, theme, wordWrap, fontSize, onChange }) => {
    const isDark = theme === 'dark';
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync textarea value when the active note changes
    useEffect(() => {
        if (textareaRef.current && note) {
            textareaRef.current.value = note.content;
        }
    }, [note?.id]); // Only re-sync when note ID changes (not on every content change)

    if (!note) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', color: isDark ? '#555' : '#ccc',
                fontFamily: "'Segoe UI', sans-serif",
            }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>No file open</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Tap ＋ to create a new file</div>
            </div>
        );
    }

    return (
        <textarea
            ref={textareaRef}
            defaultValue={note.content}
            onChange={(e) => onChange(note.id, e.target.value)}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            style={{
                width: '100%',
                height: '100%',
                resize: 'none',
                border: 'none',
                outline: 'none',
                padding: '12px 16px',
                boxSizing: 'border-box',
                fontSize: `${fontSize}px`,
                lineHeight: 1.6,
                fontFamily: "'Courier New', 'Consolas', monospace",
                background: isDark ? '#1e1e1e' : '#ffffff',
                color: isDark ? '#d4d4d4' : '#1a1a1a',
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                overflowWrap: wordWrap ? 'break-word' : 'normal',
                overflowX: wordWrap ? 'hidden' : 'auto',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                caretColor: isDark ? '#fff' : '#000',
            }}
        />
    );
};

export default React.memo(MobileEditor);
