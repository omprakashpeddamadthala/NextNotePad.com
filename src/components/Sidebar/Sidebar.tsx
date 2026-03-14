import React, { useState, useMemo } from 'react';
import type { Note } from '../../types/Note';

interface SidebarProps {
    notes: Note[];
    activeId: string | null;
    onFileClick: (id: string) => void;
    onNewFile: () => void;
    onRename: (id: string) => void;
    onDelete: (id: string) => void;
    theme: 'light' | 'dark';
    visible: boolean;
    isMobile?: boolean;
}

function getFileIconColor(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js': case 'jsx': return '#f0db4f';
        case 'ts': case 'tsx': return '#3178c6';
        case 'html': case 'htm': return '#e44d26';
        case 'css': return '#264de4';
        case 'json': return '#5b9a4e';
        case 'py': return '#3776ab';
        case 'java': return '#b07219';
        case 'md': return '#519aba';
        case 'xml': return '#f16529';
        case 'sql': return '#e38c00';
        case 'c': case 'cpp': case 'h': return '#659ad2';
        case 'go': return '#00add8';
        case 'rs': return '#dea584';
        case 'rb': return '#cc342d';
        case 'php': return '#8993be';
        case 'sh': case 'bash': return '#89e051';
        default: return '#808080';
    }
}

function formatTime(ts: number): string {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const Sidebar: React.FC<SidebarProps> = ({
    notes, activeId, onFileClick, onNewFile, onRename, onDelete, theme, visible, isMobile,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);
    const isDark = theme === 'dark';

    const filteredNotes = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return notes
            .filter((n) => n.name.toLowerCase().includes(q))
            .sort((a, b) => b.lastModified - a.lastModified);
    }, [notes, searchQuery]);

    if (!visible) return null;

    return (
        <>
            <div
                style={{
                    width: 250,
                    minWidth: 200,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: isDark ? '#252526' : '#ffffff',
                    borderRight: `1px solid ${isDark ? '#3c3c3c' : '#bcbcbc'}`,
                    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                    fontSize: '13px',
                    flexShrink: 0,
                    userSelect: 'none',
                    ...(isMobile ? {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        zIndex: 10,
                        boxShadow: '2px 0 8px rgba(0,0,0,0.5)',
                    } : {}),
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderBottom: `1px solid ${isDark ? '#3c3c3c' : '#bcbcbc'}`,
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: isDark ? '#999' : '#666',
                    }}
                >
                    <span>Files ({filteredNotes.length})</span>
                    <button
                        onClick={onNewFile}
                        title="New File"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '16px', lineHeight: 1, padding: '0 2px',
                            color: isDark ? '#ccc' : '#555',
                        }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? '#fff' : '#000'; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? '#ccc' : '#555'; }}
                    >
                        +
                    </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: '6px 8px' }}>
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            height: 26,
                            padding: '0 8px',
                            fontSize: '12px',
                            border: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                            borderRadius: 0,
                            background: isDark ? '#3c3c3c' : '#ffffff',
                            color: isDark ? '#e0e0e0' : '#1a1a1a',
                            outline: 'none',
                            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = isDark ? '#007acc' : '#0078d4'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? '#555' : '#bcbcbc'; }}
                    />
                </div>

                {/* File List */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {filteredNotes.length === 0 && (
                        <div style={{
                            padding: '20px 16px', textAlign: 'center',
                            color: isDark ? '#666' : '#999', fontSize: '12px',
                        }}>
                            {searchQuery ? 'No matching files' : 'No files yet'}
                        </div>
                    )}
                    {filteredNotes.map((note) => {
                        const isActive = note.id === activeId;
                        const iconColor = getFileIconColor(note.name);

                        return (
                            <div
                                key={note.id}
                                onClick={() => onFileClick(note.id)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({ x: e.clientX, y: e.clientY, noteId: note.id });
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '5px 10px',
                                    cursor: 'default',
                                    background: isActive
                                        ? isDark ? '#37373d' : '#e8e8e8'
                                        : 'transparent',
                                    color: isDark ? '#e0e0e0' : '#000000',
                                    borderLeft: isActive
                                        ? `3px solid #ff8c00`
                                        : '3px solid transparent',
                                }}
                                onMouseOver={(e) => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = isDark ? '#2a2d2e' : '#f0f0f0';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }
                                }}
                            >
                                {/* File type dot */}
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: iconColor, flexShrink: 0,
                                }} />

                                {/* File info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '12px', whiteSpace: 'nowrap',
                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {note.name}
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        color: isDark ? '#666' : '#999',
                                        marginTop: 1,
                                    }}>
                                        {formatTime(note.lastModified)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right-click Context Menu */}
            {contextMenu && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                        onClick={() => setContextMenu(null)}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            top: contextMenu.y,
                            left: contextMenu.x,
                            background: isDark ? '#2d2d2d' : '#f5f5f5',
                            border: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                            borderRadius: 2,
                            boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
                            zIndex: 1000,
                            minWidth: 150,
                            padding: '4px 0',
                        }}
                    >
                        <div
                            onClick={() => {
                                onFileClick(contextMenu.noteId);
                                setContextMenu(null);
                            }}
                            style={{
                                padding: '4px 16px', cursor: 'default', fontSize: '13px',
                                color: isDark ? '#e0e0e0' : '#1a1a1a',
                            }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? '#094771' : '#d6e4f2'; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                            Open
                        </div>
                        <div
                            onClick={() => {
                                onRename(contextMenu.noteId);
                                setContextMenu(null);
                            }}
                            style={{
                                padding: '4px 16px', cursor: 'default', fontSize: '13px',
                                color: isDark ? '#e0e0e0' : '#1a1a1a',
                            }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? '#094771' : '#d6e4f2'; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                            Rename
                        </div>
                        <div style={{
                            height: 1, margin: '4px 0',
                            background: isDark ? '#444' : '#ddd',
                        }} />
                        <div
                            onClick={() => {
                                onDelete(contextMenu.noteId);
                                setContextMenu(null);
                            }}
                            style={{
                                padding: '4px 16px', cursor: 'default', fontSize: '13px',
                                color: '#e74c3c',
                            }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? '#094771' : '#d6e4f2'; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                            Delete
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default React.memo(Sidebar);
