import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Event as EventIcon,
    Assignment as AssignmentIcon,
    Announcement as AnnouncementIcon,
    Warning as WarningIcon,
    Schedule as ScheduleIcon,
    Refresh as RefreshIcon,
    School as SchoolIcon
} from '@mui/icons-material';

const UpcomingEventsBox = ({ userEmail, userRole, userId }) => {
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchUpcomingEvents = async () => {
        if (!userEmail) return;

        setLoading(true);
        try {
            let url;
            if (userRole === 'student') {
                url = `http://localhost:8088/api/v1/student/events/${userEmail}`;
            } else {
                url = `http://localhost:8088/api/v1/teacher/events?teacher_id=${userId}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                // Ensure events is always an array
                setUpcomingEvents(Array.isArray(data.events) ? data.events : []);
            } else {
                console.error('Failed to fetch events:', response.status);
                setUpcomingEvents([]);
            }
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
            setUpcomingEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUpcomingEvents();

        // Refresh every 5 minutes
        const interval = setInterval(fetchUpcomingEvents, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [userEmail, userRole, userId]);

    const getEventIcon = (type) => {
        switch (type) {
            case 'assignment':
                return <AssignmentIcon />;
            case 'school':
                return <SchoolIcon />;
            case 'announcement':
                return <AnnouncementIcon />;
            case 'class':
            default:
                return <EventIcon />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'info';
            default:
                return 'default';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'assignment':
                return 'primary';
            case 'school':
                return 'secondary';
            case 'announcement':
                return 'success';
            case 'class':
            default:
                return 'default';
        }
    };

    const formatDueDate = (dueDateString) => {
        const dueDate = new Date(dueDateString);
        const now = new Date();
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

        if (diffHours <= 24) {
            return `Due in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        } else if (diffDays <= 7) {
            return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        } else {
            return dueDate.toLocaleDateString();
        }
    };

    const getTypeDisplayName = (type) => {
        switch (type) {
            case 'school': return 'School Event';
            case 'class': return 'Class Event';
            case 'assignment': return 'Assignment';
            case 'announcement': return 'Announcement';
            default: return 'Event';
        }
    };

    if (loading && upcomingEvents.length === 0) {
        return (
            <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0', mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Upcoming Events
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Loading...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0', mb: 3 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                        Upcoming Events
                    </Typography>
                    <Tooltip title="Refresh">
                        <IconButton
                            size="small"
                            onClick={fetchUpcomingEvents}
                            disabled={loading}
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {upcomingEvents.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            No upcoming events
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {userRole === 'teacher'
                                ? 'Create events to see them here'
                                : 'Events from your teachers will appear here'
                            }
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ py: 0 }}>
                        {upcomingEvents.map((event, index) => (
                            <ListItem
                                key={event.id}
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    mb: 1,
                                    '&:hover': { bgcolor: 'action.hover' },
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    py: 1.5
                                }}
                            >
                                {/* Header with title and priority */}
                                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box display="flex" alignItems="center">
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {getEventIcon(event.type)}
                                        </ListItemIcon>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            {event.title}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={event.display_priority || event.priority}
                                        color={getPriorityColor(event.display_priority || event.priority)}
                                        size="small"
                                    />
                                </Box>

                                {/* Description */}
                                {event.description && (
                                    <Typography variant="body2" sx={{ mb: 1, ml: 5 }}>
                                        {event.description}
                                    </Typography>
                                )}

                                {/* Footer with type and due date */}
                                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Chip
                                            label={getTypeDisplayName(event.type)}
                                            variant="outlined"
                                            size="small"
                                            color={getTypeColor(event.type)}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
                                        <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                        {formatDueDate(event.due_date)}
                                    </Typography>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}

                {upcomingEvents.length > 5 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                        Showing top {upcomingEvents.length} events
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default UpcomingEventsBox;