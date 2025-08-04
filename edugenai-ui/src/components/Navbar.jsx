import { AppBar, Toolbar, Button, Typography, Menu, MenuItem, Box } from '@mui/material';
import {useState} from 'react';
export default function Navbar() {
    const [examsAnchor, setExamsAnchor] = useState(null);
    const [analyticsAnchor, setAnalyticsAnchor] = useState(null);
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
                <Button color="inherit" sx={{fontWeight: 'bold', textDecoration: 'underline'}}>Home</Button>
                <Box>
                    <Button color="inherit" onClick={(e) => setExamsAnchor(e.currentTarget)}>Exams</Button>
                    <Menu anchorEl={examsAnchor} open={Boolean(examsAnchor)} onClose={()=> setExamsAnchor(null)}>
                        <MenuItem>Upload Papers</MenuItem>
                        <MenuItem>Generate Exam</MenuItem>
                    </Menu>
                </Box>
                <Box>
                    <Button color="inherit" onClick={(e) => setAnalyticsAnchor(e.currentTarget)}>Analytics</Button>
                    <Menu anchorEl={analyticsAnchor} open={Boolean(analyticsAnchor)} onClose={() => setAnalyticsAnchor(null)}>
                        <MenuItem>Question Insights</MenuItem>
                        <MenuItem>Performance Stats</MenuItem>
                    </Menu>
                </Box>
                <Button color="inherit">Chatbot Tutor</Button>
                <Button color="inherit">Profile</Button>
            </Toolbar>
        </AppBar>
    );
}