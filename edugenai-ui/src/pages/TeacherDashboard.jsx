import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
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
    Groups as StudentsIcon,
    Description as PapersIcon,
    Quiz as QuestionsIcon,
    School as ClassIcon,
    QueryStats as AnalyticsIcon,
    Upload as UploadIcon,
    Create as CreateIcon,
    ManageAccounts as ManageClassesIcon,
    Psychology as BrainIcon,
    Chat as AssistantIcon,
    Assignment as TaskIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from './AuthContext';

const TeacherDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('recentPapers');
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user, userProfile, loading: authLoading, logout } = useAuth()

    //Fetch real dashboard data
    useEffect(() => {
        if (user && userProfile?.role === 'teacher') {
            fetchDashboardData();
        }
    }, [user, userProfile]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const teacherId = user?.uid || user?.email;

            //Make parallel API calls
            const [questionsRes, monthlyStatsRes, engagementRes] = await Promise.all([
                fetch('http://localhost:8088/api/v1/questions/count'),
                fetch(`http://localhost:8088/api/v1/teacher/monthly-stats?teacher_id=${teacherId}`),
                fetch(`http://localhost:8088/api/v1/teacher/recent-engagement?teacher_id=${teacherId}&days=7`)
            ]);

            if (!questionsRes.ok || !monthlyStatsRes.ok || !engagementRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
            const questionsData = await questionsRes.json();
            const monthlyStatsData = await monthlyStatsRes.json();
            const engagementData = await engagementRes.json();

            setDashboardData({
                totalQuestions: questionsData.total_questions,
                activeClasses: monthlyStatsData.active_classes,
                monthlyAssignments: monthlyStatsData.monthly_assignments,
                studentEngagement: engagementData.engagement_percentage,
                totalStudents: engagementData.total_students,
                activeStudents: engagementData.active_students
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Fallback to mock data if API fails
            setDashboardData({
                totalQuestions: 0,
                activeClasses: 0,
                monthlyAssignments: 0,
                studentEngagement: 0,
                totalStudents: 0,
                activeStudents: 0
            });
        } finally {
            setLoading(false);
        }
    };

    //Logout handler
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Authentication check
    React.useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
                return;
            }
            if (userProfile?.role !== 'teacher') {
                navigate('/select-role');
                return;
            }
        }
    }, [user, userProfile, authLoading, navigate]);

    const teacherData = {
        name: user?.displayName || user?.email?.split('@')[0] || "Teacher",
        recentPapers: [
            { title: "Mathematics Final Exam 2024", questions: 45, status: "Published", students: 32, date: "2024-01-15" },
            { title: "Physics Midterm Draft", questions: 32, status: "Draft", students: 0, date: "2024-01-14" },
            { title: "Calculus Quiz", questions: 20, status: "Published", students: 24, date: "2024-01-12" }
        ],
        studentPerformance: [
            { name: "Alice Johnson", subject: "Mathematics", score: "67%", tests: 8, trend: "up" },
            { name: "Bob Smith", subject: "Physics", score: "85%", tests: 6, trend: "up" },
            { name: "Carol Davis", subject: "Mathematics", score: "67%", tests: 8, trend: "down" },
            { name: "David Wilson", subject: "Physics", score: "85%", tests: 6, trend: "stable" }
        ],
        activityLog: [
            { action: "Created Mathematics Final Exam", details: "45 questions", time: "21 hours ago" },
            { action: "Graded Physics Midterm Papers", details: "28 papers graded", time: "Yesterday" },
            { action: "Uploaded question bank for Statistics", details: "50 new questions", time: "2 days ago" },
            { action: "Used AI to generate calculus questions", details: "Derivatives topic", time: "3 days ago" }
        ],

        assistantMessage: "I can help you create questions focusing your recent syllabus."
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Stats cards data - using real data from API
    const statsCards = [
        {
            icon: <QuestionsIcon sx={{ fontSize: 30 }} />,
            title: "Total Questions",
            value: dashboardData?.totalQuestions || 0,
            description: "In database"
        },
        {
            icon: <ClassIcon sx={{ fontSize: 30 }} />,
            title: "Active Classes",
            value: dashboardData?.activeClasses || 0,
            description: "This month"
        },
        {
            icon: <PapersIcon sx={{ fontSize: 30 }} />,
            title: "Assignments",
            value: dashboardData?.monthlyAssignments || 0,
            description: "Created this month"
        },
        {
            icon: <AnalyticsIcon sx={{ fontSize: 30 }} />,
            title: "Student Engagement",
            value: `${dashboardData?.studentEngagement || 0}%`,
            description: "Active in 7 days"
        }
    ];

    // Show loading while checking authentication
    if (authLoading || loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
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
                    boxShadow: 1,
                    borderRadius: 3
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                    <BrainIcon sx={{ fontSize: 30, color: 'primary.main', mr: 1 }} />
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>EduGen-AI</Typography>
                        <Typography variant="subtitle2">Teacher Portal</Typography>
                    </Box>
                </Box>
                <Divider />
                <List>
                    {[
                        { text: 'Question Bank', icon: <QuestionsIcon />, path: '/teacher/question-bank' },
                        { text: 'Create Paper', icon: <CreateIcon />, path: '/teacher/create-exam' },
                        { text: 'Upload Papers', icon: <UploadIcon />, path: '/teacher/upload-papers' },
                        { text: 'Analytics', icon: <AnalyticsIcon /> },
                        { text: 'AI Assistant', icon: <AssistantIcon />,path:'/ai/chat'},
                        { /*text: 'Student Progress', icon: <ManageClassesIcon /> */},
                        {/* text: 'Profile', icon: <ManageAccountsIcon /> },
                        { text: 'Settings', icon: <ManageAccountsIcon /> */}
                    ].map((item, index) => (
                        <ListItem
                            button
                            key={index}
                            sx={{ borderRadius: 3, mx: 1, my: 0.5 }}
                            onClick={() => item.path && navigate(item.path)}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                    {/*Logout Button */}
                    <ListItem
                        button
                        sx={{ borderRadius: 3, mx: 1, my: 0.5 }}
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
                        Welcome back, {teacherData.name}!
                    </Typography>
                </Box>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 4 }}>
                    Here's what's happening in your classes today!
                </Typography>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {statsCards.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="h6" color="text.secondary">{stat.title}</Typography>
                                        <Typography variant="h4">{stat.value}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {stat.description}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        bgcolor: 'primary.light',
                                        p: 1.5,
                                        borderRadius: 3,
                                        color: 'primary.main'
                                    }}>
                                        {stat.icon}
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
                        <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
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
                                    icon={<PapersIcon />}
                                    iconPosition="start"
                                    sx={{ py: 2 }}
                                />
                                <Tab
                                    value="studentPerformance"
                                    label="Student Performance"
                                    icon={<StudentsIcon />}
                                    iconPosition="start"
                                    sx={{ py: 2 }}
                                />
                                <Tab
                                    value="activityLog"
                                    label="Activity Log"
                                    icon={<TaskIcon />}
                                    iconPosition="start"
                                    sx={{ py: 2 }}
                                />
                            </Tabs>
                        </Paper>

                        {/* Tab Content */}
                        <Card sx={{ borderRadius: 3, border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                {activeTab === 'recentPapers' && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Papers you've created and their status
                                        </Typography>
                                        <List>
                                            {teacherData.recentPapers.map((paper, index) => (
                                                <ListItem
                                                    key={index}
                                                    sx={{
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: 3,
                                                        mb: 1,
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={paper.title}
                                                        secondary={
                                                            <>
                                                                <Box component="span" sx={{ display: 'block' }}>
                                                                    {paper.questions} questions • {paper.status} • {paper.students} students
                                                                </Box>
                                                                <Box component="span" sx={{ display: 'block' }}>
                                                                    Created: {paper.date}
                                                                </Box>
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </>
                                )}

                                {activeTab === 'studentPerformance' && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Recent performance trends across your classes
                                        </Typography>
                                        <List>
                                            {teacherData.studentPerformance.map((student, index) => (
                                                <ListItem
                                                    key={index}
                                                    sx={{
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: 3,
                                                        mb: 1,
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={`${student.name} - ${student.subject}`}
                                                        secondary={
                                                            <>
                                                                <Box component="span" sx={{ display: 'block' }}>
                                                                    Score: {student.score} • Tests: {student.tests} • Trend: {student.trend}
                                                                </Box>
                                                            </>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </>
                                )}

                                {activeTab === 'activityLog' && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Your recent actions and system events
                                        </Typography>
                                        <List>
                                            {teacherData.activityLog.map((activity, index) => (
                                                <ListItem
                                                    key={index}
                                                    sx={{
                                                        border: '1px solid #e0e0e0',
                                                        borderRadius: 3,
                                                        mb: 1,
                                                        '&:hover': { bgcolor: 'action.hover' }
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={activity.action}
                                                        secondary={
                                                            <>
                                                                <Box component="span" sx={{ display: 'block' }}>
                                                                    {activity.details} • {activity.time}
                                                                </Box>
                                                            </>
                                                        }
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
                            borderRadius: 3,
                            border: '1px solid #e0e0e0',
                            '&:hover': { boxShadow: 1 }
                        }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                                    Quick Actions
                                </Typography>
                                <Stack spacing={2}>
                                    {[
                                        {
                                            icon: <UploadIcon />,
                                            text: "Upload Questions",
                                            action: () => navigate('/teacher/upload-questions')
                                        },
                                        {
                                            icon: <ManageClassesIcon />,
                                            text: "Manage Classes",
                                            action: () => navigate('/teacher/manage-classes')
                                        }
                                    ].map((action, index) => (
                                        <Button
                                            key={index}
                                            variant="outlined"
                                            fullWidth
                                            startIcon={action.icon}
                                            onClick={action.action}
                                            sx={{
                                                py: 1.5,
                                                borderRadius: 3,
                                                border: '1px solid #e0e0e0',
                                                justifyContent: 'flex-start',
                                                textTransform: 'none',
                                                '&:hover': {
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    borderColor: 'primary.main'
                                                }
                                            }}
                                        >
                                            {action.text}
                                        </Button>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* AI Assistant */}
                        <Card sx={{
                            borderRadius: 3,
                            border: '1px solid #e0e0e0',
                            '&:hover': { boxShadow: 1 }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <BrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">AI Assistant</Typography>
                                </Box>
                                <Typography variant="body1" sx={{ mb: 3 }}>
                                    {teacherData.assistantMessage}
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<AssistantIcon />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 3,
                                        textTransform: 'none'
                                    }}
                                >
                                    Get AI Suggestions
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default TeacherDashboard;