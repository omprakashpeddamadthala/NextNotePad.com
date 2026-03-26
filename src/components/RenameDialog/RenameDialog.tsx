import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface RenameDialogProps {
    open: boolean;
    initialName: string;
    onClose: () => void;
    onRename: (newName: string) => void;
}

const RenameDialog: React.FC<RenameDialogProps> = ({ open, initialName, onClose, onRename }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (open) {
            setName(initialName);
        }
    }, [open, initialName]);

    const handleConfirm = () => {
        if (name.trim()) {
            onRename(name.trim());
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Rename File</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    label="File name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleConfirm} variant="contained">Rename</Button>
            </DialogActions>
        </Dialog>
    );
};

export default React.memo(RenameDialog);
