import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getPalette } from '../../theme/colors';

interface AboutDialogProps {
    open: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
}

const AboutDialog: React.FC<AboutDialogProps> = ({ open, onClose, theme }) => {
    const p = getPalette(theme);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    background: p.panel,
                    color: p.text,
                    border: `1px solid ${p.border}`,
                },
            }}
        >
            <DialogTitle sx={{
                fontFamily: "'Segoe UI', sans-serif",
                color: p.text,
                borderBottom: `1px solid ${p.border}`,
                pb: 1.5,
            }}>
                About NextNotePad.com
            </DialogTitle>
            <DialogContent sx={{ pt: '16px !important' }}>
                <div style={{ textAlign: 'center', marginBottom: 16, padding: '12px 0', borderBottom: `1px solid ${p.border}` }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: p.text }}>NextNotePad.com</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: p.accent, fontWeight: 500 }}>Version 3.0.0</div>
                    <div style={{ fontSize: 12, marginTop: 6, color: p.textMute }}>
                        Write. Code. Create — Anywhere.<br />
                        A powerful browser-based code editor built with React, Monaco Editor &amp; Material-UI.
                    </div>
                </div>

                {[
                    { icon: '✏️', title: 'Code Editor', desc: 'Syntax highlighting for 50+ languages • Monaco on desktop, touch-optimised textarea on mobile • Find & Replace • Go to Line • Word wrap • Zoom • Auto-indent' },
                    { icon: '📁', title: 'File Management', desc: 'Create, rename & delete files • Multi-tab editing with drag reorder • Sidebar with search • Drag & drop import • Auto-save to browser • Download / Export as ZIP' },
                    { icon: '🗂️', title: 'Workspaces', desc: 'Multiple named workspaces • Create on first login • Switch, rename & delete • Separate file lists per workspace • Google Drive folder per workspace' },
                    { icon: '☁️', title: 'Cloud Sync', desc: 'Google Sign-In • Auto-sync to Google Drive every 5 min • Manual sync • Token refresh & session persistence • Sync status indicator' },
                    { icon: '📱', title: 'Mobile UI', desc: 'Fully responsive — hamburger drawer menu on mobile • File list drawer with icons • Touch-friendly text editor • Floating ＋ button • Workspace management on mobile' },
                    { icon: '⚙️', title: 'Settings (JSON)', desc: 'Edit all app preferences as live JSON • Includes theme, font size, word wrap, minimap, encoding, language • Persisted to localStorage & Google Drive' },
                    { icon: '🎨', title: 'Customization', desc: 'Dark & Light themes • Font size control • Minimap toggle • Word wrap toggle • Encoding & language selector' },
                    { icon: '✨', title: 'Tools', desc: 'Word count • Sort lines • Remove duplicates • Trim whitespace • UPPER/lowercase • Format code (JSON, XML, HTML, CSS, SQL) • Run HTML in browser • Compare files' },
                ].map((section) => (
                    <div key={section.title} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: p.text, marginBottom: 3 }}>
                            {section.icon} {section.title}
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, color: p.textDim, paddingLeft: 8 }}>
                            {section.desc}
                        </div>
                    </div>
                ))}

                <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 12, borderTop: `1px solid ${p.border}`, fontSize: 11, color: p.textMute }}>
                    © 2026 NextNotePad.com. All rights reserved.
                </div>
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${p.border}` }}>
                <Button
                    onClick={onClose}
                    sx={{ color: p.accent }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(AboutDialog);
