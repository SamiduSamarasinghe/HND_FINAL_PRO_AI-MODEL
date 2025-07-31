import { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent } from '@mui/material';

export default function ChatbotPopup() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="contained" onClick={() => setOpen(true)}>Chat with AI Tutor</Button>
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>AI Tutor</DialogTitle>
                <DialogContent>
                    {/* Chat interface here */}
                    <p>Mock chat messages will go here.</p>
                </DialogContent>
            </Dialog>
        </>
    );
}