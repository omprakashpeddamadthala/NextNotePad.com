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
                        padding: viewMode === 'list' ? '12px 16px' : '24px 20px 18px',
                        background: isCreating ? palette.panel : `${palette.panel}44`,
                        border: `2px dashed ${isCreating ? palette.accent : palette.border}`,
                        borderRadius: 16,
                        cursor: isCreating ? 'default' : 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        minHeight: viewMode === 'list' ? 68 : 'auto',
                        height: viewMode === 'list' ? 68 : '100%',
                    }}
                    onMouseOver={(e) => {
                        if (!isCreating) {
                            (e.currentTarget as HTMLElement).style.borderColor = palette.accentHover;
                            (e.currentTarget as HTMLElement).style.background = `${palette.accent}11`;
                            (e.currentTarget as HTMLElement).style.transform = viewMode === 'grid' ? 'translateY(-6px) scale(1.02)' : 'translateY(0)';
                            (e.currentTarget as HTMLElement).style.boxShadow = `0 14px 32px rgba(0,0,0,0.12), 0 0 0 1px ${palette.accent}22`;
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isCreating) {
                            (e.currentTarget as HTMLElement).style.borderColor = palette.border;
                            (e.currentTarget as HTMLElement).style.background = `${palette.panel}44`;
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(0) scale(1)';
                            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
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
                                padding: '8px 12px',
                                border: `1px solid ${palette.accent}`,
                                borderRadius: 8,
                                outline: 'none',
                                fontSize: 13,
                                background: palette.bg,
                                color: palette.text,
                                boxShadow: `0 0 0 3px ${palette.accent}33`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <>
                            <AddIcon sx={{ fontSize: viewMode === 'list' ? 32 : 54, color: palette.textDim, transition: 'color 0.2s', '.MuiSvgIcon-root:hover &': { color: palette.accent } }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: palette.textDim }}>
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
