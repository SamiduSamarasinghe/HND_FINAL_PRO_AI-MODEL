import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
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
    InputLabel,
    CircularProgress
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
    const { user, userProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState("All");
    const [geminiResult, setGeminiResult] = useState(null);

    // Check authentication and role
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
                return;
            }
            if (userProfile?.role !== 'student' && userProfile?.role !== 'teacher') {
                navigate('/select-role');
                return;
            }
        }
    }, [user, userProfile, authLoading, navigate]);

    // Fetch all subjects
    useEffect(() => {
        if (!user) return;

        const fetchSubjects = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8088/api/v1/feedbacks/subjects`);
                const data = await response.json();
                setSubjects(data);
            } catch (err) {
                console.error("Error fetching subjects:", err);
                setError("Failed to load subjects");
            }
        };
        fetchSubjects();
    }, [user]);

    // Fetch feedbacks based on role and filter
    const fetchFeedbacks = async (subjectFilter = "All") => {
        if (!user) return;

        setLoading(true);
        try {
            let url;
            
            if (userProfile?.role === 'teacher') {
                if (subjectFilter === "All") {
                    // Teacher - All subjects: get all feedbacks
                    url = `http://127.0.0.1:8088/api/v1/feedbacks`;
                } else {
                    // Teacher - Specific subject: filter by subject
                    url = `http://127.0.0.1:8088/api/v1/feedbacks/filter?subject=${encodeURIComponent(subjectFilter)}`;
                }
            } else {
                // Student logic remains the same
                if (subjectFilter === "All") {
                    url = `http://127.0.0.1:8088/api/v1/feedbacks?userid=${user.uid}`;
                } else {
                    url = `http://127.0.0.1:8088/api/v1/feedbacks/filter?userid=${user.uid}&subject=${encodeURIComponent(subjectFilter)}`;
                }
            }

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
        if (user) {
            fetchFeedbacks();
        }
    }, [user]);

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
        if (!user) return;

        setIsAnalyzing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', fileToAnalyze);

            const response = await fetch(
                `http://127.0.0.1:8088/api/v1/gemini/grade?userid=${user.uid}`,
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

    // Prepare chart data for teacher (group by user_id)
    const prepareTeacherChartData = () => {
        const userMap = {};
        const userIdToName = {};
        let userCounter = 1;

        // Group feedbacks by user_id and assign display names
        feedbacks.forEach((feedback, index) => {
            const userId = feedback.user_id;
            if (!userIdToName[userId]) {
                userIdToName[userId] = `User ${userCounter++}`;
            }
            
            if (!userMap[userId]) {
                userMap[userId] = [];
            }
            
            userMap[userId].push({
                name: `Test ${userMap[userId].length + 1}`,
                score: feedback.total_score,
                percentage: feedback.grade_percentage,
                maxScore: feedback.max_score,
                subject: feedback.subject,
                date: new Date(feedback.timestamp).toLocaleDateString(),
                timestamp: feedback.timestamp,
                displayName: userIdToName[userId]
            });
        });

        // Convert to array format for charts
        const result = [];
        Object.values(userMap).forEach(userTests => {
            result.push(...userTests.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        });

        return result;
    };

    // Prepare subject data for teacher overview
    const prepareTeacherSubjectData = () => {
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

    // Prepare question data for teacher
    const prepareTeacherQuestionData = () => {
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

    // Conditional chart data based on role and filter
    const getChartData = () => {
        if (userProfile?.role === 'teacher') {
            if (selectedFilter === "All") {
                // Teacher - All subjects: show subject overview
                return prepareTeacherSubjectData().map(d => ({
                    name: d.subject,
                    averagePercentage: d.averagePercentage,
                    testCount: d.testCount
                }));
            } else {
                // Teacher - Specific subject: show user progress
                return prepareTeacherChartData();
            }
        } else {
            // Student logic remains the same
            if (selectedFilter === "All") {
                return prepareSubjectData().map(d => ({
                    name: d.subject,
                    averagePercentage: d.averagePercentage,
                    testCount: d.testCount
                }));
            } else {
                return prepareChartData();
            }
        }
    };

    const getQuestionChartData = () => {
        if (userProfile?.role === 'teacher' && selectedFilter !== "All") {
            return prepareTeacherQuestionData();
        } else if (userProfile?.role === 'student' && selectedFilter !== "All") {
            return prepareQuestionData();
        }
        return [];
    };

    // Original student data preparation functions (keep them for student role)
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

    const chartData = getChartData();
    const questionChartData = getQuestionChartData();

    const redirectToHome = () =>{
        userProfile?.role ==='teacher'? navigate('/teacher'):navigate('/student');
    }

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Redirect if not student or teacher (handled by useEffect, but return null during redirect)
    if (!user || (userProfile?.role !== 'student' && userProfile?.role !== 'teacher')) {
        return null;
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                Analytics Dashboard
            </Typography>
            <Button onClick={redirectToHome}>Go Back</Button><Divider sx={{mb:2}} />
            {/* File Upload Section - Only show for students */}
            {userProfile?.role === 'student' && (
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
            )}

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
                        <TrendingUp /> 
                        {userProfile?.role === 'teacher' 
                            ? (selectedFilter === "All" ? 'Class Performance Overview' : 'Student Performance by User')
                            : 'Your Progress Overview'
                        }
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Main Chart */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    {userProfile?.role === 'teacher' ? (
                                        selectedFilter === "All" 
                                            ? "Subject Performance Overview" 
                                            : "Student Progress Over Time"
                                    ) : (
                                        selectedFilter === "All" 
                                            ? "Subject Performance Overview" 
                                            : "Score Progress Over Time"
                                    )}
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
                                            {userProfile?.role === 'teacher' ? (
                                                // Teacher view: multiple lines for different users
                                                Array.from(new Set(chartData.map(item => item.displayName))).map((userName, index) => (
                                                    <Line 
                                                        key={userName}
                                                        type="monotone" 
                                                        dataKey="percentage" 
                                                        data={chartData.filter(item => item.displayName === userName)}
                                                        stroke={['#8884d8', '#82ca9d', '#ffc658', '#ff7300'][index % 4]}
                                                        name={userName}
                                                        strokeWidth={2}
                                                        connectNulls
                                                    />
                                                ))
                                            ) : (
                                                // Student view: single user
                                                <>
                                                    <Line type="monotone" dataKey="score" stroke="#8884d8" name="Total Score" strokeWidth={2} />
                                                    <Line type="monotone" dataKey="percentage" stroke="#82ca9d" name="Percentage (%)" strokeWidth={2} />
                                                </>
                                            )}
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Question Chart only for single subject */}
                        {selectedFilter !== "All" && (
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {userProfile?.role === 'teacher' ? 'Question Performance (All Students)' : 'Question Performance'}
                                    </Typography>
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
                        <Timeline /> 
                        {userProfile?.role === 'teacher' 
                            ? (selectedFilter === "All" ? 'Class Assessment Summary' : 'Recent Assessment Summary')
                            : 'Recent Feedback Summary'
                        }
                    </Typography>
                    <Grid container spacing={2}>
                        {feedbacks.slice(0, 3).map((feedback, index) => (
                            <Grid item xs={12} md={4} key={feedback.id || index}>
                                <Card sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="h6" color="primary">{feedback.subject}</Typography>
                                    {userProfile?.role === 'teacher' && selectedFilter === "All" && (
                                        <Typography variant="body2" color="text.secondary">
                                            User: {feedback.user_id ? `User ${feedback.user_id.substring(0, 6)}...` : 'Unknown'}
                                        </Typography>
                                    )}
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
                    <Typography>Loading progress data...</Typography>
                </Box>
            )}
        </Box>
    );
};

export default AnalyticsPage;