import { Box, Grid, Typography } from '@mui/material';
import DashboardCard from '../components/DashboardCard';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ClassOverview from '../components/ClassOverview';
import QuickActions from '../components/QuickActions';

const TeacherDashboard = () => {
    const teacherData = {
        name: "Dr. Martinez",
        totalStudents: 119,
        activePapers: 15,
        questionsCreated: 342,
        avgClassScore: "80%",
        classes: [
            { name: "Mathematics 101", students: 32, papers: 8, avgScore: "78%" },
            { name: "Physics 201", students: 28, papers: 6, avgScore: "82%" },
            { name: "Advanced Calculus", students: 24, papers: 10, avgScore: "75%" },
            { name: "Statistics", students: 35, papers: 5, avgScore: "85%" },
        ],
        upcomingTasks: [
            "Grade Physics Midterm Papers",
            "Create Mathematics Quiz",
            "Review Student Progress Reports"
        ]
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Navbar title="Teacher Dashboard for Exam Preparation" />

                <Typography variant="h4" gutterBottom>
                    Welcome back, {teacherData.name}!
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                    Here's what's happening in your classes today!
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Total Students"
                            value={teacherData.totalStudents}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Active Papers"
                            value={teacherData.activePapers}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Questions Created"
                            value={teacherData.questionsCreated}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Avg Class Score"
                            value={teacherData.avgClassScore}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={8}>
                        <ClassOverview classes={teacherData.classes} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <QuickActions
                            actions={[
                                "Create New Paper",
                                "Upload Questions",
                                "Manage Classes",
                                "View Analytics"
                            ]}
                            upcomingTasks={teacherData.upcomingTasks}
                        />
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default TeacherDashboard;