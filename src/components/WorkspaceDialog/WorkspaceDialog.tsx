import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Divider, IconButton, Tooltip,
} from '@mui/material';
import {
    CreateNewFolder as NewFolderIcon,
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    Check as CheckIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import type { Workspace } from '../../types/Note';
import { getPalette } from '../../theme/colors';

interface WorkspaceDialogProps {
    open: boolean;
    onClose: () => void;
    workspaces: Workspace[];
    activeWorkspaceId: string;
    onSwitch: (id: string) => void;
    onCreate: (name: string) => Promise<void>;
    onRename?: (id: string, newName: string) => void;
    onDelete?: (id: string) => void;
    theme: 'light' | 'dark';
}

const WorkspaceDialog: React.FC<WorkspaceDialogProps> = ({
    open, onClose, workspaces, activeWorkspaceId, onSwitch, onCreate, onRename, onDelete, theme,
}) => {
    const palette = getPalette(theme);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    
    // Rename state
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const handleCreate = async () => {
        const trimmed = newName.trim();
        if (!trimmed) { setError('Workspace name cannot be empty'); return; }
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

    const paperStyle: React.CSSProperties = {
        background: palette.panel,
        color: palette.text,
        border: `1px solid ${palette.border}`,
        borderRadius: 6,
        minWidth: 360,
        maxWidth: 440,
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ style: paperStyle }}>
            <DialogTitle style={{ fontSize: 14, fontWeight: 700, padding: '14px 18px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderOpenIcon sx={{ fontSize: 18, color: '#007acc' }} />
                Manage Workspaces
            </DialogTitle>

            <DialogContent style={{ padding: '0 18px 8px' }}>
                {/* Workspace list */}
                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: palette.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                        Your Workspaces
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                        {workspaces.map((ws) => {
                            const isActive = ws.id === activeWorkspaceId;
                            const isRenaming = renamingId === ws.id;

                            if (isRenaming) {
                                return (
                                    <div key={ws.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        width: '100%', padding: '5px 8px',
                                        background: palette.active,
                                        border: `1px solid ${palette.borderFocus}`,
                                        borderRadius: 4,
                                    }}>
                                        <TextField
                                            size="small"
                                            autoFocus
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (onRename && renameValue.trim()) {
                                                        onRename(ws.id, renameValue.trim());
                                                        setRenamingId(null);
                                                    }
                                                } else if (e.key === 'Escape') {
                                                    setRenamingId(null);
                                                }
                                            }}
                                            sx={{
                                                flex: 1,
                                                '& .MuiInputBase-root': {
                                                    background: palette.bg, color: palette.text,
                                                    fontSize: 13, height: 28,
                                                },
                                            }}
                                        />
                                        <IconButton size="small" onClick={() => {
                                            if (onRename && renameValue.trim()) onRename(ws.id, renameValue.trim());
                                            setRenamingId(null);
                                        }} sx={{ color: palette.success, p: 0.5 }}>
                                            <CheckIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => setRenamingId(null)} sx={{ color: palette.danger, p: 0.5 }}>
                                            <CloseIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={ws.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        width: '100%',
                                        background: isActive ? palette.active : palette.bg,
                                        border: `1px solid ${isActive ? palette.accent : palette.border}`,
                                        borderRadius: 4,
                                        padding: '5px 8px',
                                    }}
                                >
                                    <button
                                        onClick={() => { onSwitch(ws.id); onClose(); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            flex: 1,
                                            textAlign: 'left',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: palette.text,
                                            fontSize: 13,
                                            fontWeight: isActive ? 600 : 400,
                                            padding: 0,
                                        }}
                                    >
                                        <FolderIcon sx={{ fontSize: 16, color: isActive ? palette.accent : palette.textDim }} />
                                        <span style={{ flex: 1 }}>{ws.name}</span>
                                        {ws.driveId && (
                                            <Tooltip title="Synced to Google Drive">
                                                <span style={{ fontSize: 10, color: palette.success, marginRight: isActive ? 0 : 4 }}>☁</span>
                                            </Tooltip>
                                        )}
                                        {isActive && <CheckIcon sx={{ fontSize: 14, color: palette.accent }} />}
                                    </button>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        <Tooltip title="Rename">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); setRenamingId(ws.id); setRenameValue(ws.name); }}
                                                sx={{ color: palette.textDim, p: 0.5, '&:hover': { color: palette.text } }}
                                            >
                                                <EditIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={workspaces.length > 1 ? "Delete Workspace" : "Cannot delete last workspace"}>
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Are you sure you want to delete workspace "${ws.name}"? This cannot be undone.`)) {
                                                            if (onDelete) onDelete(ws.id);
                                                        }
                                                    }}
                                                    disabled={workspaces.length <= 1}
                                                    sx={{ color: palette.textDim, p: 0.5, '&:hover': { color: palette.danger } }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <Divider style={{ borderColor: palette.border, margin: '8px 0 12px' }} />

                {/* Create new workspace */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: palette.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                        New Workspace
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <TextField
                            size="small"
                            fullWidth
                            value={newName}
                            onChange={(e) => { setNewName(e.target.value); setError(''); }}
                            placeholder="Workspace name..."
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                            error={!!error}
                            helperText={error}
                            disabled={creating}
                            inputProps={{ maxLength: 64 }}
                            sx={{
                                '& .MuiInputBase-root': {
                                    background: palette.bg,
                                    color: palette.text,
                                    borderRadius: 1,
                                    fontSize: 13,
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: palette.border,
                                },
                                '& .MuiFormHelperText-root': {
                                    color: palette.danger,
                                    fontSize: 11,
                                    margin: '2px 0 0',
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
                                        background: palette.accent,
                                        color: '#fff',
                                        borderRadius: 1,
                                        width: 36,
                                        height: 36,
                                        flexShrink: 0,
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
            </DialogContent>

            <DialogActions style={{ padding: '8px 18px 14px' }}>
                <Button
                    onClick={onClose}
                    size="small"
                    style={{
                        textTransform: 'none',
                        fontSize: 12,
                        color: palette.textDim,
                        background: palette.panelAlt,
                        border: `1px solid ${palette.border}`,
                        borderRadius: 4,
                        padding: '3px 14px',
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WorkspaceDialog;
