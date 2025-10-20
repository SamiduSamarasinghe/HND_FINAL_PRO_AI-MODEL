import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Divider,
    Chip,
    LinearProgress,
    Stack,
    Alert,
    Paper,
    Grid,
    MenuItem,
    FormControl,
    Select,
    InputLabel
} from '@mui/material';
import { 
    Upload as UploadIcon, 
    InsertDriveFile,
    TrendingUp,
    Score,
    Timeline
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

const AnalyticsPage = () => {
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [geminiResult, setGeminiResult] = useState(null);

    const USER_ID = '0jFxW0e6M8OqccyF5Gxb8QxFkD93';

    // Fetch all subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8088/api/v1/feedbacks/subjects?userid=${USER_ID}`);
                const data = await response.json();
                setSubjects(data);
            } catch (err) {
                console.error("Error fetching subjects:", err);
                setError("Failed to load subjects");
            }
        };
        fetchSubjects();
    }, []);

    // Fetch feedbacks, either all or filtered
    const fetchFeedbacks = async (subjectFilter = "All") => {
        setLoading(true);
        try {
            const url =
                subjectFilter === "All"
                    ? `http://127.0.0.1:8088/api/v1/feedbacks?userid=${USER_ID}`
                    : `http://127.0.0.1:8088/api/v1/feedbacks/filter?userid=${USER_ID}&subject=${encodeURIComponent(subjectFilter)}`;
            const response = await fetch(url);
            const data = await response.json();
            setFeedbacks(data);
        } catch (err) {
            console.error("Error fetching feedbacks:", err);
            setError("Failed to load feedbacks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const handleFilterChange = (event) => {
        const value = event.target.value;
        setSelectedFilter(value);
        fetchFeedbacks(value);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            handlePaperAnalysis(selectedFile);
        } else {
            setError('Please upload a valid PDF file.');
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            handlePaperAnalysis(droppedFile);
        } else {
            setError('Please upload a valid PDF file.');
        }
    }, []);

    const handlePaperAnalysis = async (fileToAnalyze) => {
        setIsAnalyzing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', fileToAnalyze);

            const response = await fetch(
                `http://127.0.0.1:8088/api/v1/gemini/grade?userid=${USER_ID}`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!response.ok) throw new Error('Failed to analyze the paper.');

            const result = await response.json();
            setGeminiResult(result);

            // Update feedbacks so it appears in charts
            setFeedbacks(prev => [result, ...prev]);

        } catch (err) {
            console.error(err);
            setError('Failed to analyze the uploaded paper.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setError('');
        setIsAnalyzing(false);
        setGeminiResult(null);
    };

    // Prepare chart data
    const prepareChartData = () => feedbacks.map((feedback, index) => ({
        name: `Test ${index + 1}`,
        score: feedback.total_score,
        percentage: feedback.grade_percentage,
        maxScore: feedback.max_score,
        subject: feedback.subject,
        date: new Date(feedback.timestamp).toLocaleDateString(),
        timestamp: feedback.timestamp
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const prepareSubjectData = () => {
        const subjectMap = {};
        feedbacks.forEach(f => {
            if (!subjectMap[f.subject]) {
                subjectMap[f.subject] = { totalScore: 0, count: 0, percentages: [] };
            }
            subjectMap[f.subject].totalScore += f.total_score;
            subjectMap[f.subject].count += 1;
            subjectMap[f.subject].percentages.push(f.grade_percentage);
        });
        return Object.entries(subjectMap).map(([subject, data]) => ({
            subject,
            averageScore: data.totalScore / data.count,
            averagePercentage: data.percentages.reduce((a,b)=>a+b,0)/data.percentages.length,
            testCount: data.count
        }));
    };

    const prepareQuestionData = () => {
        const questionMap = {};
        feedbacks.forEach(f => {
            f.detailed_results?.forEach(r => {
                const key = `Q${r.question_number}`;
                if (!questionMap[key]) {
                    questionMap[key] = { question: r.question_number, totalScore: 0, totalPoints: 0, count: 0 };
                }
                questionMap[key].totalScore += r.score;
                questionMap[key].totalPoints += r.points;
                questionMap[key].count += 1;
            });
        });
        return Object.values(questionMap).map(q => ({
            name: `Q${q.question}`,
            averageScore: (q.totalScore / q.totalPoints) * 100,
            performance: (q.totalScore / q.totalPoints) * 100
        }));
    };

    // Conditional chart data
    const chartData = selectedFilter === "All" 
        ? prepareSubjectData().map(d => ({
            name: d.subject,
            averagePercentage: d.averagePercentage,
            testCount: d.testCount
        }))
        : prepareChartData();

    const questionChartData = selectedFilter === "All" ? [] : prepareQuestionData();

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                Analytics Dashboard
            </Typography>

            {/* File Upload Section */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 3 }}>
                    <Score /> Upload New Paper for Analysis
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Upload the PDF you downloaded from us containing your answers.
                </Typography>

                {!file ? (
                    <Card
                        sx={{
                            border: '2px dashed #ccc',
                            p: 3,
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'primary.main', backgroundColor: 'action.hover' },
                            width: '80%',
                            mx: 'auto'
                        }}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <CardContent>
                            <InsertDriveFile sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h6" gutterBottom>Drop PDF here</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or click to browse</Typography>
                            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                            <input
                                accept=".pdf"
                                style={{ display: 'none' }}
                                id="pdf-upload"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="pdf-upload">
                                <Button variant="contained" component="span" startIcon={<UploadIcon />}>Select PDF</Button>
                            </label>
                        </CardContent>
                    </Card>
                ) : (
                    <Card sx={{ boxShadow: 3, textAlign: 'left', mt: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>File Uploaded</Typography>
                            <Chip label={file.name} color="info" variant="outlined" sx={{ mb: 2 }} />
                            {isAnalyzing ? (
                                <Box>
                                    <LinearProgress />
                                    <Typography variant="body2" sx={{ mt: 1 }}>Analyzing...</Typography>
                                </Box>
                            ) : geminiResult ? (
                                <>
                                    <Typography variant="body1" sx={{ mt: 2 }}>✅ Paper Analysis Complete!</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Overall Feedback:</Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>{geminiResult.overall_feedback}</Typography>

                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Detailed Results:</Typography>
                                    {geminiResult.detailed_results.map((res) => (
                                        <Card key={res.question_number} sx={{ mb: 2, p: 1, backgroundColor: '#f9f9f9' }}>
                                            <Typography variant="body2"><strong>Q{res.question_number}:</strong> {res.question}</Typography>
                                            <Typography variant="body2">Score: {res.score}/{res.points}</Typography>
                                            <Typography variant="body2" color="text.secondary">Feedback: {res.feedback}</Typography>
                                            {res.improved_answer && (
                                                <Typography variant="body2" color="success.main">Suggested Improvement: {res.improved_answer}</Typography>
                                            )}
                                        </Card>
                                    ))}

                                    {geminiResult.areas_to_improve?.length > 0 && (
                                        <>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 2 }}>Areas to Improve:</Typography>
                                            <ul>
                                                {geminiResult.areas_to_improve.map((area, idx) => (
                                                    <li key={idx}><Typography variant="body2">{area}</Typography></li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    <Divider sx={{ my: 2 }} />
                                    <Stack direction="row" spacing={2}>
                                        <Button variant="contained" onClick={resetForm}>Upload Another</Button>
                                    </Stack>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>
                )}
            </Box>

            {/* Subject Filter */}
            <Box sx={{ mb: 4, maxWidth: 300, mx: 'auto' }}>
                <FormControl fullWidth>
                    <InputLabel id="subject-filter-label">Filter by Subject</InputLabel>
                    <Select
                        labelId="subject-filter-label"
                        value={selectedFilter}
                        label="Filter by Subject"
                        onChange={handleFilterChange}
                    >
                        <MenuItem value="All">All</MenuItem>
                        {subjects.map((subj, index) => (
                            <MenuItem key={index} value={subj}>{subj}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Progress Charts Section */}
            {feedbacks.length > 0 && !loading && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <TrendingUp /> Your Progress Overview
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Main Chart */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    {selectedFilter === "All" ? "Subject Performance Overview" : "Score Progress Over Time"}
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    {selectedFilter === "All" ? (
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="averagePercentage" fill="#8884d8" name="Average Percentage (%)" />
                                            <Bar dataKey="testCount" fill="#82ca9d" name="Number of Tests" />
                                        </BarChart>
                                    ) : (
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="score" stroke="#8884d8" name="Total Score" strokeWidth={2} />
                                            <Line type="monotone" dataKey="percentage" stroke="#82ca9d" name="Percentage (%)" strokeWidth={2} />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Question Chart only for single subject */}
                        {selectedFilter !== "All" && (
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>Question Performance</Typography>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={questionChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Performance']} />
                                            <Legend />
                                            <Bar dataKey="performance" fill="#ffc658" name="Performance (%)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}

            {/* Recent Feedback Summary */}
            {feedbacks.length > 0 && !loading && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Timeline /> Recent Feedback Summary
                    </Typography>
                    <Grid container spacing={2}>
                        {feedbacks.slice(0, 3).map((feedback, index) => (
                            <Grid item xs={12} md={4} key={feedback.id || index}>
                                <Card sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="h6" color="primary">{feedback.subject}</Typography>
                                    <Typography variant="h4" sx={{ my: 1 }}>{feedback.grade_percentage}%</Typography>
                                    <Typography variant="body2" color="text.secondary">Score: {feedback.total_score}/{feedback.max_score}</Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>{new Date(feedback.timestamp).toLocaleDateString()}</Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Loading State */}
            {loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography>Loading your progress data...</Typography>
                </Box>
            )}
        </Box>
    );
};

export default AnalyticsPage;