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
    onGuestLogin?: () => void;
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

const ToolbarSeparator = ({ theme }: { theme: 'light' | 'dark' }) => {
    const p = getPalette(theme);
    return (
        <div
            style={{
                width: 1,
                height: 24,
                background: p.border,
                margin: '0 6px',
                flexShrink: 0,
            }}
        />
    );
};

interface TBtnProps {
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    active?: boolean;
    theme: 'light' | 'dark';
    disabled?: boolean;
}

const TBtn: React.FC<TBtnProps> = ({ icon, tooltip, onClick, active, theme, disabled }) => {
    const p = getPalette(theme);
    return (
        <Tooltip title={tooltip} arrow enterDelay={600}>
            <button
                onClick={onClick}
                disabled={disabled}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    border: active ? `1px solid ${p.accent}66` : '1px solid transparent',
                    borderRadius: 8,
                    background: active ? `${p.accent}22` : 'transparent',
                    cursor: disabled ? 'default' : 'pointer',
                    color: active ? p.accentHover : (disabled ? p.textMute : p.textDim),
                    padding: 0,
                    margin: '0 1px',
                    flexShrink: 0,
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: 'scale(1)',
                }}
                onMouseOver={(e) => {
                    if (!disabled && !active) {
                        (e.currentTarget as HTMLElement).style.background = p.hover;
                        (e.currentTarget as HTMLElement).style.color = p.text;
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
                    }
                }}
                onMouseOut={(e) => {
                    if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = p.textDim;
                        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                    }
                }}
            >
                {icon}
            </button>
        </Tooltip>
    );
};

const NppToolbar: React.FC<NppToolbarProps> = ({
    onNewFile, onOpenFile, onSaveFile, onSaveAll, onCloseFile, onPrint,
    onCut, onCopy, onPaste, onUndo, onRedo,
    onFind, onReplace, onCompare, onZoomIn, onZoomOut,
    onToggleWordWrap, onToggleShowAllChars,
    onIndent, onUnindent, onFormatText, onSyncDrive, onThemeToggle,
    onGoogleLogin, onGoogleLogout, onGuestLogin, onDevLogin, onManageWorkspaces,
    onDownloadFile, onDownloadAllAsZip,
    wordWrap, showAllChars, theme, syncing, syncStatus, user,
}) => {
    const p = getPalette(theme);
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
                display: 'flex', alignItems: 'center', height: 44,
                background: `linear-gradient(180deg, ${p.panelAlt} 0%, ${p.panel} 100%)`,
                borderBottom: `1px solid ${p.border}`,
                padding: '0 12px', gap: 2, userSelect: 'none',
                overflowX: 'auto', flexShrink: 0,
                WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin',
            }}
        >
            {/* File operations */}
            <TBtn icon={<NewIcon sx={iconSx} />} tooltip="New (Ctrl+N)" onClick={onNewFile} theme={theme} />
            <TBtn icon={<OpenIcon sx={iconSx} />} tooltip="Open (Ctrl+O)" onClick={onOpenFile} theme={theme} />
            <TBtn icon={<SaveIcon sx={iconSx} />} tooltip="Save (Ctrl+S)" onClick={onSaveFile} theme={theme} />
            <TBtn icon={<SaveAllIcon sx={iconSx} />} tooltip="Save All (Ctrl+Shift+S)" onClick={onSaveAll} theme={theme} />
            <TBtn icon={<CloseIcon sx={iconSx} />} tooltip="Close (Ctrl+W)" onClick={onCloseFile} theme={theme} />
            <TBtn icon={<PrintIcon sx={iconSx} />} tooltip="Print (Ctrl+P)" onClick={onPrint} theme={theme} />
            <TBtn icon={<CompareIcon sx={iconSx} />} tooltip="Compare Files" onClick={onCompare} theme={theme} />

            <ToolbarSeparator theme={theme} />

            {/* Clipboard */}
            <TBtn icon={<CutIcon sx={iconSx} />} tooltip="Cut (Ctrl+X)" onClick={onCut} theme={theme} />
            <TBtn icon={<CopyIcon sx={iconSx} />} tooltip="Copy (Ctrl+C)" onClick={onCopy} theme={theme} />
            <TBtn icon={<PasteIcon sx={iconSx} />} tooltip="Paste (Ctrl+V)" onClick={onPaste} theme={theme} />

            <ToolbarSeparator theme={theme} />

            {/* Undo/Redo */}
            <TBtn icon={<UndoIcon sx={iconSx} />} tooltip="Undo (Ctrl+Z)" onClick={onUndo} theme={theme} />
            <TBtn icon={<RedoIcon sx={iconSx} />} tooltip="Redo (Ctrl+Y)" onClick={onRedo} theme={theme} />

            <ToolbarSeparator theme={theme} />

            {/* Search */}
            <TBtn icon={<FindIcon sx={iconSx} />} tooltip="Find (Ctrl+F)" onClick={onFind} theme={theme} />
            <TBtn icon={<ReplaceIcon sx={iconSx} />} tooltip="Replace (Ctrl+H)" onClick={onReplace} theme={theme} />

            <ToolbarSeparator theme={theme} />

            {/* Zoom */}
            <TBtn icon={<ZoomInIcon sx={iconSx} />} tooltip="Zoom In (Ctrl+Num+)" onClick={onZoomIn} theme={theme} />
            <TBtn icon={<ZoomOutIcon sx={iconSx} />} tooltip="Zoom Out (Ctrl+Num-)" onClick={onZoomOut} theme={theme} />

            <ToolbarSeparator theme={theme} />

            {/* View */}
            <TBtn icon={<WrapTextIcon sx={iconSx} />} tooltip="Word Wrap" onClick={onToggleWordWrap} active={wordWrap} theme={theme} />
            <TBtn icon={<ShowCharsIcon sx={iconSx} />} tooltip="Show All Characters" onClick={onToggleShowAllChars} active={showAllChars} theme={theme} />

            <ToolbarSeparator theme={theme} />

            {/* Indent */}
            <TBtn icon={<IndentIcon sx={iconSx} />} tooltip="Indent (Tab)" onClick={onIndent} theme={theme} />
            <TBtn icon={<UnindentIcon sx={iconSx} />} tooltip="Unindent (Shift+Tab)" onClick={onUnindent} theme={theme} />

            <ToolbarSeparator theme={theme} />

            {/* Format */}
            <TBtn icon={<FormatIcon sx={iconSx} />} tooltip="Format Text (JSON, XML, HTML, CSS, SQL)" onClick={onFormatText} theme={theme} />

            <ToolbarSeparator theme={theme} />

            {/* Download */}
            <TBtn icon={<DownloadIcon sx={iconSx} />} tooltip="Download File" onClick={onDownloadFile} theme={theme} />
            <TBtn icon={<ZipIcon sx={iconSx} />} tooltip="Download All as ZIP" onClick={onDownloadAllAsZip} theme={theme} />

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Cloud Sync with status */}
            <TBtn
                icon={syncing ? <CircularProgress size={16} /> :
                    syncStatus === 'synced' ? <SyncedIcon sx={{ ...iconSx, color: p.success }} /> :
                    syncStatus === 'error' ? <SyncErrorIcon sx={{ ...iconSx, color: p.danger }} /> :
                    <SyncIcon sx={iconSx} />}
                tooltip={syncing ? 'Syncing...' :
                    syncStatus === 'synced' ? 'Synced with Google Drive' :
                    syncStatus === 'error' ? 'Sync error - click to retry' :
                    'Sync to Google Drive'}
                onClick={onSyncDrive}
                theme={theme}
                disabled={syncing}
            />

            {/* Theme Toggle */}
            <TBtn
                icon={theme === 'dark' ? <LightModeIcon sx={iconSx} /> : <DarkModeIcon sx={iconSx} />}
                tooltip={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                onClick={onThemeToggle}
                theme={theme}
            />

            {/* Workspace Management — always visible (guest + logged-in) */}
            {onManageWorkspaces && (
                <TBtn
                    icon={<ManageIcon sx={iconSx} />}
                    tooltip="Manage Workspaces"
                    onClick={onManageWorkspaces}
                    theme={theme}
                />
            )}

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
                            background: p.panelAlt,
                            border: `1px solid ${p.border}`,
                            borderRadius: 12,
                            padding: '2px 8px 2px 3px',
                            cursor: 'pointer',
                            color: p.text,
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',


                            flexShrink: 0,
                        }}
                        title={user.name}
                    >
                        <Avatar src={user.picture} alt={user.name} sx={{ width: 20, height: 20, flexShrink: 0 }} />
                        <span>
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
                                background: p.panel,
                                color: p.text,
                                border: `1px solid ${p.border}`,
                                borderRadius: 4,
                                minWidth: 180,
                            }
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '8px 14px 6px', pointerEvents: 'none' }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name}</div>
                        </div>
                        <Divider style={{ borderColor: p.border, margin: 0 }} />
                        {onManageWorkspaces && (
                            <MenuItem
                                onClick={() => { handleMenuClose(); onManageWorkspaces(); }}
                                style={{ fontSize: 13, gap: 8, color: p.text }}
                            >
                                <ManageIcon sx={{ fontSize: 16 }} />
                                Manage Workspaces
                            </MenuItem>
                        )}
                        <Divider style={{ borderColor: p.border, margin: 0 }} />
                        <MenuItem
                            onClick={handleLogoutClick}
                            style={{ fontSize: 13, gap: 8, color: p.text }}
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
                            background: p.panelAlt,
                            color: p.text,
                            border: `1px solid ${p.border}`,
                            borderRadius: 12,
                            padding: '2px 10px 2px 4px',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                        onMouseOver={e => {
                            (e.currentTarget as HTMLElement).style.background = p.hover;
                            (e.currentTarget as HTMLElement).style.borderColor = p.accentHover;
                        }}
                        onMouseOut={e => {
                            (e.currentTarget as HTMLElement).style.background = p.panelAlt;
                            (e.currentTarget as HTMLElement).style.borderColor = p.border;
                        }}
                    >
                        <GoogleIcon sx={{ fontSize: 16, color: '#4285f4' }} />
                        Sign in with Google
                    </button>
                    {onGuestLogin && (
                        <button
                            onClick={onGuestLogin}
                            title="Continue as Guest (localStorage only)"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: p.panelAlt,
                                color: p.textDim,
                                border: `1px solid ${p.border}`,
                                borderRadius: 12,
                                padding: '2px 10px',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                            onMouseOver={e => {
                                (e.currentTarget as HTMLElement).style.background = p.hover;
                                (e.currentTarget as HTMLElement).style.borderColor = p.accentHover;
                            }}
                            onMouseOut={e => {
                                (e.currentTarget as HTMLElement).style.background = p.panelAlt;
                                (e.currentTarget as HTMLElement).style.borderColor = p.border;
                            }}
                        >
                            Guest
                        </button>
                    )}
                </>
            )}
        </div>
        </>
    );
};

export default React.memo(NppToolbar);
