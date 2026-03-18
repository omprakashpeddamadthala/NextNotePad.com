import React from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import FolderCard from './FolderCard';
import type { ThemePalette } from '../../theme/colors';
import type { Workspace, Note } from '../../types/Note';

interface FolderGridProps {
    workspaces: Workspace[];
    activeWorkspaceId: string;
    notes: Note[];
    palette: ThemePalette;
    onSelect: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onCreateNew?: () => void;
}

const FolderGrid: React.FC<FolderGridProps> = ({
    workspaces, activeWorkspaceId, notes, palette,
    onSelect, onRename, onDelete, onCreateNew,
}) => {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
            padding: 0,
        }}>
            {/* Existing folder cards */}
            {workspaces.map((ws) => {
                const fileCount = notes.filter((n) => n.workspaceId === ws.id).length;
                return (
                    <FolderCard
                        key={ws.id}
                        workspace={ws}
                        isActive={ws.id === activeWorkspaceId}
                        fileCount={fileCount}
                        palette={palette}
                        canDelete={workspaces.length > 1}
                        onClick={() => onSelect(ws.id)}
                        onRename={(newName) => onRename(ws.id, newName)}
                        onDelete={() => onDelete(ws.id)}
                    />
                );
            })}

            {/* Large "+" button to create a new folder */}
            {onCreateNew && (
                <div
                    onClick={onCreateNew}
                    style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 8, padding: '20px 16px 14px',
                        background: 'transparent',
                        border: `2px dashed ${palette.border}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                        minHeight: 120,
                    }}
                    onMouseOver={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = palette.accent;
                        (e.currentTarget as HTMLElement).style.background = palette.hover;
                    }}
                    onMouseOut={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = palette.border;
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                >
                    <AddIcon sx={{ fontSize: 48, color: palette.textDim }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: palette.textDim }}>
                        New Folder
                    </span>
                </div>
            )}

            {/* Empty state when no workspaces and no create button */}
            {workspaces.length === 0 && !onCreateNew && (
                <div style={{
                    gridColumn: '1 / -1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 48, color: palette.textDim, fontSize: 14,
                }}>
                    No folders available
                </div>
            )}
        </div>
    );
};

export default React.memo(FolderGrid);
