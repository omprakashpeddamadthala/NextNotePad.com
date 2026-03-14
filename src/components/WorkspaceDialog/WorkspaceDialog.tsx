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
} from '@mui/icons-material';
import type { Workspace } from '../../types/Note';

interface WorkspaceDialogProps {
    open: boolean;
    onClose: () => void;
    workspaces: Workspace[];
    activeWorkspaceId: string;
    onSwitch: (id: string) => void;
    onCreate: (name: string) => Promise<void>;
    theme: 'light' | 'dark';
}

const WorkspaceDialog: React.FC<WorkspaceDialogProps> = ({
    open, onClose, workspaces, activeWorkspaceId, onSwitch, onCreate, theme,
}) => {
    const isDark = theme === 'dark';
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

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
        background: isDark ? '#252526' : '#f5f5f5',
        color: isDark ? '#e0e0e0' : '#111',
        border: `1px solid ${isDark ? '#3c3c3c' : '#ccc'}`,
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
                    <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#888' : '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                        Your Workspaces
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                        {workspaces.map((ws) => {
                            const isActive = ws.id === activeWorkspaceId;
                            return (
                                <button
                                    key={ws.id}
                                    onClick={() => { onSwitch(ws.id); onClose(); }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        width: '100%',
                                        textAlign: 'left',
                                        background: isActive
                                            ? isDark ? '#094771' : '#dbeafe'
                                            : isDark ? '#2d2d2d' : '#fff',
                                        border: `1px solid ${isActive ? '#007acc' : isDark ? '#3c3c3c' : '#ddd'}`,
                                        borderRadius: 4,
                                        padding: '7px 10px',
                                        cursor: 'pointer',
                                        color: isDark ? '#d0d0d0' : '#222',
                                        fontSize: 13,
                                        fontWeight: isActive ? 600 : 400,
                                    }}
                                >
                                    <FolderIcon sx={{ fontSize: 16, color: isActive ? '#007acc' : isDark ? '#888' : '#aaa' }} />
                                    <span style={{ flex: 1 }}>{ws.name}</span>
                                    {ws.driveId && (
                                        <Tooltip title="Synced to Google Drive">
                                            <span style={{ fontSize: 10, color: isDark ? '#4caf50' : '#16a34a' }}>☁</span>
                                        </Tooltip>
                                    )}
                                    {isActive && <CheckIcon sx={{ fontSize: 14, color: '#007acc' }} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <Divider style={{ borderColor: isDark ? '#3c3c3c' : '#e0e0e0', margin: '8px 0 12px' }} />

                {/* Create new workspace */}
                <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#888' : '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
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
                                    background: isDark ? '#1e1e1e' : '#fff',
                                    color: isDark ? '#d0d0d0' : '#111',
                                    borderRadius: 1,
                                    fontSize: 13,
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: isDark ? '#3c3c3c' : '#ccc',
                                },
                                '& .MuiFormHelperText-root': {
                                    color: '#f44336',
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
                                        background: '#007acc',
                                        color: '#fff',
                                        borderRadius: 1,
                                        width: 36,
                                        height: 36,
                                        flexShrink: 0,
                                        '&:hover': { background: '#005f9e' },
                                        '&:disabled': { background: isDark ? '#333' : '#e0e0e0', color: isDark ? '#555' : '#aaa' },
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
                        color: isDark ? '#aaa' : '#555',
                        background: isDark ? '#2d2d2d' : '#e8e8e8',
                        border: `1px solid ${isDark ? '#444' : '#ccc'}`,
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
