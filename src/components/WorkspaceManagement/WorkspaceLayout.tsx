import React, { useState, useMemo } from 'react';
import { IconButton, Pagination, Tooltip, InputBase } from '@mui/material';
import {
    GridView as GridIcon,
    ViewList as ListIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const ITEMS_PER_PAGE = viewMode === 'grid' ? 15 : 10;

    const filteredWorkspaces = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return workspaces;
        return workspaces.filter(w => w.name.toLowerCase().includes(query));
    }, [workspaces, searchQuery]);

    const totalPages = Math.ceil(filteredWorkspaces.length / ITEMS_PER_PAGE) || 1;

    // Ensure we don't get stuck on an empty page if items are deleted or filtered out
    React.useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const paginatedWorkspaces = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredWorkspaces.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredWorkspaces, page, ITEMS_PER_PAGE]);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: '100%', width: '100%',
            background: palette.bg,
            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
            overflow: 'hidden',
            animation: 'wl-page-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
        }}>
            <style>{`
                @keyframes wl-page-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* Main content area */}
                <div style={{
                    flex: 1, overflow: 'auto',
                    padding: '24px 32px',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${palette.border}`,
                    }}>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 600, color: palette.text }}>
                                Workspaces <span style={{ fontSize: 13, color: palette.textDim, fontWeight: 400, marginLeft: 8 }}>({filteredWorkspaces.length})</span>
                            </div>
                            <div style={{ fontSize: 13, color: palette.textDim, marginTop: 4 }}>
                                Organize your projects and switch contexts quickly
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {/* Search */}
                            <div style={{
                                display: 'flex', alignItems: 'center', background: palette.panel,
                                borderRadius: 6, border: `1px solid ${palette.border}`, padding: '4px 8px 4px 10px',
                                width: 220,
                            }}>
                                <SearchIcon sx={{ fontSize: 18, color: palette.textDim, mr: 1 }} />
                                <InputBase
                                    placeholder="Search workspaces..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    sx={{ color: palette.text, fontSize: 13, flex: 1 }}
                                />
                            </div>

                            <div style={{ width: 1, height: 24, background: palette.border }} />

                            {/* View Toggle */}
                            <div style={{ display: 'flex', background: palette.panel, borderRadius: 6, padding: 2, border: `1px solid ${palette.border}` }}>
                                <Tooltip title="Grid View">
                                    <IconButton
                                        size="small"
                                        onClick={() => setViewMode('grid')}
                                        sx={{
                                            color: viewMode === 'grid' ? palette.accent : palette.textDim,
                                            background: viewMode === 'grid' ? palette.panelAlt : 'transparent',
                                            borderRadius: 1, p: 0.5,
                                        }}
                                    >
                                        <GridIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="List View">
                                    <IconButton
                                        size="small"
                                        onClick={() => setViewMode('list')}
                                        sx={{
                                            color: viewMode === 'list' ? palette.accent : palette.textDim,
                                            background: viewMode === 'list' ? palette.panelAlt : 'transparent',
                                            borderRadius: 1, p: 0.5,
                                        }}
                                    >
                                        <ListIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* Loading state */}
                    {loading ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 16, padding: 64, minHeight: 300,
                        }}>
                            <style>{`
                                @keyframes ws-spin { to { transform: rotate(360deg); } }
                                @keyframes ws-pulse { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
                            `}</style>
                            {/* Spinner ring */}
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                border: `4px solid ${palette.active}`,
                                borderTopColor: palette.accent,
                                animation: 'ws-spin 0.9s linear infinite',
                            }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 600, color: palette.text, marginBottom: 6 }}>
                                    Syncing from Google Drive
                                </div>
                                <div style={{ fontSize: 13, color: palette.textDim, lineHeight: 1.6 }}>
                                    Loading your folders and files…<br/>
                                    <span style={{ fontSize: 12, color: palette.textMute }}>
                                        This only takes a moment
                                    </span>
                                </div>
                                {/* Dot pulse */}
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14 }}>
                                    {[0, 0.2, 0.4].map((delay, i) => (
                                        <div key={i} style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: palette.accent,
                                            animation: `ws-pulse 1.2s ease-in-out ${delay}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Folder grid with create button */
                        <div style={{ flex: 1 }}>
                        <FolderGrid
                            workspaces={paginatedWorkspaces}
                            activeWorkspaceId={activeWorkspaceId}
                            notes={notes}
                            palette={palette}
                            viewMode={viewMode}
                            onSelect={onSelect}
                            onRename={onRename}
                            onDelete={onDelete}
                            onCreateNew={page === 1 && !searchQuery ? async (folderName: string) => {
                                if (workspaces.some((w) => w.name.toLowerCase() === folderName.toLowerCase())) {
                                    alert("A workspace with this name already exists");
                                    return;
                                }
                                try {
                                    await onCreate(folderName);
                                } catch {
                                    alert("Failed to create workspace");
                                }
                            } : undefined}
                        />
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, paddingTop: 16, borderTop: `1px solid ${palette.border}` }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(_, p) => setPage(p)}
                                color="primary"
                                sx={{
                                    '.MuiPaginationItem-root': {
                                        color: palette.text,
                                        '&.Mui-selected': { background: palette.accent + '22', color: palette.accent },
                                    }
                                }}
                            />
                        </div>
                    )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceLayout;
