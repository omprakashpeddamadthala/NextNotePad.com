import React, { useState } from 'react';
import {
    NoteAdd as NewIcon,
    FolderOpen as OpenIcon,
    Save as SaveIcon,
    SaveAs as SaveAllIcon,
    Close as CloseIcon,
    ContentCut as CutIcon,
    ContentCopy as CopyIcon,
    ContentPaste as PasteIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Search as FindIcon,
    FindReplace as ReplaceIcon,
    CompareArrows as CompareIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    WrapText as WrapTextIcon,
    FormatListNumbered as ShowCharsIcon,
    FormatIndentIncrease as IndentIcon,
    FormatIndentDecrease as UnindentIcon,
    CloudSync as SyncIcon,
    CloudDone as SyncedIcon,
    CloudOff as SyncErrorIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Google as GoogleIcon,
    Print as PrintIcon,
    AutoFixHigh as FormatIcon,
    Download as DownloadIcon,
    Logout as LogoutIcon,
    FolderOpen as ManageIcon,
    FolderZip as ZipIcon,
} from '@mui/icons-material';
import { Tooltip, Avatar, CircularProgress, Menu, MenuItem, Divider } from '@mui/material';
import { getPalette } from '../../theme/colors';

interface NppToolbarProps {
    onNewFile: () => void;
    onOpenFile: () => void;
    onSaveFile: () => void;
    onSaveAll: () => void;
    onCloseFile: () => void;
    onPrint: () => void;
    onCut: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onFind: () => void;
    onReplace: () => void;
    onCompare: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onToggleWordWrap: () => void;
    onToggleShowAllChars: () => void;
    onIndent: () => void;
    onUnindent: () => void;
    onFormatText: () => void;
    onSyncDrive: () => void;
    onThemeToggle: () => void;
    onGoogleLogin: () => void;
    onGoogleLogout: () => void;
    onDevLogin?: () => void;
    onManageWorkspaces?: () => void;
    onDownloadFile: () => void;
    onDownloadAllAsZip: () => void;
    wordWrap: boolean;
    showAllChars: boolean;
    theme: 'light' | 'dark';
    syncing: boolean;
    syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
    user: { name: string; picture: string } | null;
}

const ToolbarSeparator = ({ isDark }: { isDark: boolean }) => (
    <div
        style={{
            width: 2,
            height: 22,
            background: 'transparent',
            borderLeft: `1px solid ${isDark ? '#555' : '#a0a0a0'}`,
            borderRight: `1px solid ${isDark ? '#333' : '#ffffff'}`,
            margin: '0 3px',
            flexShrink: 0,
        }}
    />
);

interface TBtnProps {
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    active?: boolean;
    isDark: boolean;
    disabled?: boolean;
}

const TBtn: React.FC<TBtnProps> = ({ icon, tooltip, onClick, active, isDark, disabled }) => (
    <Tooltip title={tooltip} arrow enterDelay={600}>
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                border: active ? `1px solid ${isDark ? '#555' : '#a0a0a0'}` : '1px solid transparent',
                borderRadius: 0,
                background: active
                    ? isDark ? '#505050' : '#d8e6f3'
                    : 'transparent',
                cursor: disabled ? 'default' : 'pointer',
                color: disabled
                    ? isDark ? '#666' : '#aaa'
                    : isDark ? '#d0d0d0' : '#333',
                padding: 0,
                flexShrink: 0,
                opacity: disabled ? 0.5 : 1,
            }}
            onMouseOver={(e) => {
                if (!disabled && !active) {
                    (e.currentTarget as HTMLElement).style.background = isDark ? '#454545' : '#c8daf0';
                    (e.currentTarget as HTMLElement).style.border = `1px solid ${isDark ? '#555' : '#a0a0a0'}`;
                }
            }}
            onMouseOut={(e) => {
                if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.border = '1px solid transparent';
                }
            }}
        >
            {icon}
        </button>
    </Tooltip>
);

const NppToolbar: React.FC<NppToolbarProps> = ({
    onNewFile, onOpenFile, onSaveFile, onSaveAll, onCloseFile, onPrint,
    onCut, onCopy, onPaste, onUndo, onRedo,
    onFind, onReplace, onCompare, onZoomIn, onZoomOut,
    onToggleWordWrap, onToggleShowAllChars,
    onIndent, onUnindent, onFormatText, onSyncDrive, onThemeToggle,
    onGoogleLogin, onGoogleLogout, onDevLogin, onManageWorkspaces,
    onDownloadFile, onDownloadAllAsZip,
    wordWrap, showAllChars, theme, syncing, syncStatus, user,
}) => {
    const p = getPalette(theme);
    const isDark = theme === 'dark';
    const iconSx = { fontSize: 18 };
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);
    const handleUserClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleLogoutClick = () => { handleMenuClose(); onGoogleLogout(); };

    return (
        <>
        <style>{`
                    .npp-toolbar::-webkit-scrollbar { height: 3px; }
            .npp-toolbar::-webkit-scrollbar-track { background: transparent; }
            .npp-toolbar::-webkit-scrollbar-thumb { background: ${p.scrollbar}; border-radius: 2px; }
        `}</style>
        <div
            className="npp-toolbar"
            style={{
                display: 'flex', alignItems: 'center', height: 32,
                background: p.panel,
                borderBottom: `1px solid ${p.border}`,
                padding: '0 6px', gap: 1, userSelect: 'none',
                overflowX: 'auto', flexShrink: 0,
                WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin',
            }}
        >
            {/* File operations */}
            <TBtn icon={<NewIcon sx={iconSx} />} tooltip="New (Ctrl+N)" onClick={onNewFile} isDark={isDark} />
            <TBtn icon={<OpenIcon sx={iconSx} />} tooltip="Open (Ctrl+O)" onClick={onOpenFile} isDark={isDark} />
            <TBtn icon={<SaveIcon sx={iconSx} />} tooltip="Save (Ctrl+S)" onClick={onSaveFile} isDark={isDark} />
            <TBtn icon={<SaveAllIcon sx={iconSx} />} tooltip="Save All (Ctrl+Shift+S)" onClick={onSaveAll} isDark={isDark} />
            <TBtn icon={<CloseIcon sx={iconSx} />} tooltip="Close (Ctrl+W)" onClick={onCloseFile} isDark={isDark} />
            <TBtn icon={<PrintIcon sx={iconSx} />} tooltip="Print (Ctrl+P)" onClick={onPrint} isDark={isDark} />
            <TBtn icon={<CompareIcon sx={iconSx} />} tooltip="Compare Files" onClick={onCompare} isDark={isDark} />

            <ToolbarSeparator isDark={isDark} />

            {/* Clipboard */}
            <TBtn icon={<CutIcon sx={iconSx} />} tooltip="Cut (Ctrl+X)" onClick={onCut} isDark={isDark} />
            <TBtn icon={<CopyIcon sx={iconSx} />} tooltip="Copy (Ctrl+C)" onClick={onCopy} isDark={isDark} />
            <TBtn icon={<PasteIcon sx={iconSx} />} tooltip="Paste (Ctrl+V)" onClick={onPaste} isDark={isDark} />

            <ToolbarSeparator isDark={isDark} />

            {/* Undo/Redo */}
            <TBtn icon={<UndoIcon sx={iconSx} />} tooltip="Undo (Ctrl+Z)" onClick={onUndo} isDark={isDark} />
            <TBtn icon={<RedoIcon sx={iconSx} />} tooltip="Redo (Ctrl+Y)" onClick={onRedo} isDark={isDark} />

            <ToolbarSeparator isDark={isDark} />

            {/* Search */}
            <TBtn icon={<FindIcon sx={iconSx} />} tooltip="Find (Ctrl+F)" onClick={onFind} isDark={isDark} />
            <TBtn icon={<ReplaceIcon sx={iconSx} />} tooltip="Replace (Ctrl+H)" onClick={onReplace} isDark={isDark} />

            <ToolbarSeparator isDark={isDark} />

            {/* Zoom */}
            <TBtn icon={<ZoomInIcon sx={iconSx} />} tooltip="Zoom In (Ctrl+Num+)" onClick={onZoomIn} isDark={isDark} />
            <TBtn icon={<ZoomOutIcon sx={iconSx} />} tooltip="Zoom Out (Ctrl+Num-)" onClick={onZoomOut} isDark={isDark} />

            <ToolbarSeparator isDark={isDark} />

            {/* View */}
            <TBtn icon={<WrapTextIcon sx={iconSx} />} tooltip="Word Wrap" onClick={onToggleWordWrap} active={wordWrap} isDark={isDark} />
            <TBtn icon={<ShowCharsIcon sx={iconSx} />} tooltip="Show All Characters" onClick={onToggleShowAllChars} active={showAllChars} isDark={isDark} />

            <ToolbarSeparator isDark={isDark} />

            {/* Indent */}
            <TBtn icon={<IndentIcon sx={iconSx} />} tooltip="Indent (Tab)" onClick={onIndent} isDark={isDark} />
            <TBtn icon={<UnindentIcon sx={iconSx} />} tooltip="Unindent (Shift+Tab)" onClick={onUnindent} isDark={isDark} />

            <ToolbarSeparator isDark={isDark} />

            {/* Format */}
            <TBtn icon={<FormatIcon sx={iconSx} />} tooltip="Format Text (JSON, XML, HTML, CSS, SQL)" onClick={onFormatText} isDark={isDark} />

            <ToolbarSeparator isDark={isDark} />

            {/* Download */}
            <TBtn icon={<DownloadIcon sx={iconSx} />} tooltip="Download File" onClick={onDownloadFile} isDark={isDark} />
            <TBtn icon={<ZipIcon sx={iconSx} />} tooltip="Download All as ZIP" onClick={onDownloadAllAsZip} isDark={isDark} />

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Cloud Sync with status */}
            <TBtn
                icon={syncing ? <CircularProgress size={16} /> :
                    syncStatus === 'synced' ? <SyncedIcon sx={{ ...iconSx, color: '#4caf50' }} /> :
                    syncStatus === 'error' ? <SyncErrorIcon sx={{ ...iconSx, color: '#f44336' }} /> :
                    <SyncIcon sx={iconSx} />}
                tooltip={syncing ? 'Syncing...' :
                    syncStatus === 'synced' ? 'Synced with Google Drive' :
                    syncStatus === 'error' ? 'Sync error - click to retry' :
                    'Sync to Google Drive'}
                onClick={onSyncDrive}
                isDark={isDark}
                disabled={syncing}
            />

            {/* Theme Toggle */}
            <TBtn
                icon={theme === 'dark' ? <LightModeIcon sx={iconSx} /> : <DarkModeIcon sx={iconSx} />}
                tooltip={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                onClick={onThemeToggle}
                isDark={isDark}
            />

            {/* Google Auth */}
            {user ? (
                <>
                    {/* Name + Avatar chip */}
                    <button
                        onClick={handleUserClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: isDark ? '#2a2d2e' : '#e0e8f0',
                            border: `1px solid ${isDark ? '#555' : '#b0c4d8'}`,
                            borderRadius: 12,
                            padding: '2px 8px 2px 3px',
                            cursor: 'pointer',
                            color: isDark ? '#d0d0d0' : '#222',
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            maxWidth: 160,
                            overflow: 'hidden',
                            flexShrink: 0,
                        }}
                        title={user.name}
                    >
                        <Avatar src={user.picture} alt={user.name} sx={{ width: 20, height: 20, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                            {user.name}
                        </span>
                    </button>

                    {/* Logout dropdown */}
                    <Menu
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            style: {
                                background: isDark ? '#252526' : '#f5f5f5',
                                color: isDark ? '#e0e0e0' : '#111',
                                border: `1px solid ${isDark ? '#3c3c3c' : '#ccc'}`,
                                borderRadius: 4,
                                minWidth: 180,
                            }
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '8px 14px 6px', pointerEvents: 'none' }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                        </div>
                        <Divider style={{ borderColor: isDark ? '#3c3c3c' : '#ddd', margin: 0 }} />
                        {onManageWorkspaces && (
                            <MenuItem
                                onClick={() => { handleMenuClose(); onManageWorkspaces(); }}
                                style={{ fontSize: 13, gap: 8, color: isDark ? '#e0e0e0' : '#111' }}
                            >
                                <ManageIcon sx={{ fontSize: 16 }} />
                                Manage Workspaces
                            </MenuItem>
                        )}
                        <Divider style={{ borderColor: isDark ? '#3c3c3c' : '#ddd', margin: 0 }} />
                        <MenuItem
                            onClick={handleLogoutClick}
                            style={{ fontSize: 13, gap: 8, color: isDark ? '#e0e0e0' : '#111' }}
                        >
                            <LogoutIcon sx={{ fontSize: 16 }} />
                            Sign out
                        </MenuItem>
                    </Menu>
                </>
            ) : (
                <>
                    {/* DEV-only mock login button */}
                    {onDevLogin && (
                        <button
                            onClick={onDevLogin}
                            title="[DEV ONLY] Mock login for testing"
                            style={{
                                background: '#7c3aed',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 3,
                                padding: '2px 7px',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                letterSpacing: '0.5px',
                                flexShrink: 0,
                            }}
                        >
                            DEV
                        </button>
                    )}
                    <button
                        onClick={onGoogleLogin}
                        title="Sign in with Google"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: isDark ? '#2a2d2e' : '#fff',
                            color: isDark ? '#d0d0d0' : '#3c4043',
                            border: `1px solid ${isDark ? '#555' : '#dadce0'}`,
                            borderRadius: 12,
                            padding: '2px 10px 2px 4px',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                        onMouseOver={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? '#3a3d3e' : '#f1f3f4';
                            (e.currentTarget as HTMLElement).style.borderColor = isDark ? '#888' : '#aaa';
                        }}
                        onMouseOut={e => {
                            (e.currentTarget as HTMLElement).style.background = isDark ? '#2a2d2e' : '#fff';
                            (e.currentTarget as HTMLElement).style.borderColor = isDark ? '#555' : '#dadce0';
                        }}
                    >
                        <GoogleIcon sx={{ fontSize: 16, color: '#4285f4' }} />
                        Sign in with Google
                    </button>
                </>
            )}
        </div>
        </>
    );
};

export default React.memo(NppToolbar);
