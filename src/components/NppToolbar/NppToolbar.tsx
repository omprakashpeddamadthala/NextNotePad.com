import React from 'react';
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
    FolderZip as ZipIcon,
} from '@mui/icons-material';
import { Tooltip, Avatar, CircularProgress } from '@mui/material';

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
            width: 1,
            height: 22,
            background: isDark ? '#555' : '#b0b0b0',
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
                width: 26,
                height: 26,
                border: 'none',
                borderRadius: 2,
                background: active
                    ? isDark ? '#505050' : '#c8daf0'
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
                    (e.currentTarget as HTMLElement).style.background = isDark ? '#454545' : '#d6e4f2';
                }
            }}
            onMouseOut={(e) => {
                if (!active) {
                    (e.currentTarget as HTMLElement).style.background = active
                        ? isDark ? '#505050' : '#c8daf0'
                        : 'transparent';
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
    onFind, onReplace, onZoomIn, onZoomOut,
    onToggleWordWrap, onToggleShowAllChars,
    onIndent, onUnindent, onFormatText, onSyncDrive, onThemeToggle,
    onGoogleLogin, onGoogleLogout,
    onDownloadFile, onDownloadAllAsZip,
    wordWrap, showAllChars, theme, syncing, syncStatus, user,
}) => {
    const isDark = theme === 'dark';
    const iconSx = { fontSize: 18 };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                height: 32,
                background: isDark ? '#3b3b3b' : '#e8e8e8',
                borderBottom: `1px solid ${isDark ? '#555' : '#bcbcbc'}`,
                padding: '0 4px',
                gap: 1,
                userSelect: 'none',
                flexShrink: 0,
            }}
        >
            {/* File operations */}
            <TBtn icon={<NewIcon sx={iconSx} />} tooltip="New (Ctrl+N)" onClick={onNewFile} isDark={isDark} />
            <TBtn icon={<OpenIcon sx={iconSx} />} tooltip="Open (Ctrl+O)" onClick={onOpenFile} isDark={isDark} />
            <TBtn icon={<SaveIcon sx={iconSx} />} tooltip="Save (Ctrl+S)" onClick={onSaveFile} isDark={isDark} />
            <TBtn icon={<SaveAllIcon sx={iconSx} />} tooltip="Save All (Ctrl+Shift+S)" onClick={onSaveAll} isDark={isDark} />
            <TBtn icon={<CloseIcon sx={iconSx} />} tooltip="Close (Ctrl+W)" onClick={onCloseFile} isDark={isDark} />
            <TBtn icon={<PrintIcon sx={iconSx} />} tooltip="Print (Ctrl+P)" onClick={onPrint} isDark={isDark} />

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
                    <Tooltip title={user.name}>
                        <button
                            onClick={onGoogleLogout}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '2px', display: 'flex', alignItems: 'center',
                            }}
                        >
                            <Avatar src={user.picture} alt={user.name} sx={{ width: 22, height: 22 }} />
                        </button>
                    </Tooltip>
                </>
            ) : (
                <TBtn
                    icon={<GoogleIcon sx={iconSx} />}
                    tooltip="Sign in with Google"
                    onClick={onGoogleLogin}
                    isDark={isDark}
                />
            )}
        </div>
    );
};

export default React.memo(NppToolbar);
