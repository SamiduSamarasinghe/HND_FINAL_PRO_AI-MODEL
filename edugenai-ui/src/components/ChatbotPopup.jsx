import { Dialog, DialogTitle, DialogContent, TextField, Typography, Button } from '@mui/material';
import { useState } from 'react';

export default function ChatbotPopup() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="contained" onClick={() => setOpen(true)}>
                CHAT WITH AI TUTOR
            </Button>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>AI Tutor</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>Ask me about any topic!</Typography>
                    <TextField fullWidth placeholder="Type your question..." />
                </DialogContent>
            </Dialog>
        </>
    );
}