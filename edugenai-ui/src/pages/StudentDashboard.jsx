import React, { useState } from 'react';
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
    Stack
} from '@mui/material';
import {
    Menu as MenuIcon,
    InsertDriveFile as PaperIcon,
    Assignment as MockTestIcon,
    QueryStats as AnalyticsIcon,
    School as StudyIcon,
    EmojiEvents as StreakIcon,
    Help as TutorIcon,
    Psychology as BrainIcon,
    Upload as UploadIcon,
    Create as GenerateIcon,
    Visibility as ViewIcon,
    InsertDriveFileOutlined
} from '@mui/icons-material';

const StudentDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('recentPapers');
    const navigate = useNavigate();

    const studentData = {
        name: "Sarah",
        taskQuestions: 804,
        papersAnalyzed: 23,
        mockTests: 12,
        studyStreak: 7,
        recentPapers: [
            { title: "Mathematics Final Exam 2023", questions: 45, date: "2024-01-15" },
            { title: "Physics Midterm 2023", questions: 32, date: "2024-01-12" },
            { title: "Chemistry Quiz 2023", questions: 20, date: "2024-01-10" }
        ],
        mockTestResults: [
            { title: "Mathematics Practice Test #1", score: "85/100 (95%)", date: "2024-01-14" },
            { title: "Physics Revision Test", score: "78/100 (75%)", date: "2024-01-13" },
            { title: "Mixed Topics Test", score: "92/100 (95%)", date: "2024-01-11" }
        ],
        studyActivities: [
            { title: "Practiced 25 Mathematics questions", time: "2 hours ago" },
            { title: "Completed Physics Mock Test", time: "Yesterday" },
            { title: "Uploaded Chemistry Final Exam", time: "2 days ago" }
        ],
        tutorMessage: "I noticed you're struggling with calculus derivatives. Would you like me to create a focused practice set?"
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

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
                        { text: 'Question Bank', icon: <PaperIcon />, path: '/question-bank' },
                        { text: 'Upload Papers', icon: <UploadIcon />, path: '/upload-papers' },
                        { text: 'Generate Test', icon: <GenerateIcon />, path: '/generate-test' },
                        { text: 'Analytics', icon: <AnalyticsIcon />,path: '/analytics' },
                        { text: 'AI Tutor', icon: <TutorIcon /> }
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
                                    value="mockTests"
                                    label="Mock Tests"
                                    icon={<MockTestIcon />}
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

                                {activeTab === 'mockTests' && (
                                    <>
                                        <Typography variant="h6" gutterBottom>
                                            Recent Mock Tests
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Your latest practice test results
                                        </Typography>
                                        <List>
                                            {studentData.mockTestResults.map((test, index) => (
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
                                                        <MockTestIcon sx={{ color: 'primary.main' }} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={test.title}
                                                        secondary={`${test.score} • Completed on ${test.date}`}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
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
                                        onClick={() => navigate('')}
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
                                        onClick={() => navigate('/generate-test')} // Add this line
                                    >
                                        Generate Mock Test
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<ViewIcon />}
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
                                    >
                                        View Assignment
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* AI Tutor */}
                        <Card sx={{
                            borderRadius: 2,
                            border: '1px solid #e0e0e0',
                            '&:hover': { boxShadow: 1 }
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <BrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6">AI Tutor</Typography>
                                </Box>
                                <Typography variant="body1" sx={{ mb: 3 }}>
                                    {studentData.tutorMessage}
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<TutorIcon />}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none'
                                    }}
                                >
                                    Continue Conversation
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default StudentDashboard;