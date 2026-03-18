import React from 'react';
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
}

const FolderGrid: React.FC<FolderGridProps> = ({
    workspaces, activeWorkspaceId, notes, palette,
    onSelect, onRename, onDelete,
}) => {
    if (workspaces.length === 0) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100%', color: palette.textDim, fontSize: 14,
            }}>
                No folders available
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16,
            padding: 0,
        }}>
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
        </div>
    );
};

export default React.memo(FolderGrid);
