import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
    Dashboard as DashboardIcon,
    LibraryBooks as LibraryBooksIcon,
    CloudUpload as UploadIcon,
    Quiz as QuizIcon,
    Equalizer as AnalyticsIcon,
    Chat as ChatIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';

const Sidebar = () => {
    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon /> },
        { text: 'Question Bank', icon: <LibraryBooksIcon /> },
        { text: 'Upload Papers', icon: <UploadIcon /> },
        { text: 'Generate Test', icon: <QuizIcon /> },
        { text: 'Analytics', icon: <AnalyticsIcon /> },
        { text: 'AI Tutor', icon: <ChatIcon /> },
        { text: 'Settings', icon: <SettingsIcon /> },
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 240,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 240,
                    boxSizing: 'border-box',
                },
            }}
        >
            <List>
                {menuItems.map((item, index) => (
                    <ListItem button key={index}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;