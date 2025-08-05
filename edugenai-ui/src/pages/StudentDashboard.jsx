import { Box, Grid, Typography } from '@mui/material';
import DashboardCard from '../components/DashboardCard';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import RecentPapers from '../components/RecentPapers';
import QuickActions from '../components/QuickActions';

const StudentDashboard = () => {
    const studentData = {
        name: "Sarah",
        taskQuestions: 804,
        papersAnalyzed: 23,
        mockTests: 12,
        studyStreak: 7,
        recentPapers: [
            { title: "Mathematics Final Exam 2023", questions: 45, date: "2024-01-15" },
            { title: "Physics Midterm 2023", questions: 25, date: "2024-01-12" },
            { title: "Chemistry Quiz 2023", questions: 20, date: "2024-01-10" },
        ],
        tutorMessage: "I noticed you're struggling with calculus derivatives. Would you like me to create a focused practice set?"
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Navbar title="Student Dashboard for Exam Preparation" />

                <Typography variant="h4" gutterBottom>
                    Welcome back, {studentData.name}!
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                    Ready to continue your exam preparation?
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Task Questions"
                            value={studentData.taskQuestions}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Papers Analyzed"
                            value={studentData.papersAnalyzed}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Mock Tests"
                            value={studentData.mockTests}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <DashboardCard
                            title="Study Streak"
                            value={`${studentData.studyStreak} days`}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={8}>
                        <RecentPapers papers={studentData.recentPapers} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <QuickActions
                            actions={[
                                "Upload New Paper",
                                "Generate Mock Test",
                                "View Analytics",
                                "Chat with AI Tutor"
                            ]}
                            tutorMessage={studentData.tutorMessage}
                        />
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default StudentDashboard;