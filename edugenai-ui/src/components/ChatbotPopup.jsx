import { Button } from '@mui/material';

export default function ChatbotPopup() {
    return (
        <Button
            variant="contained"
            fullWidth
            sx={{
                py: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                backgroundColor: '#1976d2',
                borderRadius: 1,
                '&:hover': {
                    backgroundColor: '#1565c0'
                }
            }}
        >
            CHAT WITH AI TUTOR
        </Button>
    );
}