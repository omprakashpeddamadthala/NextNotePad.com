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
    viewMode?: 'grid' | 'list';
}

const FolderCard: React.FC<FolderCardProps> = ({
    workspace, isActive, fileCount, palette, canDelete,
    onClick, onRename, onDelete, viewMode = 'grid',
}) => {
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [hovered, setHovered] = useState(false);

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
        <>
        <style>{`
            @keyframes fc-rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div
            onClick={renaming ? undefined : onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                flexDirection: viewMode === 'list' ? 'row' : 'column',
                alignItems: 'center',
                gap: viewMode === 'list' ? 16 : 8,
                padding: viewMode === 'list' ? '12px 16px' : '20px 16px 14px',
                background: isActive ? palette.active : palette.panel,
                border: `2px solid ${isActive ? palette.accent : (hovered ? palette.accentHover : palette.border)}`,
                borderRadius: 10,
                cursor: renaming ? 'default' : 'pointer',
                position: 'relative',
                minWidth: 0,
                height: viewMode === 'list' ? 64 : 'auto',
                animation: 'fc-rise 0.25s ease both',
                transform: hovered && !renaming && viewMode === 'grid' ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: hovered && !renaming
                    ? `0 8px 24px rgba(0,0,0,0.22), 0 0 0 1px ${palette.accent}44`
                    : isActive ? `0 2px 10px rgba(0,0,0,0.15)` : 'none',
                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, border-color 0.15s, background 0.15s',
                willChange: 'transform',
            }}
        >
            {/* Drive sync indicator (grid mode only) */}
            {workspace.driveId && viewMode === 'grid' && (
                <Tooltip title="Synced to Google Drive">
                    <CloudIcon sx={{
                        position: 'absolute', top: 6, right: 6,
                        fontSize: 14, color: palette.success,
                    }} />
                </Tooltip>
            )}

            {/* Active badge (grid mode only) */}
            {isActive && viewMode === 'grid' && (
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
                fontSize: viewMode === 'list' ? 32 : 48,
                color: isActive ? palette.accent : (hovered ? palette.accentHover : palette.textDim),
                transition: 'color 0.2s, transform 0.2s',
                transform: hovered && !renaming && viewMode === 'grid' ? 'scale(1.12)' : 'scale(1)',
                flexShrink: 0,
            }} />

            {/* Content area for List view (Name + Badges) */}
            <div style={{
                display: 'flex',
                flexDirection: viewMode === 'list' ? 'row' : 'column',
                alignItems: 'center',
                flex: viewMode === 'list' ? 1 : 'unset',
                width: viewMode === 'grid' ? '100%' : 'auto',
                gap: viewMode === 'list' ? 16 : 8,
                minWidth: 0,
            }}>
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
                        textAlign: viewMode === 'list' ? 'left' : 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        flex: viewMode === 'list' ? 1 : 'unset',
                    }} title={workspace.name}>
                        {workspace.name}
                    </div>
                )}

                {/* File count */}
                <div style={{
                    fontSize: 11, color: palette.textDim,
                    width: viewMode === 'list' ? 80 : 'auto',
                    textAlign: viewMode === 'list' ? 'right' : 'center',
                    flexShrink: 0,
                }}>
                    {fileCount} {fileCount === 1 ? 'file' : 'files'}
                </div>

                {/* Badges in list view */}
                {viewMode === 'list' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 100, flexShrink: 0 }}>
                        {isActive && (
                            <div style={{
                                fontSize: 9, fontWeight: 700, color: palette.accent,
                                textTransform: 'uppercase', letterSpacing: 0.5,
                                background: palette.accent + '22', padding: '2px 6px', borderRadius: 4,
                            }}>Active</div>
                        )}
                        {workspace.driveId && (
                            <Tooltip title="Synced to Google Drive">
                                <CloudIcon sx={{ fontSize: 16, color: palette.success }} />
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>

            {/* Action buttons */}
            {!renaming && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
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
        </>
    );
};

export default React.memo(FolderCard);
