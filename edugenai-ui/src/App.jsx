import { CssBaseline, Container, Grid, Paper, Typography, TextField } from '@mui/material';
import StatsCard from './components/StatsCard';
import UploadArea from './components/UploadArea';
import ExamGenerator from './components/ExamGenerator';
import QuestionInsights from './components/QuestionInsights';
import Navbar from "./components/Navbar";
import ChatbotPopup from './components/ChatbotPopup';

export default function App() {
    const stats = [
        { title: 'Uploaded Papers', value: 25 },
        { title: 'Total Questions Extracted', value: 680 },
        { title: 'Most Frequent Topic', value: 'Algebra' },
        { title: 'Last Generated Paper', value: 'Math Exam' }
    ];

    return (
        <>
            <CssBaseline />
            <Navbar />
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {stats.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <StatsCard title={stat.title} value={stat.value} />
                        </Grid>
                    ))}
                </Grid>

                {/* Main Content */}
                <Grid container spacing={4}>
                    {/* Left Column */}
                    <Grid item xs={12} md={8}>
                        <UploadArea />

                        <Paper sx={{
                            p: 3,
                            mt: 4,
                            borderRadius: 2,
                            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 'bold',
                                mb: 3,
                                color: '#333'
                            }}>
                                Question Insights
                            </Typography>
                            <QuestionInsights />
                        </Paper>
                    </Grid>

                    {/* Right Column */}
                    <Grid item xs={12} md={4}>
                        <ExamGenerator />

                        <Paper sx={{
                            p: 3,
                            mt: 4,
                            borderRadius: 2,
                            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <Typography variant="h6" sx={{
                                fontWeight: 'bold',
                                mb: 3,
                                color: '#333'
                            }}>
                                AI Tutor
                            </Typography>
                            <ChatbotPopup />
                        </Paper>

                        <TextField
                            fullWidth
                            placeholder="Type here to search"
                            sx={{
                                mt: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                            size="small"
                        />
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}