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

                // Use submissions as papers data
                const papersData = { papers: [] };

                // Calculate real data
                const studentName = user.displayName || user.email?.split('@')[0] || "Student";

                setStudentData({
                    name: studentName,
                    taskQuestions: allAssignments.reduce((total, assignment) => {
                        return total + (assignment.questions?.length || 0);
                    }, 0),
                    papersAnalyzed: submissionsData.submissions.length, // Use submissions count instead
                    mockTests: totalSubmissions,
                    studyStreak: 7,
                    recentPapers: getRecentPapers([], submissionsData.submissions), // Pass empty papers array
                    notifications: notificationsData.notifications,
                    studyActivities: getRecentStudyActivities(submissionsData.submissions, []), // Pass empty papers array
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
            studyActivities: [
                {
                    title: "Upload your first paper for AI analysis",
                    time: "Get started",
                    type: "suggestion",
                    icon: <UploadIcon />
                },
                {
                    title: "Take your first mock test",
                    time: "Ready when you are",
                    type: "suggestion",
                    icon: <MockTestIcon />
                }
            ],
            tutorMessage: `Welcome ${studentName}! Upload your first paper to begin your learning journey.`
        });
    };

    // Helper function for personalized tutor messages
    const getPersonalizedTutorMessage = (submissionsData) => {
        const studentName = user.displayName || user.email?.split('@')[0] || "Student";

        if (!submissionsData || submissionsData.length === 0) {
            return `Welcome ${studentName}! I'm your AI tutor. Upload your first paper or take a mock test to get started with personalized learning.`;
        }

        // Analyze performance if we have submissions
        const averageScore = submissionsData.reduce((sum, test) => sum + (test.score || 0), 0) / submissionsData.length;

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

    //Helper function to get recent papers
    const getRecentPapers = (papers, submissions) => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const recentPapers = [];

        //Add uploaded papers
        papers.forEach(paper => {
            const paperDate = new Date(paper.uploadedAt || paper.createdAt);
            if (paperDate >= threeDaysAgo) {
                recentPapers.push({
                    title: paper.filename || `Paper ${paper.id}`,
                    type: 'uploaded',
                    date: paperDate.toISOString().split('T')[0],
                    subject: paper.subject || 'General',
                    status: paper.status || 'analyzed'
                });
            }
        });

        //Add submitted assignments as papers
        submissions.forEach(submission => {
            const subDate = new Date(submission.submittedAt);
            if (subDate >= threeDaysAgo) {
                recentPapers.push({
                    title: submission.assignmentTitle || `Submission ${submission.id}`,
                    type: 'submitted',
                    date: subDate.toISOString().split('T')[0],
                    subject: submission.subject || 'Assignment',
                    status: 'submitted'
                });
            }
        });

        //Sort by date descending and return top 5
        return recentPapers.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    };

    //Helper function to get recent study activities
    const getRecentStudyActivities = (submissions, papers) => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const activities = [];

        //Add paper upload activities
        papers.forEach(paper => {
            const paperDate = new Date(paper.uploadedAt || paper.createdAt);
            if (paperDate >= threeDaysAgo) {
                const daysAgo = Math.floor((new Date() - paperDate) / (1000 * 60 * 60 * 24));
                activities.push({
                    title: `Uploaded ${paper.filename || 'a paper'} for analysis`,
                    time: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
                    type: 'upload',
                    icon: <UploadIcon />
                });
            }
        });

        //Add assignment submission activities - FIXED: changed 'submissions' to 'submission'
        submissions.forEach(submission => {
            const subDate = new Date(submission.submittedAt);
            if (subDate >= threeDaysAgo) {
                const daysAgo = Math.floor((new Date() - subDate) / (1000 * 60 * 60 * 24));
                activities.push({
                    title: `Submitted ${submission.assignmentTitle || 'an assignment'}`,
                    time: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
                    type: 'submission',
                    icon: <AssignmentIcon />
                });
            }
        });

        //Add mock test activities (if any)
        submissions.forEach(submission => {
            const subDate = new Date(submission.submittedAt);
            if (subDate >= threeDaysAgo && submission.type === 'mock_test') {
                const daysAgo = Math.floor((new Date() - subDate) / (1000 * 60 * 60 * 24));
                activities.push({
                    title: `Completed a mock test`,
                    time: daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`,
                    type: 'mock_test',
                    icon: <MockTestIcon />
                });
            }
        });

        //Sort by date descending and return top 5
        return activities.sort((a, b) => {
            const aDays = a.time === 'Today' ? 0 : a.time === 'Yesterday' ? 1 : parseInt(a.time);
            const bDays = b.time === 'Today' ? 0 : b.time === 'Yesterday' ? 1 : parseInt(b.time);
            return aDays - bDays;
        })
            .slice(0, 5);
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
                                            Recent Document Interactions
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Your paper uploads and submissions from the last 3 days
                                        </Typography>
                                        {studentData.recentPapers.length === 0 ? (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <PaperIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                                    No recent document activity
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    Your paper uploads and submissions from the last 3 days will appear here.
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    startIcon={<UploadIcon />}
                                                    onClick={() => navigate('/student/upload-papers')}
                                                >
                                                    Upload Your First Paper
                                                </Button>
                                            </Box>
                                        ) : (
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
                                                            {paper.type === 'uploaded' ? (
                                                                <UploadIcon sx={{ color: 'primary.main' }} />
                                                            ) : (
                                                                <AssignmentIcon sx={{ color: 'secondary.main' }} />
                                                            )}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Box>
                                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                                        {paper.title}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {paper.type === 'uploaded' ? 'Paper Upload' : 'Assignment'} • {paper.subject}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                            secondary={`${paper.date} • ${paper.status}`}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        )}
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
                                            Recent Study Activities
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Your learning activities from the last 3 days
                                        </Typography>
                                        {studentData.studyActivities.length === 0 ? (
                                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                                <StudyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                                <Typography variant="body1" color="text.secondary" gutterBottom>
                                                    No recent study activities
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    Start learning by uploading papers, taking tests, or completing assignments.
                                                </Typography>
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<UploadIcon />}
                                                        onClick={() => navigate('/student/upload-papers')}
                                                    >
                                                        Upload Paper
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<GenerateIcon />}
                                                        onClick={() => navigate('/student/generate-test')}
                                                    >
                                                        Take Test
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        ) : (
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
                                                            {activity.icon || <StudyIcon sx={{ color: 'primary.main' }} />}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={activity.title}
                                                            secondary={activity.time}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        )}
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