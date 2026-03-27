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
    loading?: boolean;
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



const Sidebar: React.FC<SidebarProps> = ({
    notes, activeId, onFileClick, onNewFile, onRename, onDelete, theme, visible, isMobile, activeWorkspaceName, loading,
}) => {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);
    const p = getPalette(theme);

    const filteredNotes = useMemo(() => {
        return [...notes].sort((a, b) => b.lastModified - a.lastModified);
    }, [notes]);

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
                <div 
                    title={activeWorkspaceName || 'Workspace'}
                    style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '2px 6px',
                    borderBottom: `1px solid ${p.border}`,
                    background: theme === 'dark' ? '#2d2d2d' : '#e5f1fb',
                    fontSize: '12px', color: p.text,
                }}>
                    <span style={{ fontWeight: 600 }}>{activeWorkspaceName || 'Workspace'}</span>
                    <button onClick={() => { /* assume we just hide it by parent */ }} title="Close"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: '0 2px', color: p.text }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = '#e81123'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = p.text; }}
                    >×</button>
                </div>



                {/* File List */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {loading && (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: p.textDim, fontSize: '12px' }}>
                            <div style={{
                                width: 16, height: 16, border: `2px solid ${p.textDim}`,
                                borderTopColor: p.accent || '#007acc', borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                display: 'inline-block', marginBottom: 6,
                            }} />
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            <div>Loading files...</div>
                        </div>
                    )}
                    {!loading && filteredNotes.length === 0 && (
                        <div style={{ padding: '20px 16px', textAlign: 'center', color: p.textDim, fontSize: '12px' }}>
                            No files yet
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
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '2px 6px', cursor: 'default',
                                    background: isActive ? '#3b82f6' : 'transparent',
                                    color: isActive ? '#fff' : p.text,
                                    transition: 'background 0.1s',
                                }}
                                onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = p.hover; }}
                                onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                <span style={{ width: 8, height: 8, borderRadius: '0', background: iconColor, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.name}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{ padding: '8px', borderTop: `1px solid ${p.border}` }}>
                    <button onClick={onNewFile}
                        style={{
                            width: '100%', padding: '6px', fontSize: '12px',
                            background: p.panelAlt, border: `1px solid ${p.border}`,
                            cursor: 'pointer', color: p.text,
                        }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = p.hover; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = p.panelAlt; }}
                    >
                        + New
                    </button>
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
