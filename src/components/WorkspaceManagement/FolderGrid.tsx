import React, { useState, useRef, useEffect } from 'react';
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
    onCreateNew?: (name: string) => Promise<void>;
    viewMode?: 'grid' | 'list';
}

const FolderGrid: React.FC<FolderGridProps> = ({
    workspaces, activeWorkspaceId, notes, palette,
    onSelect, onRename, onDelete, onCreateNew, viewMode = 'grid',
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating]);

    const handleCreateSubmit = async () => {
        const trimmed = newName.trim();
        if (!trimmed) {
            setIsCreating(false);
            setNewName('');
            return;
        }
        if (onCreateNew) {
            try {
                await onCreateNew(trimmed);
            } catch (e) {
                console.error(e);
            }
        }
        setIsCreating(false);
        setNewName('');
    };
    return (
        <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'none',
            flexDirection: viewMode === 'list' ? 'column' : 'row',
            gap: viewMode === 'list' ? 8 : 16,
            padding: 0,
        }}>
            {/* Existing folder cards */}
            {workspaces.map((ws, index) => {
                const fileCount = notes.filter((n) => n.workspaceId === ws.id).length;
                return (
                    <div key={ws.id} style={{ animationDelay: `${index * 0.05}s` }}>
                    <FolderCard
                        workspace={ws}
                        isActive={ws.id === activeWorkspaceId}
                        fileCount={fileCount}
                        palette={palette}
                        canDelete={workspaces.length > 1}
                        onClick={() => onSelect(ws.id)}
                        onRename={(newName) => onRename(ws.id, newName)}
                        onDelete={() => onDelete(ws.id)}
                        viewMode={viewMode}
                    />
                    </div>
                );
            })}

            {/* Large "+" button to create a new folder */}
            {onCreateNew && (
                <div
                    onClick={() => {
                        if (!isCreating) {
                            setIsCreating(true);
                        }
                    }}
                    style={{
                        display: 'flex',
                        flexDirection: viewMode === 'list' ? 'row' : 'column',
                        alignItems: 'center', justifyContent: viewMode === 'list' ? 'flex-start' : 'center',
                        gap: viewMode === 'list' ? 16 : 8,
                        padding: viewMode === 'list' ? '12px 16px' : '20px 16px 14px',
                        background: isCreating ? palette.panelAlt : 'transparent',
                        border: `2px dashed ${palette.border}`,
                        borderRadius: 10,
                        cursor: isCreating ? 'default' : 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                        minHeight: viewMode === 'list' ? 64 : 120,
                    }}
                    onMouseOver={(e) => {
                        if (!isCreating) {
                            (e.currentTarget as HTMLElement).style.borderColor = palette.accent;
                            (e.currentTarget as HTMLElement).style.background = palette.hover;
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isCreating) {
                            (e.currentTarget as HTMLElement).style.borderColor = palette.border;
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }
                    }}
                >
                    {isCreating ? (
                        <input
                            ref={inputRef}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateSubmit();
                                if (e.key === 'Escape') {
                                    setIsCreating(false);
                                    setNewName('');
                                }
                            }}
                            onBlur={() => {
                                setIsCreating(false);
                                setNewName('');
                            }}
                            placeholder="Folder name..."
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: `1px solid ${palette.border}`,
                                borderRadius: 4,
                                outline: 'none',
                                fontSize: 13,
                                background: palette.bg,
                                color: palette.text,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <>
                            <AddIcon sx={{ fontSize: viewMode === 'list' ? 32 : 48, color: palette.textDim }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: palette.textDim }}>
                                New Folder
                            </span>
                        </>
                    )}
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
