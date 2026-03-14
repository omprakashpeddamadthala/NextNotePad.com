import React, { useState, useMemo } from 'react';
import type { Note } from '../../types/Note';
import { getPalette } from '../../theme/colors';

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
    activeWorkspaceName?: string;
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
    notes, activeId, onFileClick, onNewFile, onRename, onDelete, theme, visible, isMobile, activeWorkspaceName,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);
    const p = getPalette(theme);

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
            width: 250, minWidth: 200, height: '100%',
            display: 'flex', flexDirection: 'column',
            background: p.panel,
            borderRight: `1px solid ${p.border}`,
            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
            fontSize: '13px', flexShrink: 0, userSelect: 'none',
            ...(isMobile ? { position: 'absolute', left: 0, top: 0, zIndex: 10, boxShadow: '2px 0 12px rgba(0,0,0,0.4)' } : {}),
        }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderBottom: `1px solid ${p.border}`,
                    fontSize: '11px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.5px', color: p.textDim,
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                        Files
                        {activeWorkspaceName && (
                            <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}
                                title={activeWorkspaceName}>
                                · {activeWorkspaceName}
                            </span>
                        )}
                        <span style={{ color: p.textMute, fontWeight: 400 }}>({filteredNotes.length})</span>
                    </span>
                    <button onClick={onNewFile} title="New File"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px', color: p.textDim }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = p.text; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = p.textDim; }}
                    >+</button>
                </div>

                {/* Search */}
                <div style={{ padding: '6px 8px' }}>
                    <input type="text" placeholder="Search files..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%', height: 26, padding: '0 8px', fontSize: '12px',
                            border: `1px solid ${p.border}`, borderRadius: 4,
                            background: p.bg, color: p.text, outline: 'none',
                            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = p.accent; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = p.border; }}
                    />
                </div>

                {/* File List */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {filteredNotes.length === 0 && (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: p.textDim, fontSize: '12px' }}>
                            {searchQuery ? 'No matching files' : 'No files yet'}
                        </div>
                    )}
                    {filteredNotes.map((note) => {
                        const isActive = note.id === activeId;
                        const iconColor = getFileIconColor(note.name);
                        return (
                            <div key={note.id}
                                onClick={() => onFileClick(note.id)}
                                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, noteId: note.id }); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '5px 10px', cursor: 'default',
                                    background: isActive ? p.active : 'transparent',
                                    color: p.text,
                                    borderLeft: isActive ? `3px solid ${p.accent}` : '3px solid transparent',
                                    transition: 'background 0.1s',
                                }}
                                onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = p.hover; }}
                                onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: iconColor, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.name}</div>
                                    <div style={{ fontSize: '10px', color: p.textDim, marginTop: 1 }}>{formatTime(note.lastModified)}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right-click Context Menu */}
            {contextMenu && (
                <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setContextMenu(null)} />
                    <div style={{
                        position: 'fixed', top: contextMenu.y, left: contextMenu.x,
                        background: p.panel, border: `1px solid ${p.border}`,
                        borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                        zIndex: 1000, minWidth: 150, padding: '4px 0',
                    }}>
                        {[['Open', () => { onFileClick(contextMenu.noteId); setContextMenu(null); }],
                          ['Rename', () => { onRename(contextMenu.noteId); setContextMenu(null); }],
                        ].map(([label, action]) => (
                            <div key={label as string}
                                onClick={action as () => void}
                                style={{ padding: '5px 16px', cursor: 'default', fontSize: '13px', color: p.text }}
                                onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = p.hover; }}
                                onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >{label as string}</div>
                        ))}
                        <div style={{ height: 1, margin: '4px 0', background: p.border }} />
                        <div onClick={() => { onDelete(contextMenu.noteId); setContextMenu(null); }}
                            style={{ padding: '5px 16px', cursor: 'default', fontSize: '13px', color: p.danger }}
                            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = p.hover; }}
                            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >Delete</div>
                    </div>
                </>
            )}
        </>
    );
};

export default React.memo(Sidebar);
