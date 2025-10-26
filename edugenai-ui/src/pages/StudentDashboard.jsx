import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Tabs,
    Tab,
    Paper,
    Divider,
    Button,
    Stack,
    CircularProgress
} from '@mui/material';
import {
    Menu as MenuIcon,
    InsertDriveFile as PaperIcon,
    QueryStats as AnalyticsIcon,
    School as StudyIcon,
    EmojiEvents as StreakIcon,
    Help as TutorIcon,
    Psychology as BrainIcon,
    Upload as UploadIcon,
    Create as GenerateIcon,
    Visibility as ViewIcon,
    InsertDriveFileOutlined,
    Logout as LogoutIcon,
    Notifications as NotificationsIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Assignment as AssignmentIcon,
    Assignment as MockTestIcon
} from '@mui/icons-material';

const StudentDashboard = () => {
    const { user, userProfile, loading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('recentPapers');
    const [notificationCount, setNotificationCount] = useState(0);
    const [studentData, setStudentData] = useState(null);

    //Logout handler
    const handleLogout = async () => {
        try {
            await logout();
            localStorage.clear();
            sessionStorage.clear();

            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Check authentication and role
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
                return;
            }
            if (userProfile?.role !== 'student') {
                navigate('/select-role');
                return;
            }
        }
    }, [user, userProfile, authLoading, navigate]);

    useEffect(() => {
        if (user) {
            fetchNotificationCount();
            fetchStudentData();
        }
    }, [user]);

    const fetchNotificationCount = async () => {
        try {
            //Use actual student eamil.
            const studentEmail = user?.email;
            if (!studentEmail) return;

            const response = await fetch(`http://localhost:8088/api/v1/student/notifications/${studentEmail}`);
            if (response.ok) {
                const data = await response.json();
                setNotificationCount(data.unread_count);
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const fetchStudentData = async () => {
        try {
            const studentEmail = user?.email;
            if (!studentEmail) return;

            // Fetch notifications
            const notificationsResponse = await fetch(`http://localhost:8088/api/v1/student/notifications/${studentEmail}`);
            const notificationsData = notificationsResponse.ok ? await notificationsResponse.json() : { notifications: [] };


            // 1. Fetch student's enrolled classes
            const classesResponse = await fetch('http://localhost:8088/api/v1/student/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentEmail: studentEmail
                })
            });

            if (classesResponse.ok) {
                const classesData = await classesResponse.json();
                const studentClasses = classesData.classes || [];

                // 2. Fetch assignments for all classes
                let allAssignments = [];
                let totalSubmissions = 0;

                for (const classItem of studentClasses) {
                    const assignmentsResponse = await fetch(`http://localhost:8088/api/v1/student/assignments/${classItem.id}?student_email=${studentEmail}`);
                    if (assignmentsResponse.ok) {
                        const assignmentsData = await assignmentsResponse.json();
                        const classAssignments = assignmentsData.assignments || [];

                        // Count submissions
                        classAssignments.forEach(assignment => {
                            if (assignment.submission) {
                                totalSubmissions++;
                            }
                        });

                        allAssignments = [...allAssignments, ...classAssignments];
                    }
                }

                // 3. Fetch student's own submissions
                const submissionsResponse = await fetch(`http://localhost:8088/api/v1/student/submissions/${studentEmail}`);
                const submissionsData = submissionsResponse.ok ? await submissionsResponse.json() : { submissions: [] };

                // Calculate real data
                const studentName = user.displayName || user.email?.split('@')[0] || "Student";

                setStudentData({
                    name: studentName,
                    taskQuestions: allAssignments.reduce((total, assignment) => {
                        return total + (assignment.questions?.length || 0);
                    }, 0),
                    papersAnalyzed: submissionsData.submissions.length,
                    mockTests: totalSubmissions,
                    studyStreak: 7,
                    recentPapers: submissionsData.submissions.slice(0, 3).map(sub => ({
                        title: sub.assignmentTitle || `Submission ${sub.id}`,
                        questions: 0,
                        date: sub.submittedAt ? new Date(sub.submittedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    })),
                    notifications: notificationsData.notifications,
                    studyActivities: generateRecentActivities(submissionsData.submissions),
                    tutorMessage: getPersonalizedTutorMessage(submissionsData.submissions)
                });
            }
        } catch (err) {
            console.error('Error fetching student data:', err);
            setDefaultStudentData();
        }
    };

// Helper function for fallback data
    const setDefaultStudentData = () => {
        const studentName = user.displayName || user.email?.split('@')[0] || "Student";
        setStudentData({
            name: studentName,
            taskQuestions: 0,
            papersAnalyzed: 0,
            mockTests: 0,
            studyStreak: 0,
            recentPapers: [],
            notifications: [],
            mockTestResults: [],
            studyActivities: [
                { title: "Complete your first paper upload", time: "Get started" },
                { title: "Take your first mock test", time: "Ready when you are" }
            ],
            tutorMessage: `Welcome ${studentName}! Upload your first paper to begin your learning journey.`
        });
    };

// Helper function to generate recent activities
    const generateRecentActivities = (submissions) => {
        const activities = [];
        const now = new Date();

        // Add submission activities
        const recentSubmissions = submissions.slice(0, 3);
        recentSubmissions.forEach(sub => {
            const subDate = sub.submittedAt ? new Date(sub.submittedAt) : now;
            const daysAgo = Math.floor((now - subDate) / (1000 * 60 * 60 * 24));
            activities.push({
                title: `Submitted ${sub.assignmentTitle || 'an assignment'}`,
                time: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`
            });
        });

        // Fill with default activities if needed
        if (activities.length === 0) {
            activities.push(
                { title: "Complete your first assignment", time: "Get started" },
                { title: "Check for new assignments", time: "Ready when you are" }
            );
        }

        return activities.slice(0, 3);
    };

// Helper function for personalized tutor messages
    const getPersonalizedTutorMessage = (firestoreData, progress) => {
        const studentName = user.displayName || user.email?.split('@')[0] || "Student";

        if (!firestoreData.mockTests || firestoreData.mockTests.length === 0) {
            return `Welcome ${studentName}! I'm your AI tutor. Upload your first paper or take a mock test to get started with personalized learning.`;
        }

        // Analyze performance if we have mock tests
        const latestTest = firestoreData.mockTests[0];
        const averageScore = firestoreData.mockTests.reduce((sum, test) => sum + (test.score || 0), 0) / firestoreData.mockTests.length;

        if (averageScore < 60) {
            return `Hi ${studentName}, I see you're working hard! Let's focus on strengthening your fundamentals. Would you like practice questions on your weaker topics?`;
        } else if (averageScore < 80) {
            return `Great work ${studentName}! You're making good progress. I can create advanced practice sets to help you reach the next level.`;
        } else {
            return `Excellent performance ${studentName}! You're mastering the material. Ready for some challenging questions to push your limits?`;
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Show loading while checking authentication or fetching data
    if (authLoading || !studentData) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Redirect if not student (handled by useEffect, but return null during redirect)
    if (!user || userProfile?.role !== 'student') {
        return null;
    }

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Sidebar */}
            <Box
                sx={{
                    width: sidebarOpen ? 240 : 0,
                    flexShrink: 0,
                    bgcolor: 'white',
                    height: '100vh',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease',
                    borderRight: '1px solid #e0e0e0',
                    boxShadow: 1
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <BrainIcon sx={{ fontSize: 30, color: 'primary.main', mr: 1 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>EduGen-AI</Typography>
                        <Typography variant="subtitle2">Student Portal</Typography>
                    </Box>
                </Box>
                <Divider />
                <List>
                    {[
                        { text: 'Dashboard', icon: <MenuIcon />, path: '/student' },
                        { text: 'Question Bank', icon: <PaperIcon />, path: '/student/question-bank' },
                        { text: 'Upload Papers', icon: <UploadIcon />, path: '/student/upload-papers' },
                        { text: 'Generate Test', icon: <GenerateIcon />, path: '/student/generate-test' },
                        { text: 'Analytics', icon: <AnalyticsIcon />, path: '/student/analytics' },
                        { text: 'AI Tutor', icon: <TutorIcon />,path:'/ai/chat' }
                    ].map((item, index) => (
                        <ListItem
                            button
                            key={item.text}
                            sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
                            onClick={() => item.path && navigate(item.path)}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                    {/*Logout button*/}
                    <ListItem
                        button
                        sx={{borderRadius: 1, mx: 1, my: 0.5}}
                        onClick={handleLogout}
                    >
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItem>
                </List>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                        <StudyIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Welcome back, {studentData.name}!
                    </Typography>
                </Box>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 4 }}>
                    Ready to continue your exam preparation?
                </Typography>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[
                        { icon: <MockTestIcon sx={{ fontSize: 40 }} />, title: "Task Questions", value: studentData.taskQuestions },
                        { icon: <PaperIcon sx={{ fontSize: 40 }} />, title: "Papers Analyzed", value: studentData.papersAnalyzed },
                        { icon: <AnalyticsIcon sx={{ fontSize: 40 }} />, title: "Mock Tests", value: studentData.mockTests },
                        { icon: <StreakIcon sx={{ fontSize: 40 }} />, title: "Study Streak", value: `${studentData.studyStreak} days` }
                    ].map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{
                                        bgcolor: 'primary.light',
                                        p: 1.5,
                                        borderRadius: 2,
                                        mr: 2,
                                        color: 'primary.main'
                                    }}>
                                        {stat.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" color="text.secondary">{stat.title}</Typography>
                                        <Typography variant="h4">{stat.value}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Grid container spacing={3}>
                    {/* Left Column */}
                    <Grid item xs={12} md={8}>
                        {/* Activity Tabs */}
                        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                indicatorColor="primary"
                                textColor="primary"
                                variant="fullWidth"
                            >
                                <Tab
                                    value="recentPapers"
                                    label="Recent Papers"
                                    icon={<PaperIcon />}
                                    iconPosition="start"
                                    sx={{ py: 2 }}
                                />
                                <Tab
                                    value="notifications"
                                    label="Notifications"
                                    icon={<NotificationsIcon />}
                                    iconPosition="start"
                                    sx={{ py: 2 }}
                                />
                                <Tab
                                    value="studyActivity"
                                    label="Study Activity"
                                    icon={<StudyIcon />}
                                    iconPosition="start"
                                    sx={{ py: 2 }}
                                />
                            </Tabs>
                        </Paper>

                        {/* Tab Content */}
                        <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                {activeTab === 'recentPapers' && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            Recently Uploaded Papers
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Papers you've uploaded for analysis
                                        </Typography>
                                        <List>
                                            {studentData.recentPapers.map((paper, index) => (
                                                <ListItem
                                                    key={index}
                                                    sx={{
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: 2,
                                                        mb: 1,
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <InsertDriveFileOutlined sx={{ color: 'primary.main' }} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={paper.title}
                                                        secondary={`${paper.questions} questions • ${paper.date}`}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </>
                                )}

                                {activeTab === 'notifications' && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            Notifications
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Your recent alerts and updates
                                        </Typography>
                                        {notificationCount === 0 ? (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                                No new notifications
                                            </Typography>
                                        ) : (
                                            <List>
                                                {studentData.notifications?.map((notification, index) => (
                                                    <ListItem
                                                        key={index}
                                                        sx={{
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: 2,
                                                            mb: 1,
                                                            '&:hover': { bgcolor: 'action.hover' },
                                                            borderLeft: `4px solid ${
                                                                notification.type === 'new_assignment' ? '#1976d2' :
                                                                    notification.type === 'graded' ? '#2e7d32' :
                                                                        notification.type === 'reminder' ? '#d32f2f' : '#ed6c02'
                                                            }`
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            {notification.type === 'new_assignment' && <AssignmentIcon sx={{ color: '#1976d2' }} />}
                                                            {notification.type === 'graded' && <CheckCircleIcon sx={{ color: '#2e7d32' }} />}
                                                            {notification.type === 'reminder' && <WarningIcon sx={{ color: '#d32f2f' }} />}
                                                            {!['new_assignment', 'graded', 'reminder'].includes(notification.type) && <InfoIcon sx={{ color: '#ed6c02' }} />}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography variant="subtitle1" fontWeight="medium">
                                                                    {notification.type === 'new_assignment' ? 'New Assignment' :
                                                                        notification.type === 'graded' ? 'Assignment Graded' :
                                                                            notification.type === 'reminder' ? 'Reminder' : 'Notification'}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Box>
                                                                    <Typography variant="body2">
                                                                        {notification.assignmentTitle || notification.message}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                                                                    </Typography>
                                                                    {notification.message && notification.type !== 'reminder' && (
                                                                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                                            {notification.message}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        )}
                                    </>
                                )}

                                {activeTab === 'studyActivity' && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            Study Activity
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Your recent study sessions and progress
                                        </Typography>
                                        <List>
                                            {studentData.studyActivities.map((activity, index) => (
                                                <ListItem
                                                    key={index}
                                                    sx={{
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: 2,
                                                        mb: 1,
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                >
                                                    <ListItemIcon>
                                                        <StudyIcon sx={{ color: 'primary.main' }} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={activity.title}
                                                        secondary={activity.time}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={4}>
                        {/* Quick Actions */}
                        <Card sx={{
                            mb: 3,
                            borderRadius: 2,
                            border: '1px solid #e0e0e0',
                            '&:hover': { boxShadow: 1 }
                        }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                                    Quick Actions
                                </Typography>
                                <Stack spacing={2}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<UploadIcon />}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            border: '1px solid #e0e0e0',
                                            justifyContent: 'flex-start',
                                            textTransform: 'none',
                                            '&:hover': {
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                borderColor: 'primary.main'
                                            }
                                        }}
                                        onClick={() => navigate('/upload-papers')}
                                    >
                                        Upload New Paper
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<GenerateIcon />}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            border: '1px solid #e0e0e0',
                                            justifyContent: 'flex-start',
                                            textTransform: 'none',
                                            '&:hover': {
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                borderColor: 'primary.main'
                                            }
                                        }}
                                        onClick={() => navigate('/generate-test')}
                                    >
                                        Generate Mock Test
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<ViewIcon />}
                                        onClick={() => navigate('/student/assignments')}
                                        sx={{
                                            py: 1.5,
                                            borderRadius: 2,
                                            border: '1px solid #e0e0e0',
                                            justifyContent: 'flex-start',
                                            textTransform: 'none',
                                            position: 'relative',
                                            '&:hover': {
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                borderColor: 'primary.main'
                                            }
                                        }}
                                    >
                                        View Assignment
                                        {notificationCount > 0 && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    bgcolor: 'error.main',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: 20,
                                                    height: 20,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {notificationCount}
                                            </Box>
                                        )}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default StudentDashboard;