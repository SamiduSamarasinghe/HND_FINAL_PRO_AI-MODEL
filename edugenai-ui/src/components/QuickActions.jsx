import { Card, CardContent, List, ListItem, ListItemButton, Box, ListItemText, Typography, Divider, Chip } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';

const QuickActions = ({ actions, tutorMessage, upcomingTasks }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Quick Actions
                </Typography>

                <List>
                    {actions.map((action, index) => (
                        <ListItem key={index} disablePadding>
                            <ListItemButton>
                                <ListItemText primary={action} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                {tutorMessage && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <ChatBubbleOutline sx={{ mr: 1 }} />
                            <Typography variant="subtitle2">AI Tutor</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {tutorMessage}
                        </Typography>
                        <Chip label="Continue Conversation" color="primary" clickable />
                    </>
                )}

                {upcomingTasks && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                            Upcoming Tasks
                        </Typography>
                        <List>
                            {upcomingTasks.map((task, index) => (
                                <ListItem key={index} disablePadding>
                                    <ListItemButton>
                                        <ListItemText primary={task} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default QuickActions;