import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Button,
    Stack,
    IconButton,
    InputAdornment,
    List,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    ContentCopy as RepeatedIcon,
    ArrowBack as BackIcon,
    InsertDriveFile as PaperIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';

const QuestionBank = () => {
    const navigate = useNavigate();
    const [selectedSubject, setSelectedSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [questionTypes, setQuestionTypes] = useState({
        'MCQ': true,
        'Short Answer': true,
        'Essay': true
    });
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Fetch all subjects and questions
    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('🔄 Fetching data from backend...');

            // First, try to get subjects
            const subjectsResponse = await fetch('http://localhost:8088/api/v1/subjects');

            if (!subjectsResponse.ok) {
                throw new Error(`HTTP error! status: ${subjectsResponse.status}`);
            }

            const subjectsData = await subjectsResponse.json();
            console.log('📚 Subjects response:', subjectsData);

            let subjectNames = [];
            if (subjectsData.subjects && subjectsData.subjects.length > 0) {
                subjectNames = subjectsData.subjects.map(subject =>
                    typeof subject === 'string' ? subject : subject.name || subject.id
                );
            } else {
                // If no subjects endpoint, try to get questions first and extract subjects
                subjectNames = await extractSubjectsFromQuestions();
            }

            setSubjects(subjectNames);
            console.log('📝 Available subjects:', subjectNames);

            // Fetch all questions
            await fetchAllQuestions(subjectNames);

        } catch (err) {
            console.error('❌ Error fetching data:', err);
            setError(`Failed to load data: ${err.message}. Please check if the backend is running on port 8088.`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Extract subjects from questions if subjects endpoint fails
    const extractSubjectsFromQuestions = async () => {
        try {
            const questionsResponse = await fetch('http://localhost:8088/api/v1/questions');
            if (questionsResponse.ok) {
                const questionsData = await questionsResponse.json();
                const uniqueSubjects = [...new Set(questionsData.questions?.map(q => q.subject).filter(Boolean))];
                return uniqueSubjects;
            }
        } catch (err) {
            console.error('Error extracting subjects from questions:', err);
        }
        return [];
    };

    // Fetch all questions
    const fetchAllQuestions = async (subjectNames) => {
        try {
            let allQuestions = [];

            // Try direct questions endpoint first
            try {
                const questionsResponse = await fetch('http://localhost:8088/api/v1/questions');
                if (questionsResponse.ok) {
                    const questionsData = await questionsResponse.json();
                    if (questionsData.questions && questionsData.questions.length > 0) {
                        allQuestions = questionsData.questions.map(q => ({
                            ...q,
                            repetitionCount: calculateRepetitionCount(q, questionsData.questions),
                            isRepeated: calculateIsRepeated(q, questionsData.questions)
                        }));
                        console.log(`✅ Loaded ${allQuestions.length} questions from direct endpoint`);
                    }
                }
            } catch (err) {
                console.log('Direct questions endpoint failed, trying subject-by-subject...');
            }

            // If direct endpoint failed or returned no questions, try subject-by-subject
            if (allQuestions.length === 0 && subjectNames.length > 0) {
                for (const subject of subjectNames) {
                    try {
                        const questionsResponse = await fetch(`http://localhost:8088/api/v1/questions?subject=${encodeURIComponent(subject)}`);
                        if (questionsResponse.ok) {
                            const questionsData = await questionsResponse.json();
                            if (questionsData.questions) {
                                const subjectQuestions = questionsData.questions.map(q => ({
                                    ...q,
                                    subject: subject,
                                    repetitionCount: calculateRepetitionCount(q, questionsData.questions),
                                    isRepeated: calculateIsRepeated(q, questionsData.questions)
                                }));
                                allQuestions.push(...subjectQuestions);
                            }
                        }
                    } catch (err) {
                        console.error(`Error fetching questions for ${subject}:`, err);
                    }
                }
                console.log(`✅ Loaded ${allQuestions.length} questions from subject endpoints`);
            }

            setQuestions(allQuestions);
            setFilteredQuestions(allQuestions);

            if (allQuestions.length === 0) {
                setError('No questions found in the database. Please upload some papers first.');
            }

        } catch (err) {
            console.error('Error in fetchAllQuestions:', err);
            throw err;
        }
    };

    // Calculate repetition count
    const calculateRepetitionCount = (question, allQuestions) => {
        if (!question?.text) return 1;

        const similarQuestions = allQuestions.filter(q =>
            q?.text && question.text &&
            (q.text.toLowerCase().includes(question.text.substring(0, 30).toLowerCase()) ||
                question.text.toLowerCase().includes(q.text.substring(0, 30).toLowerCase()))
        );

        return Math.max(1, similarQuestions.length);
    };

    // Determine if a question is repeated
    const calculateIsRepeated = (question, allQuestions) => {
        return calculateRepetitionCount(question, allQuestions) > 1;
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterQuestions();
    }, [selectedSubject, searchTerm, questionTypes, questions]);

    const filterQuestions = () => {
        let filtered = [...questions];

        // Filter by selected subject
        if (selectedSubject) {
            filtered = filtered.filter(q =>
                q.subject && q.subject.toLowerCase().includes(selectedSubject.toLowerCase())
            );
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(q =>
                (q.text && q.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (q.subject && q.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (q.source && q.source.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (q.source_file && q.source_file.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Filter by question types
        const enabledTypes = Object.keys(questionTypes).filter(type => questionTypes[type]);
        if (enabledTypes.length > 0) {
            filtered = filtered.filter(q => enabledTypes.includes(q.type));
        }

        setFilteredQuestions(filtered);
    };

    const handleQuestionTypeChange = (type) => {
        setQuestionTypes(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const handleSubjectSelect = (subject) => {
        setSelectedSubject(subject);
    };

    const clearFilters = () => {
        setSelectedSubject('');
        setSearchTerm('');
        setQuestionTypes({
            'MCQ': true,
            'Short Answer': true,
            'Essay': true
        });
    };

    const refreshData = () => {
        setRefreshing(true);
        fetchData();
    };

    const getQuestionTypeColor = (type) => {
        const colors = {
            'MCQ': '#1976d2',
            'Short Answer': '#2e7d32',
            'Essay': '#ed6c02'
        };
        return colors[type] || '#666';
    };

    const getRepetitionColor = (count) => {
        if (count >= 4) return '#d32f2f';
        if (count >= 2) return '#ed6c02';
        return '#2e7d32';
    };

    const formatQuestionText = (text) => {
        if (!text) return 'No question text available';
        return text.replace(/\[Question text\]/g, '').trim() || 'Question content';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Loading Question Bank...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Fetching data from the server
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: '100vh' }}>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => navigate('/student')} sx={{ mr: 2 }}>
                            <BackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                                <PaperIcon sx={{ mr: 1, color: 'primary.main' }} />
                                Question Bank
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                Browse and filter questions from all your uploaded content
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={refreshData}
                        disabled={refreshing}
                        variant="outlined"
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert
                        severity={error.includes('No questions found') ? "info" : "error"}
                        sx={{ mb: 3 }}
                        action={
                            error.includes('No questions found') ? (
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => navigate('/upload-papers')}
                                >
                                    Upload Papers
                                </Button>
                            ) : null
                        }
                    >
                        {error}
                    </Alert>
                )}

                {/* Filters Section */}
                <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent>
                        <Grid container spacing={3} alignItems="center">
                            {/* Subject Selection */}
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Subject</InputLabel>
                                    <Select
                                        value={selectedSubject}
                                        label="Select Subject"
                                        onChange={(e) => handleSubjectSelect(e.target.value)}
                                    >
                                        <MenuItem value="">
                                            <em>All Subjects</em>
                                        </MenuItem>
                                        {subjects.map((subject) => (
                                            <MenuItem key={subject} value={subject}>
                                                {subject}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Search Bar */}
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    placeholder="Search questions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* Quick Actions */}
                            <Grid item xs={12} md={4}>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<FilterIcon />}
                                        onClick={clearFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                </Stack>
                            </Grid>

                            {/* Question Type Filters */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Question Types:
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                    {Object.keys(questionTypes).map((type) => (
                                        <Chip
                                            key={type}
                                            label={type}
                                            variant={questionTypes[type] ? "filled" : "outlined"}
                                            onClick={() => handleQuestionTypeChange(type)}
                                            color={questionTypes[type] ? "primary" : "default"}
                                            sx={{
                                                bgcolor: questionTypes[type] ? getQuestionTypeColor(type) : 'transparent',
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Results Summary */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {filteredQuestions.length} Questions Found
                        {selectedSubject && ` in ${selectedSubject}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {questions.length} total questions in database
                    </Typography>
                </Box>

                {/* Questions List */}
                {filteredQuestions.length === 0 && !loading ? (
                    <Card sx={{ borderRadius: 2, border: '1px solid #e0e0e0', textAlign: 'center', py: 6 }}>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No questions found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {questions.length === 0
                                    ? "No questions available in the database."
                                    : "Try adjusting your filters or search terms"
                                }
                            </Typography>
                            {questions.length === 0 && (
                                <Button
                                    variant="contained"
                                    sx={{ mt: 2 }}
                                    onClick={() => navigate('/upload-papers')}
                                >
                                    Upload Papers to Get Started
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Box>
                        {filteredQuestions.map((question, index) => (
                            <Card
                                key={question.id || index}
                                sx={{
                                    mb: 2,
                                    borderRadius: 2,
                                    border: '1px solid #e0e0e0',
                                    borderLeft: question.isRepeated ? `4px solid ${getRepetitionColor(question.repetitionCount)}` : '4px solid transparent',
                                    '&:hover': {
                                        boxShadow: 2,
                                    }
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {formatQuestionText(question.text)}
                                    </Typography>

                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                                        <Chip
                                            label={question.type || 'Unknown'}
                                            size="small"
                                            sx={{
                                                bgcolor: getQuestionTypeColor(question.type),
                                                color: 'white'
                                            }}
                                        />
                                        <Chip
                                            label={question.subject || 'No Subject'}
                                            variant="outlined"
                                            size="small"
                                        />
                                        {question.isRepeated && (
                                            <Chip
                                                icon={<RepeatedIcon />}
                                                label={`Repeated ${question.repetitionCount} times`}
                                                color="warning"
                                                variant="outlined"
                                                size="small"
                                            />
                                        )}
                                    </Stack>

                                    {question.type === 'MCQ' && question.options && question.options.length > 0 && (
                                        <Box sx={{ mb: 2, pl: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Options:
                                            </Typography>
                                            <Grid container spacing={1}>
                                                {question.options.map((option, optIndex) => (
                                                    <Grid item xs={12} sm={6} key={optIndex}>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            p: 1,
                                                            borderRadius: 1,
                                                            bgcolor: question.correct_answer === String.fromCharCode(65 + optIndex) ? 'success.light' : 'grey.50',
                                                        }}>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontWeight: question.correct_answer === String.fromCharCode(65 + optIndex) ? 'bold' : 'normal',
                                                                }}
                                                            >
                                                                {String.fromCharCode(65 + optIndex)}) {option}
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Source: {question.source_file || 'Unknown'}
                                        </Typography>
                                        {question.points && (
                                            <Chip
                                                label={`${question.points} pts`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default QuestionBank;