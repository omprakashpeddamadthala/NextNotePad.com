import React, { useState, useMemo } from 'react';
import type { Note } from '../../types/Note';
import { getPalette } from '../../theme/colors';

interface SidebarProps {
    notes: Note[];
    activeId: string | null;
    onFileClick: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    theme: 'light' | 'dark';
    visible: boolean;
    isMobile?: boolean;
    activeWorkspaceName?: string;
    loading?: boolean;
}

// Returns extension label and color
function getFileType(name: string): { ext: string; color: string } {
    const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
    const map: Record<string, string> = {
        js: '#f0db4f', jsx: '#61dafb', ts: '#3178c6', tsx: '#3178c6',
        html: '#e44d26', htm: '#e44d26', css: '#264de4', scss: '#cc6699',
        json: '#5b9a4e', py: '#3776ab', java: '#b07219', md: '#519aba',
        xml: '#f16529', sql: '#e38c00', c: '#659ad2', cpp: '#659ad2',
        h: '#659ad2', go: '#00add8', rs: '#dea584', rb: '#cc342d',
        php: '#8993be', sh: '#89e051', bash: '#89e051', yaml: '#cb171e',
        yml: '#cb171e', toml: '#9c4121', vue: '#41b883', svelte: '#ff3e00',
    };
    return { ext: ext || '—', color: map[ext] || '#8b8b8b' };
}

const Sidebar: React.FC<SidebarProps> = ({
    notes, activeId, onFileClick, onRename, onDelete,
    theme, visible, isMobile, activeWorkspaceName, loading,
}) => {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);
    const [search, setSearch] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    
    // Inline Rename state
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const renameInputRef = React.useRef<HTMLInputElement>(null);

    const startRename = (id: string, currentName: string) => {
        setRenamingId(id);
        setRenameValue(currentName);
        setTimeout(() => renameInputRef.current?.focus(), 0);
    };

    const commitRename = () => {
        if (renamingId && renameValue.trim()) {
            onRename(renamingId, renameValue.trim());
        }
        setRenamingId(null);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commitRename();
        if (e.key === 'Escape') setRenamingId(null);
    };

    const p = getPalette(theme);
    const isDark = theme === 'dark';

    const filteredNotes = useMemo(() => {
        const q = search.trim().toLowerCase();
        return [...notes]
            .sort((a, b) => b.lastModified - a.lastModified)
            .filter(n => !q || n.name.toLowerCase().includes(q));
    }, [notes, search]);

    if (!visible) return null;

    const sidebarBg = p.bg;
    const headerBg = p.bg;
    const accentColor = '#ff9900';
    const searchBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)';
    const searchBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const itemActiveBg = isDark ? 'rgba(255,153,0,0.15)' : 'rgba(255,153,0,0.1)';
    const itemHoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    const scrollbarColor = isDark ? '#333647' : '#d0d4e0';

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const now = Date.now();
        const diff = now - ts;
        if (diff < 60_000) return 'just now';
        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <>
            <style>{`
                @keyframes sidebar-spin { to { transform: rotate(360deg); } }
                @keyframes sidebar-fade-in { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
                .sidebar-file-item { animation: sidebar-fade-in 0.15s ease both; }
                .sidebar-scroll::-webkit-scrollbar { width: 4px; }
                .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
                .sidebar-scroll::-webkit-scrollbar-thumb { background: ${scrollbarColor}; border-radius: 10px; }
                .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: ${accentColor}88; }
                .sidebar-search { backdrop-filter: blur(8px); }
                .sidebar-search:focus { border-color: ${accentColor} !important; background: ${isDark ? '#252831' : '#ffffff'} !important; box-shadow: 0 0 0 3px ${accentColor}30, 0 4px 12px rgba(0,0,0,0.05) !important; }
                .sidebar-new-btn:hover { background: ${accentColor} !important; color: #fff !important; border-color: ${accentColor} !important; transform: scale(1.05); box-shadow: 0 4px 12px ${accentColor}44; }
                .sidebar-new-btn:hover .sidebar-plus { color: #fff !important; }
                .sidebar-header { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); z-index: 10; position: relative; }
            `}</style>

            <div
                style={{
                    width: 256, minWidth: 220, height: '100%',
                    display: 'flex', flexDirection: 'column',
                    background: sidebarBg,
                    borderRight: `1px solid ${isDark ? '#2a2d38' : '#e2e5ee'}`,
                    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                    fontSize: '13px', flexShrink: 0, userSelect: 'none',
                    ...(isMobile ? { position: 'absolute', left: 0, top: 0, zIndex: 10, boxShadow: '4px 0 24px rgba(0,0,0,0.45)' } : {}),
                }}
            >
                {/* ── Header ── */}
                <div className="sidebar-header" style={{
                    background: headerBg,
                    borderBottom: `1px solid ${isDark ? '#2a2d38' : '#e2e5ee'}`,
                    padding: '12px 14px 10px',
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            {/* Folder icon */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={accentColor} style={{ flexShrink: 0 }}>
                                <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
                            </svg>
                            <span style={{
                                fontWeight: 700, fontSize: 11, letterSpacing: '0.06em',
                                color: isDark ? '#9ca3c8' : '#6b7390',
                                textTransform: 'uppercase', overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 148,
                            }}
                                title={activeWorkspaceName || 'Explorer'}
                            >
                                {activeWorkspaceName || 'Explorer'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {/* File count badge */}
                            {notes.length > 0 && (
                                <span style={{
                                    fontSize: 10, fontWeight: 700, lineHeight: 1,
                                    background: isDark ? '#2e3248' : '#e6e8f2',
                                    color: isDark ? '#7c84b2' : '#6b739a',
                                    padding: '2px 6px', borderRadius: 10,
                                }}>{notes.length}</span>
                            )}
                        </div>
                    </div>

                    {/* Search Box */}
                    <div style={{ position: 'relative' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#4e5472' : '#adb5cc'}
                            strokeWidth="2.5" strokeLinecap="round"
                            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                        >
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            className="sidebar-search"
                            type="text"
                            placeholder="Search files..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                padding: '6px 8px 6px 28px',
                                background: searchBg,
                                border: `1px solid ${searchBorder}`,
                                borderRadius: 8,
                                color: p.text,
                                fontSize: 13,
                                outline: 'none',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                style={{
                                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: isDark ? '#5a6080' : '#adb5cc', fontSize: 14, lineHeight: 1, padding: 0,
                                }}
                            >×</button>
                        )}
                    </div>
                </div>

                {/* ── File List ── */}
                <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 0' }}>

                    {/* Loading state */}
                    {loading && (
                        <div style={{ padding: '32px 0', textAlign: 'center' }}>
                            <div style={{
                                width: 22, height: 22,
                                border: `2.5px solid ${isDark ? '#2e3248' : '#e2e5ee'}`,
                                borderTopColor: accentColor,
                                borderRadius: '50%',
                                animation: 'sidebar-spin 0.8s linear infinite',
                                margin: '0 auto 10px',
                            }} />
                            <div style={{ fontSize: 12, color: isDark ? '#4e5472' : '#adb5cc', fontWeight: 500 }}>
                                Loading files…
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filteredNotes.length === 0 && (
                        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                stroke={isDark ? '#2e3248' : '#d0d4e0'} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 10 }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                            <div style={{ fontSize: 12, color: isDark ? '#4e5472' : '#b0b7cc', fontWeight: 500 }}>
                                {search ? 'No files match' : 'No files yet'}
                            </div>
                            {!search && (
                                <div style={{ fontSize: 11, color: isDark ? '#363952' : '#c8cddd', marginTop: 4 }}>
                                    Click + to create one
                                </div>
                            )}
                        </div>
                    )}

                    {/* File items */}
                    {filteredNotes.map((note, i) => {
                        const isActive = note.id === activeId;
                        const isHovered = hoveredId === note.id;
                        const { ext, color: iconColor } = getFileType(note.name);
                        const baseName = note.name.includes('.')
                            ? note.name.slice(0, note.name.lastIndexOf('.'))
                            : note.name;
                        const showExt = note.name.includes('.');

                        return (
                            <div
                                key={note.id}
                                className="sidebar-file-item"
                                onClick={() => onFileClick(note.id)}
                                onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, noteId: note.id }); }}
                                onMouseEnter={() => setHoveredId(note.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 9,
                                    padding: '6px 12px 6px 10px', cursor: 'pointer',
                                    marginInline: 4, borderRadius: 7,
                                    background: isActive ? itemActiveBg : isHovered ? itemHoverBg : 'transparent',
                                    borderLeft: `2px solid ${isActive ? accentColor : 'transparent'}`,
                                    transition: 'background 0.1s, border-color 0.1s',
                                    animationDelay: `${i * 0.02}s`,
                                    position: 'relative',
                                }}
                            >
                                {/* File type pill */}
                            <span style={{
                                fontSize: 8.5, fontWeight: 800, letterSpacing: '0.04em',
                                color: iconColor, background: iconColor + '22',
                                padding: '1.5px 4px', borderRadius: 4,
                                flexShrink: 0, minWidth: 22, textAlign: 'center',
                                textTransform: 'uppercase',
                            }}>
                                {ext.slice(0, 4)}
                            </span>

                                {/* File name */}
                                <div style={{ flex: 1, minWidth: 0 }} onDoubleClick={() => startRename(note.id, note.name)}>
                                    {renamingId === note.id ? (
                                        <input
                                            ref={renameInputRef}
                                            type="text"
                                            value={renameValue}
                                            onChange={e => setRenameValue(e.target.value)}
                                            onBlur={commitRename}
                                            onKeyDown={handleRenameKeyDown}
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                width: '100%', boxSizing: 'border-box',
                                                padding: '2px 4px', fontSize: 12.5,
                                                background: isDark ? '#1a1d2e' : '#ffffff',
                                                border: `1px solid ${accentColor}`,
                                                borderRadius: 4, outline: 'none',
                                                color: isDark ? '#fff' : '#000',
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <div style={{
                                                fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                                                color: isActive ? (isDark ? '#fff' : '#1a1d2e') : p.text,
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                lineHeight: 1.3,
                                            }}>
                                                {showExt ? (
                                                    <>
                                                        <span>{baseName}</span>
                                                        <span style={{ color: isDark ? '#4e5472' : '#b0b7cc', fontWeight: 400 }}>
                                                            .{ext}
                                                        </span>
                                                    </>
                                                ) : note.name}
                                            </div>
                                            <div style={{ fontSize: 10, color: isDark ? '#3e4260' : '#c0c5d8', marginTop: 1 }}>
                                                {formatTime(note.lastModified)}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Hover action buttons */}
                                {(isHovered || isActive) && (
                                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}
                                        onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => startRename(note.id, note.name)}
                                            title="Rename"
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                width: 22, height: 22, borderRadius: 5,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: isDark ? '#5a6080' : '#adb5cc',
                                                padding: 0, transition: 'all 0.12s',
                                            }}
                                            onMouseOver={e => {
                                                (e.currentTarget as HTMLElement).style.background = isDark ? '#2e3248' : '#e6e8f2';
                                                (e.currentTarget as HTMLElement).style.color = isDark ? '#9ca3c8' : '#4e5680';
                                            }}
                                            onMouseOut={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'none';
                                                (e.currentTarget as HTMLElement).style.color = isDark ? '#5a6080' : '#adb5cc';
                                            }}
                                        >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onDelete(note.id)}
                                            title="Delete"
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                width: 22, height: 22, borderRadius: 5,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: isDark ? '#5a6080' : '#adb5cc',
                                                padding: 0, transition: 'all 0.12s',
                                            }}
                                            onMouseOver={e => {
                                                (e.currentTarget as HTMLElement).style.background = '#ff444420';
                                                (e.currentTarget as HTMLElement).style.color = '#ff4444';
                                            }}
                                            onMouseOut={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'none';
                                                (e.currentTarget as HTMLElement).style.color = isDark ? '#5a6080' : '#adb5cc';
                                            }}
                                        >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <polyline points="3 6 5 6 21 6"/>
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Right-click Context Menu ── */}
            {contextMenu && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                        onClick={() => setContextMenu(null)}
                    />
                    <div style={{
                        position: 'fixed', top: contextMenu.y, left: contextMenu.x,
                        background: isDark ? '#1e2128' : '#ffffff',
                        border: `1px solid ${isDark ? '#2e3248' : '#e2e5ee'}`,
                        borderRadius: 10,
                        boxShadow: isDark
                            ? '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)'
                            : '0 8px 32px rgba(0,0,30,0.15), 0 2px 8px rgba(0,0,0,0.08)',
                        zIndex: 1000, minWidth: 160, padding: '5px',
                        animation: 'sidebar-fade-in 0.12s ease',
                    }}>
                        {[
                            { label: 'Open', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>, action: () => { onFileClick(contextMenu.noteId); setContextMenu(null); } },
                            { label: 'Rename', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, action: () => { 
                                const n = notes.find(x => x.id === contextMenu.noteId);
                                if (n) startRename(n.id, n.name); 
                                setContextMenu(null); 
                            } },
                        ].map(({ label, icon, action }) => (
                            <div
                                key={label}
                                onClick={action}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                                    fontSize: 13, color: p.text,
                                    transition: 'background 0.1s',
                                }}
                                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = isDark ? '#2e3248' : '#f0f2f9'; }}
                                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                            >
                                <span style={{ color: isDark ? '#7c84b2' : '#8890b0' }}>{icon}</span>
                                {label}
                            </div>
                        ))}
                        <div style={{ height: 1, margin: '3px 5px', background: isDark ? '#2a2d38' : '#eef0f6' }} />
                        <div
                            onClick={() => { onDelete(contextMenu.noteId); setContextMenu(null); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '8px 12px', borderRadius: 7, cursor: 'pointer',
                                fontSize: 13, color: '#ff4455',
                                transition: 'background 0.1s',
                            }}
                            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#ff444418'; }}
                            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                            </svg>
                            Delete
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default React.memo(Sidebar);
