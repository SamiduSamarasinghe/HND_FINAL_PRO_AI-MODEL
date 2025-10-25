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
    CircularProgress,
    Chip
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
    const { user, userProfile, loading: authLoading, logout } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [studentsNeedingAttention, setStudentsNeedingAttention] = useState([]);
    const [toDoItems, setToDoItems] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);


    //Fetch real dashboard data
    useEffect(() => {
        if (user && userProfile?.role === 'teacher') {
            fetchDashboardData();
            fetchTeacherAssignments();
            fetchStudentsNeedingAttention();
            fetchToDoAndActivity()
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

    //Fetch real assignments
    const fetchTeacherAssignments = async () => {
        try {
            const teacherId = user?.uid;
            const response = await fetch(`http://localhost:8088/api/v1/teacher/classes?teacher_id=${teacherId}`);

            if (response.ok) {
                const data = await response.json();
                const classesList = data.classes || [];

                //Fetch assignments for each class
                const allAssignments = [];
                for (const classItem of classesList) {
                    const assignmentsResponse = await await fetch(`http://localhost:8088/api/v1/teacher/assignments/${classItem.id}?teacher_id=${teacherId}`);
                    if (assignmentsResponse.ok) {
                        const assignmentsData = await assignmentsResponse.json();
                        const assignmentsWithClass = (assignmentsData.assignments || []).map(assignment => ({
                            ...assignment,
                            className: classItem.name,
                            classId: classItem.id
                        }));
                        allAssignments.push(...assignmentsWithClass);
                    }
                }
                //Sort by creation date, newest first, and latest 5
                const sortedAssignmnts = allAssignments
                    .sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 5);
                setAssignments(sortedAssignmnts);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setAssignments([]);
        }
    };

    //Fetch students who needs attention
    const fetchStudentsNeedingAttention = async () => {
        try {
            const teacherId = user?.uid;
            if (!teacherId) return;

            // First get all classes
            const classesResponse = await fetch(`http://localhost:8088/api/v1/teacher/classes?teacher_id=${teacherId}`);
            if (!classesResponse.ok) {
                console.error('Failed to fetch classes');
                return;
            }

            const classesData = await classesResponse.json();
            const classesList = classesData.classes || [];

            const attentionList = [];

            // For each class, get late and missing submissions
            for (const classItem of classesList) {
                try {
                    const lateSubmissionsResponse = await fetch(`http://localhost:8088/api/v1/teacher/late-submissions/${classItem.id}?teacher_id=${teacherId}`);
                    if (!lateSubmissionsResponse.ok) {
                        console.error(`Failed to fetch late submissions for class ${classItem.id}: ${lateSubmissionsResponse.status}`);
                        continue;
                    }

                    const lateSubmissionsData = await lateSubmissionsResponse.json();
                    const lateMissingSubmissions = lateSubmissionsData.late_missing_submissions || [];

                    // Add to attention list
                    attentionList.push(...lateMissingSubmissions);
                } catch (classError) {
                    console.error(`Error fetching late submissions for class ${classItem.name}:`, classError);
                }
            }

            // Limit to top 6 most urgent items (prioritize missing submissions, then by days late)
            const sortedList = attentionList.sort((a, b) => {
                // Missing submissions first
                if (a.type === 'missing_submission' && b.type !== 'missing_submission') return -1;
                if (a.type !== 'missing_submission' && b.type === 'missing_submission') return 1;

                // Then by days late (more days first)
                return b.daysLate - a.daysLate;
            }).slice(0, 6);

            setStudentsNeedingAttention(sortedList);

        } catch (error) {
            console.error('Error fetching students needing attention:', error);
            setStudentsNeedingAttention([]);
        }
    };

    //Fetch to-do items and recent activity
    const fetchToDoAndActivity = async () => {
        try {
            const teacherId = user?.uid;

            // First get all classes
            const classesResponse = await fetch(`http://localhost:8088/api/v1/teacher/classes?teacher_id=${teacherId}`);
            if (!classesResponse.ok) return;

            const classesData = await classesResponse.json();
            const classesList = classesData.classes || [];

            const toDoList = [];
            const activityList = [];

            // For each class, check for pending tasks
            for (const classItem of classesList) {
                // Get assignments for this class
                const assignmentsResponse = await fetch(`http://localhost:8088/api/v1/teacher/assignments/${classItem.id}?teacher_id=${teacherId}`);
                if (!assignmentsResponse.ok) continue;

                const assignmentsData = await assignmentsResponse.json();
                const assignments = assignmentsData.assignments || [];

                for (const assignment of assignments) {
                    // Get submissions for this assignment
                    const submissionsResponse = await fetch(`http://localhost:8088/api/v1/teacher/submissions/${assignment.id}?teacher_id=${teacherId}`);
                    if (!submissionsResponse.ok) continue;

                    const submissionsData = await submissionsResponse.json();
                    const submissions = submissionsData.submissions || [];

                    // Find ungraded submissions (To-Do Items)
                    const ungradedSubmissions = submissions.filter(sub => !sub.grade && sub.status !== 'graded');
                    if (ungradedSubmissions.length > 0) {
                        toDoList.push({
                            type: 'grading',
                            title: `Grade ${assignment.title}`,
                            description: `${ungradedSubmissions.length} submission${ungradedSubmissions.length > 1 ? 's' : ''} waiting for grading`,
                            assignmentId: assignment.id,
                            className: classItem.name,
                            dueDate: assignment.dueDate,
                            priority: new Date(assignment.dueDate) < new Date() ? 'high' : 'medium',
                            count: ungradedSubmissions.length
                        });
                    }

                    // Find recent submissions (last 24 hours) for activity feed
                    const recentSubmissions = submissions.filter(sub => {
                        const submittedDate = new Date(sub.submittedAt);
                        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        return submittedDate > yesterday;
                    });

                    recentSubmissions.forEach(submission => {
                        activityList.push({
                            type: 'submission',
                            action: 'New submission received',
                            details: `${submission.studentName} - ${assignment.title}`,
                            time: submission.submittedAt,
                            assignmentId: assignment.id,
                            submissionId: submission.id
                        });
                    });
                }

                // Add upcoming due dates (next 3 days) to to-do list
                const upcomingAssignments = assignments.filter(assignment => {
                    const dueDate = new Date(assignment.dueDate);
                    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                    return dueDate > new Date() && dueDate <= threeDaysFromNow;
                });

                upcomingAssignments.forEach(assignment => {
                    toDoList.push({
                        type: 'upcoming_due',
                        title: `Due soon: ${assignment.title}`,
                        description: `Due in ${Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days`,
                        assignmentId: assignment.id,
                        className: classItem.name,
                        dueDate: assignment.dueDate,
                        priority: 'medium'
                    });
                });
            }

            // Sort to-do items by priority (high first, then by due date)
            const sortedToDo = toDoList.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return new Date(a.dueDate) - new Date(b.dueDate);
            }).slice(0, 5); // Limit to top 5 items

            // Sort activity by most recent
            const sortedActivity = activityList
                .sort((a, b) => new Date(b.time) - new Date(a.time))
                .slice(0, 3); // Limit to 3 most recent

            setToDoItems(sortedToDo);
            setRecentActivity(sortedActivity);

        } catch (error) {
            console.error('Error fetching to-do and activity:', error);
            setToDoItems([]);
            setRecentActivity([]);
        }
    };

    const handleSendReminder = async (studentItem) => {
        try {
            const teacherId = user?.uid;
            if (!teacherId) return;

            // For now, using a simple prompt for reminder message
            const reminderMessage = prompt('Enter reminder message:', `Please submit your assignment "${studentItem.assignmentTitle}" as soon as possible.`);

            if (!reminderMessage) return;

            const response = await fetch(`http://localhost:8088/api/v1/teacher/send-reminder?teacher_id=${teacherId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentEmail: studentItem.studentEmail,
                    assignmentId: studentItem.assignmentId,
                    message: reminderMessage
                })
            });

            if (response.ok) {
                alert('Reminder sent successfully!');
                // Refresh the list
                fetchStudentsNeedingAttention();
            } else {
                throw new Error('Failed to send reminder');
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Failed to send reminder');
        }
    };

    //Fetch submissions counts
    const fetchSubmissionCounts = async (assignmentId) => {
        try {
            const teacherId = user.uid;
            const response = await fetch(`http://localhost:8088/api/v1/teacher/submissions/${assignmentId}?teacher_id=${teacherId}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    total: data.submissions?.length || 0,
                    graded: data.submissions?.filter(s => s.status === 'graded').length || 0
                };
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
        return {total: 0, graded: 0};
    };

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
                        { text: 'Analytics', icon: <AnalyticsIcon /> ,path:'/teacher/analytics'},
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
                                            Your recent assignments and their status
                                        </Typography>
                                        <List>
                                            {assignments.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                                    No assignments found. Create your first assignment!
                                                </Typography>
                                            ) : (
                                                assignments.map((assignment, index) => (
                                                    <ListItem
                                                        key={index}
                                                        sx={{
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: 3,
                                                            mb: 1,
                                                            '&:hover': { bgcolor: 'action.hover' },
                                                            flexDirection: 'column',
                                                            alignItems: 'flex-start'
                                                        }}
                                                    >
                                                        {/* Header with title and status */}
                                                        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                            <Typography variant="subtitle1" fontWeight="medium">
                                                                {assignment.title}
                                                            </Typography>
                                                            <Chip
                                                                label={new Date(assignment.dueDate) < new Date() ? "Overdue" : "Active"}
                                                                color={new Date(assignment.dueDate) < new Date() ? "error" : "primary"}
                                                                size="small"
                                                            />
                                                        </Box>

                                                        {/* Assignment details */}
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            {assignment.className} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                            Created: {new Date(assignment.created).toLocaleDateString()}
                                                        </Typography>

                                                        {/* Action buttons */}
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() => navigate(`/teacher/submissions?assignmentId=${assignment.id}`)}
                                                                sx={{ mr: 1 }}
                                                            >
                                                                View Submissions
                                                            </Button>
                                                        </Box>
                                                    </ListItem>
                                                ))
                                            )}
                                        </List>
                                    </>
                                )}

                                {activeTab === 'studentPerformance' && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Students needing your attention - Late and missing submissions
                                        </Typography>
                                        <List>
                                            {studentsNeedingAttention.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                                    No students need immediate attention. Great job!
                                                </Typography>
                                            ) : (
                                                studentsNeedingAttention.map((item, index) => (
                                                    <ListItem
                                                        key={index}
                                                        sx={{
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: 3,
                                                            mb: 1,
                                                            '&:hover': { bgcolor: 'action.hover' }
                                                        }}
                                                    >
                                                        <Box sx={{ width: '100%' }}>
                                                            {/* Header with student info and status */}
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                                <Box>
                                                                    <Typography variant="subtitle1" fontWeight="medium" component="div">
                                                                        {item.studentName}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="text.secondary" component="div">
                                                                        {item.studentEmail}
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                                                    <Chip
                                                                        label={item.type === 'late_submission' ? 'Late Submission' : 'Missing Submission'}
                                                                        color={item.type === 'late_submission' ? 'warning' : 'error'}
                                                                        size="small"
                                                                    />
                                                                    {item.reminderCount > 0 && (
                                                                        <Chip
                                                                            label={`${item.reminderCount} reminder${item.reminderCount > 1 ? 's' : ''}`}
                                                                            variant="outlined"
                                                                            size="small"
                                                                            color="secondary"
                                                                        />
                                                                    )}
                                                                </Box>
                                                            </Box>

                                                            {/* Assignment details */}
                                                            <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                                                                <strong>{item.assignmentTitle}</strong> • {item.className}
                                                            </Typography>

                                                            <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2 }}>
                                                                Due: {new Date(item.dueDate).toLocaleDateString()} •
                                                                {item.type === 'late_submission'
                                                                    ? ` Submitted ${item.daysLate} day${item.daysLate > 1 ? 's' : ''} late`
                                                                    : ` ${item.daysLate} day${item.daysLate > 1 ? 's' : ''} overdue`
                                                                }
                                                            </Typography>

                                                            {/* Action buttons */}
                                                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                {item.type === 'late_submission' ? (
                                                                    <Button
                                                                        variant="contained"
                                                                        size="small"
                                                                        onClick={() => navigate(`/teacher/submissions?assignmentId=${item.assignmentId}`)}
                                                                        sx={{ mr: 1 }}
                                                                    >
                                                                        Grade Submission
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        onClick={() => handleSendReminder(item)}
                                                                        sx={{ mr: 1 }}
                                                                    >
                                                                        Send Reminder
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    onClick={() => navigate(`/teacher/submissions?assignmentId=${item.assignmentId}`)}
                                                                >
                                                                    View Details
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </ListItem>
                                                ))
                                            )}
                                        </List>
                                    </>
                                )}

                                {activeTab === 'activityLog' && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Your to-do list and recent activity
                                        </Typography>

                                        {/* To-Do Section */}
                                        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>To-Do List</Typography>
                                        <List>
                                            {toDoItems.length === 0 ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                                    No pending tasks. You're all caught up!
                                                </Typography>
                                            ) : (
                                                toDoItems.map((item, index) => (
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
                                                            primary={
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                                        {item.title}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={item.priority === 'high' ? 'High Priority' : 'Medium Priority'}
                                                                        color={item.priority === 'high' ? 'error' : 'warning'}
                                                                        size="small"
                                                                    />
                                                                </Box>
                                                            }
                                                            secondary={
                                                                <>
                                                                    <Box component="span" sx={{ display: 'block', mt: 1 }}>
                                                                        <Typography variant="body2">
                                                                            {item.className} • {item.description}
                                                                        </Typography>
                                                                        {item.dueDate && (
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                Due: {new Date(item.dueDate).toLocaleDateString()}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                    <Box sx={{ mt: 1 }}>
                                                                        <Button
                                                                            variant="contained"
                                                                            size="small"
                                                                            onClick={() => navigate('/teacher/submissions')}
                                                                            sx={{ mr: 1 }}
                                                                        >
                                                                            {item.type === 'grading' ? 'Grade Now' : 'View Assignment'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outlined"
                                                                            size="small"
                                                                            onClick={() => {/* Add reminder functionality */}}
                                                                        >
                                                                            Set Reminder
                                                                        </Button>
                                                                    </Box>
                                                                </>
                                                            }
                                                        />
                                                    </ListItem>
                                                ))
                                            )}
                                        </List>

                                        {/* Recent Activity Section */}
                                        {recentActivity.length > 0 && (
                                            <>
                                                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Recent Activity</Typography>
                                                <List>
                                                    {recentActivity.map((activity, index) => (
                                                        <ListItem
                                                            key={index}
                                                            sx={{
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: 3,
                                                                mb: 1,
                                                                bgcolor: 'action.hover'
                                                            }}
                                                        >
                                                            <ListItemText
                                                                primary={activity.action}
                                                                secondary={
                                                                    <Box component="span" sx={{ display: 'block' }}>
                                                                        {activity.details} • {new Date(activity.time).toLocaleDateString()} at {new Date(activity.time).toLocaleTimeString()}
                                                                    </Box>
                                                                }
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </>
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
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default TeacherDashboard;