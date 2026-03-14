import React, { useRef, useCallback, useState } from 'react';
import { Menu, MenuItem, ListItemText, Typography, Divider } from '@mui/material';
import type { Note } from '../../types/Note';

interface TabsProps {
    tabs: Note[];
    activeId: string | null;
    dirtyIds: Set<string>;
    onTabClick: (id: string) => void;
    onTabClose: (id: string) => void;
    onCloseAll: () => void;
    onCloseOthers: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRename: (id: string) => void;
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
    onReorder, onRename, theme,
}) => {
    const dragItemRef = useRef<number | null>(null);
    const dragOverRef = useRef<number | null>(null);
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; tabId: string } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isDark = theme === 'dark';

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
            <div
                ref={scrollRef}
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    background: isDark ? '#202020' : '#f0f0f0',
                    minHeight: 26,
                    borderBottom: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
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
                                gap: 5,
                                padding: '4px 10px',
                                paddingRight: 6,
                                cursor: 'default',
                                userSelect: 'none',
                                flexShrink: 0,
                                height: isActive ? 27 : 24,
                                fontSize: '12px',
                                fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                                background: isActive
                                    ? isDark ? '#1e1e1e' : '#ffffff'
                                    : isDark ? '#333333' : '#e8e8e8',
                                color: isActive
                                    ? isDark ? '#e0e0e0' : '#000000'
                                    : isDark ? '#999' : '#555',
                                borderTop: isActive
                                    ? '3px solid #ff8c00'
                                    : '3px solid transparent',
                                borderLeft: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                                borderRight: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                                borderBottom: isActive ? '1px solid transparent' : `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                                marginBottom: isActive ? -1 : 0,
                                position: 'relative',
                                zIndex: isActive ? 2 : 1,
                            }}
                            onMouseOver={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = isDark ? '#444' : '#f8f8f8';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = isDark ? '#333333' : '#e8e8e8';
                                }
                            }}
                        >
                            {/* File type indicator dot */}
                            <span style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: iconColor, flexShrink: 0,
                            }} />

                            {/* Tab name */}
                            <span style={{ whiteSpace: 'nowrap' }}>{tab.name}</span>

                            {/* Modified indicator */}
                            {isDirty && (
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: '#e74c3c', flexShrink: 0,
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
                                    width: 16, height: 16, border: 'none', borderRadius: 2,
                                    background: 'transparent', cursor: 'pointer',
                                    fontSize: '14px', lineHeight: 1,
                                    color: isDark ? '#999' : '#888',
                                    padding: 0, flexShrink: 0,
                                }}
                                onMouseOver={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = isDark ? '#444' : '#ccc';
                                    (e.currentTarget as HTMLElement).style.color = isDark ? '#fff' : '#333';
                                }}
                                onMouseOut={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = isDark ? '#999' : '#888';
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
                sx={{ '& .MuiPaper-root': { minWidth: 180, borderRadius: '2px' } }}
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
                <Divider />
                <MenuItem sx={{ fontSize: '13px', minHeight: 28 }} onClick={() => {
                    if (contextMenu) onRename(contextMenu.tabId);
                    handleContextClose();
                }}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Rename</Typography></ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default React.memo(TabsComponent);
