import React, { useState } from 'react';
import {
    Folder as FolderIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    CloudQueue as CloudIcon,
} from '@mui/icons-material';
import { IconButton, TextField, Tooltip } from '@mui/material';
import type { ThemePalette } from '../../theme/colors';
import type { Workspace } from '../../types/Note';

interface FolderCardProps {
    workspace: Workspace;
    isActive: boolean;
    fileCount: number;
    palette: ThemePalette;
    canDelete: boolean;
    onClick: () => void;
    onRename: (newName: string) => void;
    onDelete: () => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
    workspace, isActive, fileCount, palette, canDelete,
    onClick, onRename, onDelete,
}) => {
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');

    const startRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRenameValue(workspace.name);
        setRenaming(true);
    };

    const confirmRename = () => {
        const trimmed = renameValue.trim();
        if (trimmed && trimmed !== workspace.name) {
            onRename(trimmed);
        }
        setRenaming(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete workspace "${workspace.name}"? This cannot be undone.`)) {
            onDelete();
        }
    };

    return (
        <div
            onClick={renaming ? undefined : onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '20px 16px 14px',
                background: isActive ? palette.active : palette.panel,
                border: `2px solid ${isActive ? palette.accent : palette.border}`,
                borderRadius: 8,
                cursor: renaming ? 'default' : 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                position: 'relative',
                minWidth: 0,
            }}
            onMouseOver={(e) => {
                if (!renaming && !isActive) {
                    (e.currentTarget as HTMLElement).style.borderColor = palette.accentHover;
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }
            }}
            onMouseOut={(e) => {
                if (!isActive) {
                    (e.currentTarget as HTMLElement).style.borderColor = palette.border;
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }
            }}
        >
            {/* Drive sync indicator */}
            {workspace.driveId && (
                <Tooltip title="Synced to Google Drive">
                    <CloudIcon sx={{
                        position: 'absolute', top: 6, right: 6,
                        fontSize: 14, color: palette.success,
                    }} />
                </Tooltip>
            )}

            {/* Active badge */}
            {isActive && (
                <div style={{
                    position: 'absolute', top: 6, left: 6,
                    fontSize: 9, fontWeight: 700,
                    color: palette.accent,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}>
                    Active
                </div>
            )}

            {/* Folder icon */}
            <FolderIcon sx={{
                fontSize: 48,
                color: isActive ? palette.accent : palette.textDim,
            }} />

            {/* Folder name or rename input */}
            {renaming ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}
                    onClick={(e) => e.stopPropagation()}>
                    <TextField
                        size="small"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmRename();
                            else if (e.key === 'Escape') setRenaming(false);
                        }}
                        sx={{
                            flex: 1,
                            '& .MuiInputBase-root': {
                                background: palette.bg, color: palette.text,
                                fontSize: 12, height: 28,
                            },
                        }}
                    />
                    <IconButton size="small" onClick={confirmRename}
                        sx={{ color: palette.success, p: 0.3 }}>
                        <CheckIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setRenaming(false)}
                        sx={{ color: palette.danger, p: 0.3 }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </div>
            ) : (
                <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: palette.text,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                }} title={workspace.name}>
                    {workspace.name}
                </div>
            )}

            {/* File count */}
            <div style={{
                fontSize: 11, color: palette.textDim,
            }}>
                {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </div>

            {/* Action buttons */}
            {!renaming && (
                <div style={{ display: 'flex', gap: 4 }}>
                    <Tooltip title="Rename">
                        <IconButton size="small" onClick={startRename}
                            sx={{ color: palette.textDim, p: 0.5, '&:hover': { color: palette.text } }}>
                            <EditIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={canDelete ? 'Delete Workspace' : 'Cannot delete last workspace'}>
                        <span>
                            <IconButton size="small" onClick={handleDelete}
                                disabled={!canDelete}
                                sx={{ color: palette.textDim, p: 0.5, '&:hover': { color: palette.danger } }}>
                                <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </span>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default React.memo(FolderCard);
