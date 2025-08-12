import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
    Dashboard as DashboardIcon,
    LibraryBooks as LibraryBooksIcon,
    CloudUpload as UploadIcon,
    Equalizer as AnalyticsIcon,
    Create as CreateIcon,
    Chat as ChatIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
    const navigate = useNavigate();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/student' },
        { text: 'Question Bank', icon: <LibraryBooksIcon /> },
        { text: 'Upload Papers', icon: <UploadIcon />, path: '/upload-papers' },
        { text: 'Generate Test', icon: <CreateIcon />, path: '/generate-test' }, // Changed to match quick action
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
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => item.path && navigate(item.path)}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};

export default Sidebar;