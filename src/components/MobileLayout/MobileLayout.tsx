import React, { useState } from 'react';
import {
    Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText,
    Divider, Box, Typography, Fab
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SearchIcon from '@mui/icons-material/Search';
import FindReplaceIcon from '@mui/icons-material/FindReplace';
import SyncIcon from '@mui/icons-material/Sync';
import SettingsIcon from '@mui/icons-material/Settings';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import WrapTextIcon from '@mui/icons-material/WrapText';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Note } from '../../types/Note';

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

interface MobileMenuAction {
    icon: React.ReactNode;
    label: string;
    action: () => void;
    divider?: boolean;
    danger?: boolean;
}

export interface MobileLayoutProps {
    theme: 'light' | 'dark';
    notes: Note[];
    activeNote: Note | null;
    activeId: string | null;
    wordWrap: boolean;
    activeWorkspaceName?: string;
    onNewFile: () => void;
    onFileClick: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string) => void;
    onSaveFile: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onFind: () => void;
    onReplace: () => void;
    onSyncDrive: () => void;
    onThemeToggle: () => void;
    onToggleWordWrap: () => void;
    onAbout: () => void;
    onDownloadFile: () => void;
    onOpenSettingsJson: () => void;
    onManageWorkspaces?: () => void;
    children: React.ReactNode; // The editor itself
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
    theme, notes, activeNote, activeId, wordWrap, activeWorkspaceName,
    onNewFile, onFileClick, onDelete, onRename, onSaveFile,
    onUndo, onRedo, onFind, onReplace, onSyncDrive, onThemeToggle,
    onToggleWordWrap, onAbout, onDownloadFile, onOpenSettingsJson, onManageWorkspaces,
    children
}) => {
    const isDark = theme === 'dark';
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [fileListOpen, setFileListOpen] = useState(false);

    const close = (fn: () => void) => () => { fn(); setDrawerOpen(false); };

    const menuActions: MobileMenuAction[] = [
        ...(onManageWorkspaces ? [{ icon: <FolderSpecialIcon />, label: 'Manage Workspaces', action: close(onManageWorkspaces), divider: false }] : []),
        { icon: <AddIcon />, label: 'New File', action: close(onNewFile), divider: !!onManageWorkspaces },
        { icon: <SaveIcon />, label: 'Save', action: close(onSaveFile) },
        { icon: <DownloadIcon />, label: 'Download File', action: close(onDownloadFile), divider: true },
        { icon: <UndoIcon />, label: 'Undo', action: close(onUndo) },
        { icon: <RedoIcon />, label: 'Redo', action: close(onRedo), divider: true },
        { icon: <SearchIcon />, label: 'Find', action: close(onFind) },
        { icon: <FindReplaceIcon />, label: 'Find & Replace', action: close(onReplace), divider: true },
        { icon: <WrapTextIcon />, label: `Word Wrap (${wordWrap ? 'On' : 'Off'})`, action: close(onToggleWordWrap) },
        { icon: isDark ? <LightModeIcon /> : <DarkModeIcon />, label: `${isDark ? 'Light' : 'Dark'} Mode`, action: close(onThemeToggle) },
        { icon: <SettingsIcon />, label: 'Settings (JSON)', action: close(onOpenSettingsJson), divider: true },
        { icon: <SyncIcon />, label: 'Sync to Google Drive', action: close(onSyncDrive) },
        { icon: <InfoOutlinedIcon />, label: 'About', action: close(onAbout) },
    ];

    const bg = isDark ? '#1e1e1e' : '#f5f5f5';
    const topBar = isDark ? '#2d2d2d' : '#e8e8e8';
    const border = isDark ? '#444' : '#ccc';
    const textColor = isDark ? '#d4d4d4' : '#1a1a1a';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', background: bg, position: 'relative' }}>
            {/* ── Top Bar ── */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 0.5, py: 0.5,
                background: topBar, borderBottom: `1px solid ${border}`,
                flexShrink: 0, minHeight: 56,
            }}>
                <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: textColor, p: 1.5 }}>
                    <MenuIcon sx={{ fontSize: 28 }} />
                </IconButton>
                <Typography variant="body1" noWrap sx={{ flex: 1, fontWeight: 600, color: textColor, fontFamily: "'Segoe UI', sans-serif", fontSize: 16 }}>
                    {activeNote?.name || 'NextNotePad'}
                </Typography>
                <IconButton onClick={() => setFileListOpen(true)} sx={{ color: textColor, p: 1.5 }}>
                    <FolderOpenIcon sx={{ fontSize: 28 }} />
                </IconButton>
            </Box>

            {/* ── Editor Area ── */}
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {children}
            </Box>

            {/* ── FAB: New File ── */}
            <Fab
                size="medium"
                color="primary"
                onClick={onNewFile}
                sx={{ position: 'absolute', bottom: 20, right: 20, zIndex: 5 }}
            >
                <AddIcon />
            </Fab>

            {/* ── Hamburger Drawer ── */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: 280, background: isDark ? '#252526' : '#fff', color: textColor } }}
            >
                {/* Drawer Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: `1px solid ${border}` }}>
                    <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 700, color: textColor }}>
                        ☰ Menu
                    </Typography>
                    <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: textColor }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Workspace chip */}
                {activeWorkspaceName && (
                    <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${border}` }}>
                        <Typography variant="caption" sx={{ color: isDark ? '#999' : '#666' }}>
                            Workspace
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: textColor }}>
                            📁 {activeWorkspaceName}
                        </Typography>
                    </Box>
                )}

                {/* Menu Items */}
                <List dense sx={{ py: 0 }}>
                    {menuActions.map((item, idx) => (
                        <React.Fragment key={idx}>
                            {item.divider && <Divider sx={{ borderColor: border, my: 0.5 }} />}
                            <ListItem
                                component="div"
                                onClick={item.action}
                                sx={{
                                    cursor: 'pointer', py: 1.2,
                                    '&:hover': { background: isDark ? '#3a3a3a' : '#f0f0f0' },
                                    color: item.danger ? '#e53935' : textColor
                                }}
                            >
                                <ListItemIcon sx={{ color: item.danger ? '#e53935' : (isDark ? '#9cdcfe' : '#0078d4'), minWidth: 38 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
                            </ListItem>
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>

            {/* ── File List Drawer ── */}
            <Drawer
                anchor="right"
                open={fileListOpen}
                onClose={() => setFileListOpen(false)}
                PaperProps={{ sx: { width: '80vw', maxWidth: 320, background: isDark ? '#252526' : '#fff' } }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, borderBottom: `1px solid ${border}` }}>
                    <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 700, color: textColor }}>
                        Files
                    </Typography>
                    <IconButton size="small" onClick={onNewFile} sx={{ color: isDark ? '#9cdcfe' : '#0078d4', mr: 0.5 }}>
                        <AddIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setFileListOpen(false)} sx={{ color: textColor }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* File List */}
                <List dense sx={{ py: 1 }}>
                    {notes.length === 0 && (
                        <Box sx={{ px: 2, py: 4, textAlign: 'center', color: isDark ? '#666' : '#aaa' }}>
                            <DescriptionIcon sx={{ fontSize: 40, mb: 1, display: 'block', mx: 'auto', opacity: 0.4 }} />
                            <Typography variant="body2">No files yet</Typography>
                            <Typography variant="caption">Tap + to create one</Typography>
                        </Box>
                    )}
                    {notes.map((note) => {
                        const isActive = note.id === activeId;
                        const iconColor = getFileIconColor(note.name);
                        return (
                            <ListItem
                                key={note.id}
                                component="div"
                                onClick={() => { onFileClick(note.id); setFileListOpen(false); }}
                                sx={{
                                    cursor: 'pointer', py: 1.2,
                                    background: isActive ? (isDark ? '#094771' : '#cce4f7') : 'transparent',
                                    '&:hover': { background: isDark ? '#3a3a3a' : '#f0f0f0' },
                                    borderRadius: 1, mx: 0.5, mb: 0.3,
                                }}
                                secondaryAction={
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton edge="end" size="small"
                                            onClick={(e) => { e.stopPropagation(); onRename(note.id); setFileListOpen(false); }}
                                            sx={{ color: isDark ? '#888' : '#666' }}
                                        >
                                            <DescriptionIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton edge="end" size="small"
                                            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                                            sx={{ color: '#e53935' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', background: iconColor, mt: 0.3 }} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={note.name}
                                    secondary={new Date(note.lastModified).toLocaleDateString()}
                                    primaryTypographyProps={{
                                        fontSize: 14, fontWeight: isActive ? 600 : 400,
                                        color: isActive ? (isDark ? '#9cdcfe' : '#0078d4') : textColor,
                                        noWrap: true,
                                    }}
                                    secondaryTypographyProps={{ fontSize: 11, color: isDark ? '#666' : '#aaa' }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Drawer>
        </Box>
    );
};

export default React.memo(MobileLayout);
