import { CssBaseline, Container, Grid, Paper, Typography, Button } from '@mui/material';
import StatsCard from './components/StatsCard';
import UploadArea from './components/UploadArea';
import ExamGenerator from './components/ExamGenerator';
import QuestionInsights from './components/QuestionInsights';
import Navbar from "./components/Navbar";

export default function App() {
    // Mock data
    const stats = [
        { title: 'Uploaded Papers', value: 25 },
        { title: 'Total Questions', value: 680 },
        { title: 'Most Frequent Topic', value: 'Algebra' },
        { title: 'Last Generated Paper', value: 'Math Exam' }
    ];

    return (
        <>
            <CssBaseline />
            <Navbar />
            <Container maxWidth="xl" sx={{ py: 4 }}>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {stats.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <StatsCard title={stat.title} value={stat.value} />
                        </Grid>
                    ))}
                </Grid>

                {/* ===== Main Content ===== */}
                <Grid container spacing={4}>
                    {/* Left Column - Upload & Insights */}
                    <Grid item xs={12} md={8}>
                        <UploadArea />

                        <Paper sx={{ p: 3, mt: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Question Insights
                            </Typography>
                            <QuestionInsights />
                        </Paper>
                    </Grid>

                    {/* Right Column - Exam Generator */}
                    <Grid item xs={12} md={4}>
                        <ExamGenerator />

                        <Paper sx={{ p: 3, mt: 4, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                AI Tutor
                            </Typography>
                            <Button variant="contained" fullWidth>
                                CHAT WITH AI TUTOR
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}