import React from 'react';
import { CircularProgress } from '@mui/material';
import FolderGrid from './FolderGrid';
import type { ThemePalette } from '../../theme/colors';
import type { Workspace, Note } from '../../types/Note';

interface WorkspaceLayoutProps {
    workspaces: Workspace[];
    activeWorkspaceId: string;
    notes: Note[];
    palette: ThemePalette;
    loading?: boolean;
    onSelect: (id: string) => void;
    onCreate: (name: string) => Promise<void>;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
    workspaces, activeWorkspaceId, notes, palette, loading,
    onSelect, onCreate, onRename, onDelete,
}) => {

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100%', width: '100%',
            background: palette.bg,
            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
            overflow: 'hidden',
        }}>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Main content area */}
                <div style={{
                    flex: 1, overflow: 'auto',
                    padding: 24,
                }}>

                    {/* Loading state */}
                    {loading ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 12, padding: 48,
                        }}>
                            <CircularProgress size={32} sx={{ color: palette.accent }} />
                            <span style={{ fontSize: 13, color: palette.textDim }}>
                                Loading workspaces from Google Drive...
                            </span>
                        </div>
                    ) : (
                        /* Folder grid with create button */
                        <FolderGrid
                            workspaces={workspaces}
                            activeWorkspaceId={activeWorkspaceId}
                            notes={notes}
                            palette={palette}
                            onSelect={onSelect}
                            onRename={onRename}
                            onDelete={onDelete}
                            onCreateNew={async (folderName: string) => {
                                if (workspaces.some((w) => w.name.toLowerCase() === folderName.toLowerCase())) {
                                    alert("A workspace with this name already exists");
                                    return;
                                }
                                try {
                                    await onCreate(folderName);
                                } catch {
                                    alert("Failed to create workspace");
                                }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkspaceLayout;
