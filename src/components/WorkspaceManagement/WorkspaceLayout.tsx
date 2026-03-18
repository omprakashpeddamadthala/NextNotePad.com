import React, { useState } from 'react';
import {
    ArrowBack as BackIcon,
    CreateNewFolder as NewFolderIcon,
    FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { IconButton, TextField, Tooltip } from '@mui/material';
import FolderGrid from './FolderGrid';
import type { ThemePalette } from '../../theme/colors';
import type { Workspace, Note } from '../../types/Note';

interface WorkspaceLayoutProps {
    workspaces: Workspace[];
    activeWorkspaceId: string;
    notes: Note[];
    palette: ThemePalette;
    theme: 'light' | 'dark';
    onBack: () => void;
    onSelect: (id: string) => void;
    onCreate: (name: string) => Promise<void>;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
    workspaces, activeWorkspaceId, notes, palette, theme,
    onBack, onSelect, onCreate, onRename, onDelete,
}) => {
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const isDark = theme === 'dark';

    const handleCreate = async () => {
        const trimmed = newName.trim();
        if (!trimmed) { setError('Name cannot be empty'); return; }
        if (workspaces.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) {
            setError('A workspace with this name already exists');
            return;
        }
        setCreating(true);
        setError('');
        try {
            await onCreate(trimmed);
            setNewName('');
        } catch {
            setError('Failed to create workspace');
        } finally {
            setCreating(false);
        }
    };

    const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100vh', width: '100vw',
            background: palette.bg,
            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                height: 48, flexShrink: 0,
                background: isDark ? '#3b3b3b' : '#e8e8e8',
                borderBottom: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                padding: '0 16px',
            }}>
                <Tooltip title="Back to Editor">
                    <IconButton size="small" onClick={onBack}
                        sx={{ color: palette.text, p: 0.5 }}>
                        <BackIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Tooltip>
                <FolderOpenIcon sx={{ fontSize: 20, color: palette.accent }} />
                <span style={{
                    fontSize: 15, fontWeight: 700, color: palette.text,
                }}>
                    Workspace Management
                </span>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{
                    width: 260, minWidth: 200, flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                    background: palette.panel,
                    borderRight: `1px solid ${palette.border}`,
                    overflow: 'hidden',
                }}>
                    {/* Sidebar header */}
                    <div style={{
                        padding: '14px 16px 10px',
                        borderBottom: `1px solid ${palette.border}`,
                    }}>
                        <div style={{
                            fontSize: 11, fontWeight: 600, color: palette.textDim,
                            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
                        }}>
                            Active Workspace
                        </div>
                        <div style={{
                            fontSize: 14, fontWeight: 600, color: palette.accent,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }} title={activeWorkspace?.name}>
                            {activeWorkspace?.name || 'None'}
                        </div>
                    </div>

                    {/* Workspace list */}
                    <div style={{
                        padding: '10px 12px 6px',
                        fontSize: 11, fontWeight: 600, color: palette.textDim,
                        textTransform: 'uppercase', letterSpacing: 1,
                    }}>
                        All Workspaces ({workspaces.length})
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
                        {workspaces.map((ws) => {
                            const isActive = ws.id === activeWorkspaceId;
                            const count = notes.filter((n) => n.workspaceId === ws.id).length;
                            return (
                                <div
                                    key={ws.id}
                                    onClick={() => onSelect(ws.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '7px 10px', borderRadius: 4,
                                        background: isActive ? palette.active : 'transparent',
                                        color: palette.text,
                                        cursor: 'pointer',
                                        marginBottom: 2,
                                        borderLeft: isActive ? `3px solid ${palette.accent}` : '3px solid transparent',
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isActive) (e.currentTarget as HTMLElement).style.background = palette.hover;
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }}
                                >
                                    <FolderOpenIcon sx={{
                                        fontSize: 16,
                                        color: isActive ? palette.accent : palette.textDim,
                                    }} />
                                    <span style={{
                                        flex: 1, fontSize: 13,
                                        fontWeight: isActive ? 600 : 400,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {ws.name}
                                    </span>
                                    <span style={{
                                        fontSize: 11, color: palette.textMute,
                                    }}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Create new workspace */}
                    <div style={{
                        padding: '12px',
                        borderTop: `1px solid ${palette.border}`,
                    }}>
                        <div style={{
                            fontSize: 11, fontWeight: 600, color: palette.textDim,
                            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
                        }}>
                            New Workspace
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                value={newName}
                                onChange={(e) => { setNewName(e.target.value); setError(''); }}
                                placeholder="Folder name..."
                                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                                error={!!error}
                                helperText={error}
                                disabled={creating}
                                inputProps={{ maxLength: 64 }}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        background: palette.bg, color: palette.text,
                                        borderRadius: 1, fontSize: 12,
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: palette.border,
                                    },
                                    '& .MuiFormHelperText-root': {
                                        color: palette.danger, fontSize: 10, margin: '2px 0 0',
                                    },
                                }}
                            />
                            <Tooltip title="Create workspace">
                                <span>
                                    <IconButton
                                        onClick={handleCreate}
                                        disabled={creating || !newName.trim()}
                                        size="small"
                                        sx={{
                                            background: palette.accent, color: '#fff',
                                            borderRadius: 1, width: 34, height: 34, flexShrink: 0,
                                            '&:hover': { background: palette.accentHover },
                                            '&:disabled': { background: palette.panelAlt, color: palette.border },
                                        }}
                                    >
                                        <NewFolderIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <div style={{
                    flex: 1, overflow: 'auto',
                    padding: 24,
                }}>
                    {/* Page title */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{
                            fontSize: 18, fontWeight: 700, color: palette.text,
                            marginBottom: 4,
                        }}>
                            Your Workspaces
                        </div>
                        <div style={{
                            fontSize: 13, color: palette.textDim,
                        }}>
                            Select a workspace to set it as active. All file operations will use the active workspace.
                        </div>
                    </div>

                    {/* Folder grid */}
                    <FolderGrid
                        workspaces={workspaces}
                        activeWorkspaceId={activeWorkspaceId}
                        notes={notes}
                        palette={palette}
                        onSelect={onSelect}
                        onRename={onRename}
                        onDelete={onDelete}
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkspaceLayout;
