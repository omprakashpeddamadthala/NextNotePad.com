import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import Editor from '@monaco-editor/react';
import { getPalette } from '../../theme/colors';

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
    settings: any;
    onSaveSettings: (newSettings: any) => void;
    theme: 'light' | 'dark';
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose, settings, onSaveSettings, theme }) => {
    const p = getPalette(theme);
    const [jsonStr, setJsonStr] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && settings) {
            setJsonStr(JSON.stringify(settings, null, 4));
            setError(null);
        }
    }, [open, settings]);

    const handleSave = () => {
        try {
            const parsed = JSON.parse(jsonStr);
            onSaveSettings(parsed);
            onClose();
        } catch (err) {
            setError('Invalid JSON format');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ background: p.panel, color: p.text, borderBottom: `1px solid ${p.border}` }}>
                Settings (JSON)
            </DialogTitle>
            <DialogContent sx={{ background: p.bg, p: 0, height: '60vh', overflow: 'hidden' }}>
                <Editor
                    height="100%"
                    language="json"
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    value={jsonStr}
                    onChange={(val) => {
                        setJsonStr(val || '');
                        setError(null);
                    }}
                    options={{ minimap: { enabled: false }, fontSize: 14, formatOnPaste: true }}
                />
            </DialogContent>
            <DialogActions sx={{ background: p.panel, borderTop: `1px solid ${p.border}` }}>
                {error && <span style={{ color: '#f44336', marginRight: 'auto', paddingLeft: 16, fontSize: 13 }}>{error}</span>}
                <Button onClick={onClose} sx={{ color: p.text }}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(SettingsDialog);
