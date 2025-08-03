import { AppBar, Toolbar, Button, Typography } from '@mui/material';

export default function Navbar() {
    return (
        <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
            <Toolbar sx={{ justifyContent: 'center' }}>
                <Typography variant="h6" component="div" sx={{
                    fontWeight: 'bold',
                    mr: 4,
                    color: 'white'
                }}>
                    EduGenAI
                </Typography>
                <Button color="inherit">Home</Button>
                <Button color="inherit">Upload Papers</Button>
                <Button color="inherit">Generate Exam</Button>
                <Button color="inherit">Chatbot Tutor</Button>
                <Button color="inherit">Analytics</Button>
                <Button color="inherit">Profile</Button>
            </Toolbar>
        </AppBar>
    );
}