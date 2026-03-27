import React, { useRef, useCallback, useState } from 'react';
import { Menu, MenuItem, ListItemText, Typography } from '@mui/material';
import type { Note } from '../../types/Note';
import { getPalette } from '../../theme/colors';

interface TabsProps {
    tabs: Note[];
    activeId: string | null;
    dirtyIds: Set<string>;
    onTabClick: (id: string) => void;
    onTabClose: (id: string) => void;
    onCloseAll: () => void;
    onCloseOthers: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    theme: 'light' | 'dark';
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

const TabsComponent: React.FC<TabsProps> = ({
    tabs, activeId, dirtyIds,
    onTabClick, onTabClose, onCloseAll, onCloseOthers,
    onReorder, theme,
}) => {
    const dragItemRef = useRef<number | null>(null);
    const dragOverRef = useRef<number | null>(null);
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; tabId: string } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const palette = getPalette(theme);

    const handleDragStart = useCallback((index: number) => {
        dragItemRef.current = index;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        dragOverRef.current = index;
    }, []);

    const handleDrop = useCallback(() => {
        if (
            dragItemRef.current !== null &&
            dragOverRef.current !== null &&
            dragItemRef.current !== dragOverRef.current
        ) {
            onReorder(dragItemRef.current, dragOverRef.current);
        }
        dragItemRef.current = null;
        dragOverRef.current = null;
    }, [onReorder]);

    const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, tabId });
    }, []);

    const handleContextClose = useCallback(() => {
        setContextMenu(null);
    }, []);

    if (tabs.length === 0) return null;

    return (
        <>
            <style>{`
                @keyframes tab-slide-in {
                    from { opacity: 0; transform: translateX(8px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
            <div
                ref={scrollRef}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    background: palette.panel,
                    minHeight: 36,
                    padding: '6px 12px',
                    gap: 6,
                    borderBottom: `1px solid ${palette.border}`,
                    flexShrink: 0,
                    scrollbarWidth: 'thin',
                }}
            >
                {tabs.map((tab, index) => {
                    const isActive = tab.id === activeId;
                    const isDirty = dirtyIds.has(tab.id);
                    const iconColor = getFileIconColor(tab.name);

                    return (
                        <div
                            key={tab.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={handleDrop}
                            onClick={() => onTabClick(tab.id)}
                            onContextMenu={(e) => handleContextMenu(e, tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                cursor: 'default',
                                userSelect: 'none',
                                flexShrink: 0,
                                height: 28,
                                borderRadius: 16,
                                fontSize: '13px',
                                fontWeight: isActive ? 600 : 500,
                                fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                                background: isActive ? palette.bg : 'transparent',
                                color: isActive ? palette.text : palette.textDim,
                                border: `1px solid ${isActive ? palette.border : 'transparent'}`,
                                position: 'relative',
                                zIndex: isActive ? 2 : 1,
                                boxShadow: isActive ? `0 2px 8px rgba(0,0,0,0.06)` : 'none',
                                animation: 'tab-slide-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
                                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, border-color 0.2s',
                            }}
                            onMouseOver={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = `${palette.hover}88`;
                                    (e.currentTarget as HTMLElement).style.color = palette.text;
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = palette.textDim;
                                }
                            }}
                        >
                            {/* File type indicator dot */}
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: iconColor, flexShrink: 0,
                            }} />

                            {/* Tab name */}
                            <span style={{ whiteSpace: 'nowrap', letterSpacing: 0.2 }}>{tab.name}</span>

                            {/* Modified indicator */}
                            {isDirty && (
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: palette.danger, flexShrink: 0,
                                }} />
                            )}

                            {/* Close button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTabClose(tab.id);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: 18, height: 18, border: 'none', borderRadius: '50%',
                                    background: 'transparent', cursor: 'pointer',
                                    fontSize: '14px', lineHeight: 1,
                                    color: isActive ? palette.textDim : palette.textMute,
                                    padding: 0, flexShrink: 0, marginLeft: 2,
                                    transition: 'background 0.15s, color 0.15s',
                                }}
                                onMouseOver={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = `${palette.danger}15`;
                                    (e.currentTarget as HTMLElement).style.color = palette.danger;
                                }}
                                onMouseOut={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = isActive ? palette.textDim : palette.textMute;
                                }}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Context Menu */}
            <Menu
                open={contextMenu !== null}
                onClose={handleContextClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
                sx={{ '& .MuiPaper-root': { minWidth: 180, borderRadius: 2 } }}
            >
                <MenuItem sx={{ fontSize: '13px', minHeight: 28 }} onClick={() => {
                    if (contextMenu) onTabClose(contextMenu.tabId);
                    handleContextClose();
                }}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Close</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={{ fontSize: '13px', minHeight: 28 }} onClick={() => {
                    if (contextMenu) onCloseOthers(contextMenu.tabId);
                    handleContextClose();
                }}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Close All BUT This</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={{ fontSize: '13px', minHeight: 28 }} onClick={() => {
                    onCloseAll();
                    handleContextClose();
                }}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Close All</Typography></ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default React.memo(TabsComponent);
