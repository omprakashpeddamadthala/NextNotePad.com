import React, { useState, useCallback } from 'react';
import { Menu, MenuItem, Divider, Typography, ListItemText } from '@mui/material';
import { getPalette } from '../../theme/colors';

interface MenuBarProps {
    onNewFile: () => void;
    onCloseFile: () => void;
    onCloseAllFiles: () => void;
    onToggleWordWrap: () => void;
    onThemeToggle: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onFind: () => void;
    onReplace: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onSelectAll: () => void;
    onSetEncoding: (encoding: string) => void;
    onSetLanguage: (language: string) => void;
    onSaveFile: () => void;
    onOpenFile: () => void;
    onPrint: () => void;
    onGoToLine: () => void;
    wordWrap: boolean;
    showAllChars: boolean;
    onToggleShowAllChars: () => void;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    currentEncoding: string;
    currentLanguage: string;
    theme: 'light' | 'dark';
    onSyncDrive: () => void;
    onAbout: () => void;
    onDownloadFile: () => void;
    onDownloadAllAsZip: () => void;
    showMinimap: boolean;
    onToggleMinimap: () => void;
    onWordCount: () => void;
    onSortLines: () => void;
    onRemoveDuplicateLines: () => void;
    onTrimWhitespace: () => void;
    onUpperCase: () => void;
    onLowerCase: () => void;
    onRunInBrowser: () => void;
    onCompare: () => void;
    onOpenSettingsJson: () => void;
}

interface MenuDef {
    label: string;
    id: string;
}

const MENUS: MenuDef[] = [
    { label: 'File', id: 'file' },
    { label: 'Edit', id: 'edit' },
    { label: 'Search', id: 'search' },
    { label: 'View', id: 'view' },
    { label: 'Encoding', id: 'encoding' },
    { label: 'Language', id: 'language' },
    { label: 'Settings', id: 'settings' },
    { label: 'Tools', id: 'tools' },
    { label: '?', id: 'help' },
];

const LANGUAGES = [
    'Normal Text', 'Batch', 'C', 'C#', 'C++', 'CSS', 'CoffeeScript',
    'D', 'Dart', 'Diff', 'Go', 'HTML', 'Java', 'JavaScript', 'JSON',
    'Kotlin', 'Lua', 'Markdown', 'Pascal', 'Perl', 'PHP', 'PowerShell',
    'Python', 'R', 'Ruby', 'Rust', 'Shell', 'SQL', 'Swift', 'TypeScript',
    'XML', 'YAML',
];

const MenuBar: React.FC<MenuBarProps> = ({
    onNewFile, onCloseFile, onCloseAllFiles, onToggleWordWrap,
    onUndo, onRedo, onFind, onReplace,
    onZoomIn, onZoomOut, onZoomReset,
    onSelectAll, onSetEncoding, onSetLanguage,
    onSaveFile, onOpenFile, onPrint, onGoToLine,
    wordWrap, showAllChars, onToggleShowAllChars,
    sidebarOpen, onToggleSidebar,
    currentEncoding, currentLanguage, theme,
    onSyncDrive, onAbout, onThemeToggle, onOpenSettingsJson,
    onDownloadFile, onDownloadAllAsZip,
    showMinimap, onToggleMinimap,
    onWordCount, onSortLines, onRemoveDuplicateLines, onTrimWhitespace,
    onUpperCase, onLowerCase, onRunInBrowser, onCompare,
}) => {
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [hovering, setHovering] = useState(false);

    const p = getPalette(theme);

    const handleMenuClick = useCallback((e: React.MouseEvent<HTMLElement>, menuId: string) => {
        if (openMenu === menuId) {
            setOpenMenu(null);
            setAnchorEl(null);
        } else {
            setOpenMenu(menuId);
            setAnchorEl(e.currentTarget);
            setHovering(true);
        }
    }, [openMenu]);

    const handleMenuHover = useCallback((e: React.MouseEvent<HTMLElement>, menuId: string) => {
        if (hovering && openMenu && openMenu !== menuId) {
            setOpenMenu(menuId);
            setAnchorEl(e.currentTarget);
        }
    }, [hovering, openMenu]);

    const closeMenu = useCallback(() => {
        setOpenMenu(null);
        setAnchorEl(null);
        setHovering(false);
    }, []);

    const menuAction = useCallback((action: () => void) => {
        return () => { action(); closeMenu(); };
    }, [closeMenu]);

    const Shortcut = ({ text }: { text: string }) => (
        <Typography variant="body2" sx={{ ml: 4, color: 'text.secondary', fontSize: '12px', flexShrink: 0 }}>
            {text}
        </Typography>
    );

    const Check = ({ checked }: { checked: boolean }) => (
        <span style={{ width: 18, display: 'inline-block', textAlign: 'center', marginRight: 4 }}>
            {checked ? '✓' : ''}
        </span>
    );

    const menuItemSx = { fontSize: '13px', minHeight: 28, py: 0.3, px: 2 };

    const langToId = (lang: string) => {
        const map: Record<string, string> = {
            'Normal Text': 'plaintext', 'C': 'c', 'C#': 'csharp', 'C++': 'cpp',
            'CSS': 'css', 'Go': 'go', 'HTML': 'html', 'Java': 'java',
            'JavaScript': 'javascript', 'JSON': 'json', 'Kotlin': 'kotlin',
            'Markdown': 'markdown', 'PHP': 'php', 'Python': 'python',
            'Ruby': 'ruby', 'Rust': 'rust', 'Shell': 'shell', 'SQL': 'sql',
            'Swift': 'swift', 'TypeScript': 'typescript', 'XML': 'xml', 'YAML': 'yaml',
            'Batch': 'bat', 'PowerShell': 'powershell', 'R': 'r', 'Perl': 'perl',
            'Lua': 'lua', 'Dart': 'dart', 'Pascal': 'pascal',
        };
        return map[lang] || lang.toLowerCase();
    };

    return (
        <>
            <div
                style={{
                    display: 'flex', alignItems: 'center', height: 24,
                    padding: '0 0 0 2px', userSelect: 'none', background: p.panelAlt,
                    overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                }}
            >
                {MENUS.map((menu) => (
                    <div
                        key={menu.id}
                        onClick={(e) => handleMenuClick(e, menu.id)}
                        onMouseEnter={(e) => handleMenuHover(e, menu.id)}
                        style={{
                            padding: '2px 8px', fontSize: '13px',
                            fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
                            cursor: 'default',
                            color: p.text,
                            background: openMenu === menu.id ? p.active : 'transparent',
                            borderRadius: 0, lineHeight: '20px',
                        }}
                        onMouseOver={(e) => {
                            if (openMenu !== menu.id) (e.currentTarget as HTMLElement).style.background = p.hover;
                        }}
                        onMouseOut={(e) => {
                            if (openMenu !== menu.id) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                    >
                        {menu.label}
                    </div>
                ))}
            </div>

            {/* ── File ── */}
            <Menu anchorEl={openMenu === 'file' ? anchorEl : null} open={openMenu === 'file'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 260, borderRadius: '2px', mt: 0 } }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                <MenuItem sx={menuItemSx} onClick={menuAction(onNewFile)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>New</Typography></ListItemText>
                    <Shortcut text="Ctrl+N" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onOpenFile)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Open...</Typography></ListItemText>
                    <Shortcut text="Ctrl+O" />
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onSaveFile)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Save</Typography></ListItemText>
                    <Shortcut text="Ctrl+S" />
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onCloseFile)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Close</Typography></ListItemText>
                    <Shortcut text="Ctrl+W" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onCloseAllFiles)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Close All</Typography></ListItemText>
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onDownloadFile)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Download File</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onDownloadAllAsZip)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Download All as ZIP</Typography></ListItemText>
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onPrint)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Print...</Typography></ListItemText>
                    <Shortcut text="Ctrl+P" />
                </MenuItem>
            </Menu>

            {/* ── Edit ── */}
            <Menu anchorEl={openMenu === 'edit' ? anchorEl : null} open={openMenu === 'edit'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 260, borderRadius: '2px', mt: 0 } }}>
                <MenuItem sx={menuItemSx} onClick={menuAction(onUndo)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Undo</Typography></ListItemText>
                    <Shortcut text="Ctrl+Z" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onRedo)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Redo</Typography></ListItemText>
                    <Shortcut text="Ctrl+Y" />
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={closeMenu}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Cut</Typography></ListItemText>
                    <Shortcut text="Ctrl+X" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={closeMenu}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Copy</Typography></ListItemText>
                    <Shortcut text="Ctrl+C" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={closeMenu}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Paste</Typography></ListItemText>
                    <Shortcut text="Ctrl+V" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={closeMenu}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Delete</Typography></ListItemText>
                    <Shortcut text="Del" />
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onSelectAll)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Select All</Typography></ListItemText>
                    <Shortcut text="Ctrl+A" />
                </MenuItem>
            </Menu>

            {/* ── Search ── */}
            <Menu anchorEl={openMenu === 'search' ? anchorEl : null} open={openMenu === 'search'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 260, borderRadius: '2px', mt: 0 } }}>
                <MenuItem sx={menuItemSx} onClick={menuAction(onFind)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Find...</Typography></ListItemText>
                    <Shortcut text="Ctrl+F" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onReplace)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Replace...</Typography></ListItemText>
                    <Shortcut text="Ctrl+H" />
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onGoToLine)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Go to Line...</Typography></ListItemText>
                    <Shortcut text="Ctrl+G" />
                </MenuItem>
            </Menu>

            {/* ── View ── */}
            <Menu anchorEl={openMenu === 'view' ? anchorEl : null} open={openMenu === 'view'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 260, borderRadius: '2px', mt: 0 } }}>
                <MenuItem sx={menuItemSx} onClick={menuAction(onToggleSidebar)}>
                    <Check checked={sidebarOpen} />
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>File Explorer</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onToggleMinimap)}>
                    <Check checked={showMinimap} />
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Minimap</Typography></ListItemText>
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onToggleWordWrap)}>
                    <Check checked={wordWrap} />
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Word Wrap</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onToggleShowAllChars)}>
                    <Check checked={showAllChars} />
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Show All Characters</Typography></ListItemText>
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onZoomIn)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Zoom In</Typography></ListItemText>
                    <Shortcut text="Ctrl+Num+" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onZoomOut)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Zoom Out</Typography></ListItemText>
                    <Shortcut text="Ctrl+Num-" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onZoomReset)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Restore Default Zoom</Typography></ListItemText>
                    <Shortcut text="Ctrl+Num/" />
                </MenuItem>
            </Menu>

            {/* ── Encoding ── */}
            <Menu anchorEl={openMenu === 'encoding' ? anchorEl : null} open={openMenu === 'encoding'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 220, borderRadius: '2px', mt: 0 } }}>
                {['ANSI', 'UTF-8', 'UTF-8-BOM', 'UCS-2 BE BOM', 'UCS-2 LE BOM'].map((enc) => (
                    <MenuItem key={enc} sx={menuItemSx} onClick={menuAction(() => onSetEncoding(enc))}>
                        <Check checked={currentEncoding === enc} />
                        <ListItemText><Typography sx={{ fontSize: '13px' }}>{enc}</Typography></ListItemText>
                    </MenuItem>
                ))}
            </Menu>

            {/* ── Language ── */}
            <Menu anchorEl={openMenu === 'language' ? anchorEl : null} open={openMenu === 'language'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 200, maxHeight: 400, borderRadius: '2px', mt: 0 } }}>
                {LANGUAGES.map((lang) => (
                    <MenuItem key={lang} sx={menuItemSx} selected={currentLanguage === langToId(lang)}
                        onClick={menuAction(() => onSetLanguage(langToId(lang)))}>
                        <ListItemText><Typography sx={{ fontSize: '13px' }}>{lang}</Typography></ListItemText>
                    </MenuItem>
                ))}
            </Menu>

            {/* ── Settings ── (theme, font size — the persisted app preferences) */}
            <Menu anchorEl={openMenu === 'settings' ? anchorEl : null} open={openMenu === 'settings'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 220, borderRadius: '2px', mt: 0 } }}>
                <MenuItem sx={menuItemSx} onClick={menuAction(onThemeToggle)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Toggle Dark / Light Mode</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onOpenSettingsJson)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Open Settings (JSON)</Typography></ListItemText>
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onZoomIn)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Increase Font Size</Typography></ListItemText>
                    <Shortcut text="Ctrl+Num+" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onZoomOut)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Decrease Font Size</Typography></ListItemText>
                    <Shortcut text="Ctrl+Num-" />
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onZoomReset)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Reset Font Size</Typography></ListItemText>
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onSyncDrive)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Sync to Google Drive</Typography></ListItemText>
                </MenuItem>
            </Menu>

            {/* ── Tools ── (text manipulation + file tools, previously split across Tools + Plugins) */}
            <Menu anchorEl={openMenu === 'tools' ? anchorEl : null} open={openMenu === 'tools'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 240, borderRadius: '2px', mt: 0 } }}>
                <MenuItem sx={menuItemSx} onClick={menuAction(onCompare)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Compare Files...</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onWordCount)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Word Count</Typography></ListItemText>
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onSortLines)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Sort Lines</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onRemoveDuplicateLines)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Remove Duplicate Lines</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onTrimWhitespace)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Trim Trailing Whitespace</Typography></ListItemText>
                </MenuItem>
                <Divider sx={{ my: '2px!important' }} />
                <MenuItem sx={menuItemSx} onClick={menuAction(onUpperCase)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>UPPERCASE</Typography></ListItemText>
                </MenuItem>
                <MenuItem sx={menuItemSx} onClick={menuAction(onLowerCase)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>lowercase</Typography></ListItemText>
                </MenuItem>
            </Menu>

            {/* ── Run ── */}
            <Menu anchorEl={openMenu === 'run' ? anchorEl : null} open={openMenu === 'run'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 220, borderRadius: '2px', mt: 0 } }}>
                <MenuItem sx={menuItemSx} onClick={menuAction(onRunInBrowser)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>Run in Browser</Typography></ListItemText>
                    <Shortcut text="F5" />
                </MenuItem>
            </Menu>

            {/* ── Help ── */}
            <Menu anchorEl={openMenu === 'help' ? anchorEl : null} open={openMenu === 'help'} onClose={closeMenu}
                sx={{ '& .MuiPaper-root': { minWidth: 220, borderRadius: '2px', mt: 0 } }}>
                <MenuItem sx={menuItemSx} onClick={menuAction(onAbout)}>
                    <ListItemText><Typography sx={{ fontSize: '13px' }}>About NextNotePad.com</Typography></ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default React.memo(MenuBar);
