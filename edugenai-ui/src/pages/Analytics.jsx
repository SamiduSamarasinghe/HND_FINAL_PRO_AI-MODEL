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
    CircularProgress,
    Avatar
} from '@mui/material';
import {
    Upload as UploadIcon,
    InsertDriveFile,
    TrendingUp,
    Score,
    Timeline,
    Person as PersonIcon,
    ArrowBack
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
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState("All");
    const [studentLoading, setStudentLoading] = useState(false);

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

    // Fetch students list (for teachers only)
    useEffect(() => {
        if (userProfile?.role === 'teacher' && user) {
            fetchStudents();
        }
    }, [user, userProfile]);

    const fetchStudents = async () => {
        setStudentLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:8088/api/v1/students`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data.students || []);
            } else {
                console.error('Failed to fetch students');
            }
        } catch (err) {
            console.error("Error fetching students:", err);
        } finally {
            setStudentLoading(false);
        }
    };

    // Fetch feedbacks based on role and filter
    const fetchFeedbacks = async (subjectFilter = "All", studentFilter = "All") => {
        if (!user) return;

        setLoading(true);
        try {
            let url;

            if (userProfile?.role === 'teacher') {
                if (subjectFilter === "All" && studentFilter === "All") {
                    // Teacher - All subjects, all students: get all feedbacks
                    url = `http://127.0.0.1:8088/api/v1/feedbacks`;
                } else if (studentFilter !== "All") {
                    // Teacher - Specific student
                    url = `http://127.0.0.1:8088/api/v1/feedbacks?userid=${studentFilter}`;
                    if (subjectFilter !== "All") {
                        url += `&subject=${encodeURIComponent(subjectFilter)}`;
                    }
                } else {
                    // Teacher - Specific subject, all students
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
            if (response.ok) {
                const data = await response.json();
                setFeedbacks(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch feedbacks');
                setFeedbacks([]);
            }
        } catch (err) {
            console.error("Error fetching feedbacks:", err);
            setError("Failed to load feedbacks");
            setFeedbacks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchFeedbacks(selectedFilter, selectedStudent);
        }
    }, [user]);

    const handleFilterChange = (event) => {
        const value = event.target.value;
        setSelectedFilter(value);
        fetchFeedbacks(value, selectedStudent);
    };

    const handleStudentChange = (event) => {
        const value = event.target.value;
        setSelectedStudent(value);
        fetchFeedbacks(selectedFilter, value);
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

            // Refresh feedbacks to include the new result
            fetchFeedbacks(selectedFilter, selectedStudent);

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

    // Prepare teacher chart data - improved with student names
    const prepareTeacherChartData = () => {
        if (selectedStudent !== "All") {
            // Single student view - show their progress over time
            const studentFeedbacks = feedbacks
                .map((feedback, index) => ({
                    name: `Test ${index + 1}`,
                    score: feedback.total_score || 0,
                    percentage: feedback.grade_percentage || 0,
                    maxScore: feedback.max_score || 100,
                    subject: feedback.subject || 'Unknown',
                    date: feedback.timestamp ? new Date(feedback.timestamp).toLocaleDateString() : 'Unknown',
                    timestamp: feedback.timestamp
                }))
                .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

            return studentFeedbacks;
        } else {
            // Multiple students view - show average performance by student
            const studentMap = {};

            feedbacks.forEach((feedback) => {
                const userId = feedback.user_id;
                if (!userId) return;

                if (!studentMap[userId]) {
                    const student = students.find(s => s.user_id === userId) || {
                        name: `Student ${userId.substring(0, 6)}`,
                        email: 'Unknown'
                    };
                    studentMap[userId] = {
                        ...student,
                        tests: [],
                        totalPercentage: 0,
                        testCount: 0
                    };
                }

                studentMap[userId].tests.push(feedback);
                studentMap[userId].totalPercentage += feedback.grade_percentage || 0;
                studentMap[userId].testCount += 1;
            });

            return Object.values(studentMap).map(student => ({
                name: student.name,
                averagePercentage: student.testCount > 0 ? Math.round(student.totalPercentage / student.testCount) : 0,
                testCount: student.testCount,
                email: student.email,
                lastTest: student.tests.length > 0 && student.tests[student.tests.length - 1].timestamp
                    ? new Date(student.tests[student.tests.length - 1].timestamp).toLocaleDateString()
                    : 'No tests'
            }));
        }
    };

    // Prepare subject comparison for teacher
    const prepareTeacherSubjectData = () => {
        const subjectMap = {};
        feedbacks.forEach(f => {
            const subject = f.subject || 'Unknown';
            if (!subjectMap[subject]) {
                subjectMap[subject] = { totalScore: 0, count: 0, percentages: [] };
            }
            subjectMap[subject].totalScore += f.total_score || 0;
            subjectMap[subject].count += 1;
            subjectMap[subject].percentages.push(f.grade_percentage || 0);
        });

        return Object.entries(subjectMap).map(([subject, data]) => ({
            subject,
            averageScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
            averagePercentage: data.percentages.length > 0 ? Math.round(data.percentages.reduce((a,b)=>a+b,0)/data.percentages.length) : 0,
            testCount: data.count
        }));
    };

    // Student data preparation functions
    const prepareStudentChartData = () => {
        return feedbacks
            .map((feedback, index) => ({
                name: `Test ${index + 1}`,
                score: feedback.total_score || 0,
                percentage: feedback.grade_percentage || 0,
                subject: feedback.subject || 'Unknown',
                date: feedback.timestamp ? new Date(feedback.timestamp).toLocaleDateString() : 'Unknown'
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const prepareStudentSubjectData = () => {
        const subjectMap = {};
        feedbacks.forEach(f => {
            const subject = f.subject || 'Unknown';
            if (!subjectMap[subject]) {
                subjectMap[subject] = { totalScore: 0, count: 0, percentages: [] };
            }
            subjectMap[subject].totalScore += f.total_score || 0;
            subjectMap[subject].count += 1;
            subjectMap[subject].percentages.push(f.grade_percentage || 0);
        });

        return Object.entries(subjectMap).map(([subject, data]) => ({
            name: subject,
            averagePercentage: data.percentages.length > 0 ? Math.round(data.percentages.reduce((a,b)=>a+b,0)/data.percentages.length) : 0,
            testCount: data.count
        }));
    };

    // Conditional chart data based on role and filters
    const getChartData = () => {
        if (userProfile?.role === 'teacher') {
            if (selectedStudent === "All") {
                if (selectedFilter === "All") {
                    // Teacher - All students, all subjects: show student overview
                    return prepareTeacherChartData();
                } else {
                    // Teacher - All students, specific subject: show subject performance
                    return prepareTeacherSubjectData().map(d => ({
                        name: d.subject,
                        averagePercentage: d.averagePercentage,
                        testCount: d.testCount
                    }));
                }
            } else {
                // Teacher - Specific student: show their progress
                return prepareStudentChartData();
            }
        } else {
            // Student logic
            if (selectedFilter === "All") {
                return prepareStudentSubjectData();
            } else {
                return prepareStudentChartData();
            }
        }
    };

    const getSelectedStudentInfo = () => {
        if (selectedStudent === "All") return null;
        return students.find(s => s.user_id === selectedStudent);
    };

    const chartData = getChartData();
    const selectedStudentInfo = getSelectedStudentInfo();

    const redirectToHome = () => {
        userProfile?.role === 'teacher' ? navigate('/teacher') : navigate('/student');
    }

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={redirectToHome}
                        variant="outlined"
                    >
                        Back to Dashboard
                    </Button>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Analytics Dashboard
                    </Typography>
                </Box>
                {userProfile?.role === 'teacher' && selectedStudent !== "All" && selectedStudentInfo && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                            {selectedStudentInfo.name.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {selectedStudentInfo.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedStudentInfo.email}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>

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
                                        {geminiResult.detailed_results?.map((res) => (
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

            {/* Filters Section */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {/* Subject Filter */}
                <Grid item xs={12} md={userProfile?.role === 'teacher' ? 6 : 12}>
                    <FormControl fullWidth>
                        <InputLabel id="subject-filter-label">Filter by Subject</InputLabel>
                        <Select
                            labelId="subject-filter-label"
                            value={selectedFilter}
                            label="Filter by Subject"
                            onChange={handleFilterChange}
                        >
                            <MenuItem value="All">All Subjects</MenuItem>
                            {subjects.map((subj, index) => (
                                <MenuItem key={index} value={subj}>{subj}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Student Filter - Only for teachers */}
                {userProfile?.role === 'teacher' && (
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel id="student-filter-label">Filter by Student</InputLabel>
                            <Select
                                labelId="student-filter-label"
                                value={selectedStudent}
                                label="Filter by Student"
                                onChange={handleStudentChange}
                            >
                                <MenuItem value="All">All Students</MenuItem>
                                {students.map((student, index) => (
                                    <MenuItem key={index} value={student.user_id}>
                                        {student.name} ({student.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
            </Grid>

            {/* Students Grid - For teacher overview */}
            {userProfile?.role === 'teacher' && selectedStudent === "All" && selectedFilter === "All" && !studentLoading && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <PersonIcon /> Students Overview
                    </Typography>
                    <Grid container spacing={2}>
                        {students.length > 0 ? (
                            students.map((student, index) => {
                                const studentFeedbacks = feedbacks.filter(f => f.user_id === student.user_id);
                                const avgScore = studentFeedbacks.length > 0
                                    ? Math.round(studentFeedbacks.reduce((sum, f) => sum + (f.grade_percentage || 0), 0) / studentFeedbacks.length)
                                    : 0;

                                return (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Card
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    boxShadow: 3,
                                                    transform: 'translateY(-2px)',
                                                    transition: 'all 0.2s'
                                                },
                                                border: selectedStudent === student.user_id ? '2px solid primary.main' : '1px solid #e0e0e0',
                                                height: '100%'
                                            }}
                                            onClick={() => {
                                                setSelectedStudent(student.user_id);
                                                fetchFeedbacks(selectedFilter, student.user_id);
                                            }}
                                        >
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 50, height: 50 }}>
                                                        {student.name.charAt(0)}
                                                    </Avatar>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="h6" noWrap>{student.name}</Typography>
                                                        <Typography variant="body2" color="text.secondary" noWrap>
                                                            {student.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Divider sx={{ my: 1 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">Tests</Typography>
                                                        <Typography variant="h6">{studentFeedbacks.length}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">Avg Score</Typography>
                                                        <Typography variant="h6" color={avgScore >= 70 ? 'success.main' : avgScore >= 50 ? 'warning.main' : 'error.main'}>
                                                            {avgScore}%
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" sx={{ mt: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                                    Click to view details →
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })
                        ) : (
                            <Grid item xs={12}>
                                <Card sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No students found with submitted papers.
                                    </Typography>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            )}

            {/* Progress Charts Section */}
            {feedbacks.length > 0 && !loading && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <TrendingUp />
                        {userProfile?.role === 'teacher'
                            ? (selectedStudent === "All"
                                ? 'Class Performance Overview'
                                : `Performance: ${selectedStudentInfo?.name || 'Student'}`)
                            : 'Your Progress Overview'
                        }
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Main Chart */}
                        <Grid item xs={12} md={selectedStudent !== "All" ? 8 : 12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    {userProfile?.role === 'teacher' ? (
                                        selectedStudent === "All"
                                            ? "Student Performance Overview"
                                            : "Progress Over Time"
                                    ) : (
                                        selectedFilter === "All"
                                            ? "Subject Performance Overview"
                                            : "Score Progress Over Time"
                                    )}
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    {userProfile?.role === 'teacher' && selectedStudent === "All" ? (
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    if (name === 'averagePercentage') return [`${value}%`, 'Average Score'];
                                                    return [value, name];
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="averagePercentage" fill="#8884d8" name="Average Score (%)" />
                                            <Bar dataKey="testCount" fill="#82ca9d" name="Tests Taken" />
                                        </BarChart>
                                    ) : (
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="percentage"
                                                stroke="#8884d8"
                                                name="Score (%)"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Student Info Panel - Only when specific student selected */}
                        {userProfile?.role === 'teacher' && selectedStudent !== "All" && selectedStudentInfo && (
                            <Grid item xs={12} md={4}>
                                <Paper sx={{ p: 2, height: 'fit-content' }}>
                                    <Typography variant="h6" gutterBottom>Student Information</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 60, height: 60 }}>
                                            {selectedStudentInfo.name.charAt(0)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6">{selectedStudentInfo.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedStudentInfo.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" gutterBottom>
                                            <strong>Total Tests:</strong> {feedbacks.length}
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            <strong>Average Score:</strong> {feedbacks.length > 0
                                            ? Math.round(feedbacks.reduce((sum, f) => sum + (f.grade_percentage || 0), 0) / feedbacks.length)
                                            : 0}%
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            <strong>Last Activity:</strong> {selectedStudentInfo.last_activity
                                            ? new Date(selectedStudentInfo.last_activity).toLocaleDateString()
                                            : 'Unknown'}
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => setSelectedStudent("All")}
                                        startIcon={<ArrowBack />}
                                    >
                                        Back to All Students
                                    </Button>
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
                            ? (selectedStudent === "All" ? 'Recent Assessments' : 'Recent Tests')
                            : 'Recent Feedback Summary'
                        }
                    </Typography>
                    <Grid container spacing={2}>
                        {feedbacks.slice(0, 3).map((feedback, index) => (
                            <Grid item xs={12} md={4} key={feedback.id || index}>
                                <Card sx={{ p: 2, height: '100%' }}>
                                    <Typography variant="h6" color="primary">
                                        {feedback.subject || 'Unknown Subject'}
                                    </Typography>
                                    {userProfile?.role === 'teacher' && selectedStudent === "All" && (
                                        <Typography variant="body2" color="text.secondary">
                                            Student: {students.find(s => s.user_id === feedback.user_id)?.name || 'Unknown'}
                                        </Typography>
                                    )}
                                    <Typography variant="h4" sx={{ my: 1 }}>
                                        {feedback.grade_percentage || 0}%
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Score: {feedback.total_score || 0}/{feedback.max_score || 100}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        {feedback.timestamp ? new Date(feedback.timestamp).toLocaleDateString() : 'Unknown date'}
                                    </Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Loading States */}
            {loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography>Loading analytics data...</Typography>
                </Box>
            )}

            {studentLoading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography>Loading students...</Typography>
                </Box>
            )}

            {/* No Data State */}
            {!loading && feedbacks.length === 0 && userProfile?.role === 'teacher' && selectedStudent === "All" && (
                <Card sx={{ textAlign: 'center', py: 6 }}>
                    <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No analytics data available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {students.length === 0
                            ? "No students have submitted papers yet."
                            : "Select a student or subject to view analytics."}
                    </Typography>
                </Card>
            )}
        </Box>
    );
};

export default AnalyticsPage;