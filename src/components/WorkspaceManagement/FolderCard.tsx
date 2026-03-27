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
                gap: viewMode === 'list' ? 16 : 10,
                padding: viewMode === 'list' ? '12px 16px' : '24px 20px 18px',
                background: isActive 
                    ? `linear-gradient(145deg, ${palette.active}, ${palette.active}dd)` 
                    : (hovered ? `linear-gradient(145deg, ${palette.panelAlt}, ${palette.panel})` : palette.panel),
                border: `2px solid ${isActive ? palette.accent : (hovered ? palette.accentHover : palette.border)}`,
                borderRadius: 16, // Smoother squircle look
                cursor: renaming ? 'default' : 'pointer',
                position: 'relative',
                minWidth: 0,
                height: viewMode === 'list' ? 68 : 'auto',
                animation: 'fc-rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                transform: hovered && !renaming && viewMode === 'grid' ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: hovered && !renaming
                    ? `0 14px 32px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px ${palette.accent}22`
                    : isActive ? `0 4px 16px rgba(0,0,0,0.1)` : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.2s, background 0.2s',
                willChange: 'transform, box-shadow',
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
                    position: 'absolute', top: 12, left: 12,
                    fontSize: 9, fontWeight: 800,
                    color: palette.accent,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    background: palette.accent + '15',
                    padding: '3px 8px',
                    borderRadius: 12,
                }}>
                    Active
                </div>
            )}

            {/* Folder icon */}
            <FolderIcon sx={{
                fontSize: viewMode === 'list' ? 32 : 54,
                color: isActive ? palette.accent : (hovered ? palette.accentHover : palette.textMute),
                transition: 'color 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                transform: hovered && !renaming && viewMode === 'grid' ? 'scale(1.15) translateY(-2px)' : 'scale(1) translateY(0)',
                flexShrink: 0,
                filter: hovered && !renaming && viewMode === 'grid' ? `drop-shadow(0 4px 8px ${palette.accent}44)` : 'none',
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
                        fontSize: 14, fontWeight: 600,
                        color: isActive ? palette.accent : palette.text,
                        textAlign: viewMode === 'list' ? 'left' : 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        flex: viewMode === 'list' ? 1 : 'unset',
                        letterSpacing: 0.2,
                    }} title={workspace.name}>
                        {workspace.name}
                    </div>
                )}

                {/* File count */}
                <div style={{
                    fontSize: 11, fontWeight: 500, color: palette.textDim,
                    background: palette.bg,
                    padding: '3px 8px', borderRadius: 12,
                    width: viewMode === 'list' ? 80 : 'auto',
                    textAlign: 'center',
                    flexShrink: 0,
                    border: `1px solid ${palette.border}`,
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
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, opacity: viewMode === 'grid' && !hovered ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <Tooltip title="Rename">
                        <IconButton size="small" onClick={startRename}
                            sx={{
                                color: palette.textDim,
                                p: 0.6,
                                background: palette.bg + '88',
                                '&:hover': { color: palette.text, background: palette.hover }
                            }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={canDelete ? 'Delete Workspace' : 'Cannot delete last workspace'}>
                        <span>
                            <IconButton size="small" onClick={handleDelete}
                                disabled={!canDelete}
                                sx={{
                                    color: palette.textDim,
                                    p: 0.6,
                                    background: palette.bg + '88',
                                    '&:hover': { color: palette.danger, background: palette.danger + '15' }
                                }}>
                                <DeleteIcon sx={{ fontSize: 16 }} />
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
