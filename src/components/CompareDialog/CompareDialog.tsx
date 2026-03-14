import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { Note } from '../../types/Note';

interface CompareDialogProps {
    open: boolean;
    onClose: () => void;
    currentNote: Note | null;
    notes: Note[];
    onCompare: (targetId: string) => void;
    theme: 'light' | 'dark';
}

const CompareDialog: React.FC<CompareDialogProps> = ({ open, onClose, currentNote, notes, onCompare, theme }) => {
    const isDark = theme === 'dark';
    const [selectedId, setSelectedId] = useState<string>('');

    // other files to compare with (memoized so the reference is stable between renders)
    const availableNotes = useMemo(
        () => notes.filter((n) => n.id !== currentNote?.id),
        [notes, currentNote]
    );

    // Reset selection only when the dialog opens, not on every render
    useEffect(() => {
        if (open) {
            setSelectedId(availableNotes.length > 0 ? availableNotes[0].id : '');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleCompare = () => {
        if (selectedId) {
            onCompare(selectedId);
            onClose();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xs" 
            fullWidth
            PaperProps={{
                style: {
                    background: isDark ? '#252526' : '#f0f0f0',
                    color: isDark ? '#e0e0e0' : '#000000',
                    borderRadius: 0,
                    border: `1px solid ${isDark ? '#3c3c3c' : '#a0a0a0'}`,
                }
            }}
        >
            <DialogTitle style={{ fontSize: 14, fontWeight: 600 }}>Compare Files</DialogTitle>
            <DialogContent>
                <div style={{ marginBottom: 16, fontSize: 13 }}>
                    Current File: <strong>{currentNote?.name || 'None'}</strong>
                </div>
                {availableNotes.length === 0 ? (
                    <div style={{ fontSize: 13, color: isDark ? '#aaa' : '#666' }}>
                        No other files available to compare.
                    </div>
                ) : (
                    <FormControl fullWidth size="small" style={{ marginTop: 8 }}>
                        <InputLabel id="compare-select-label" style={{ color: isDark ? '#aaa' : '#666' }}>Compare with...</InputLabel>
                        <Select
                            labelId="compare-select-label"
                            value={selectedId}
                            label="Compare with..."
                            onChange={(e) => setSelectedId(e.target.value)}
                            style={{
                                borderRadius: 0,
                                color: isDark ? '#e0e0e0' : '#000000',
                                background: isDark ? '#333' : '#fff',
                            }}
                        >
                            {availableNotes.map((note) => (
                                <MenuItem key={note.id} value={note.id} style={{ fontSize: 13, borderRadius: 0 }}>
                                    {note.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions style={{ padding: '8px 24px 16px' }}>
                <Button 
                    onClick={onClose} 
                    style={{ 
                        color: isDark ? '#ccc' : '#333',
                        textTransform: 'none',
                        borderRadius: 0,
                        border: `1px solid ${isDark ? '#555' : '#ccc'}`,
                        background: isDark ? '#333' : '#e1e1e1',
                    }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleCompare} 
                    disabled={!selectedId}
                    style={{ 
                        color: selectedId ? (isDark ? '#fff' : '#000') : (isDark ? '#555' : '#999'),
                        textTransform: 'none',
                        borderRadius: 0,
                        border: `1px solid ${isDark ? '#555' : '#ccc'}`,
                        background: selectedId ? (isDark ? '#007acc' : '#c8daf0') : (isDark ? '#2d2d2d' : '#f0f0f0'),
                    }}
                >
                    Compare
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CompareDialog;
