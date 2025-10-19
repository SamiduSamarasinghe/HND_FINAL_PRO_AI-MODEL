import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Stack,
    Button,
    Paper,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Article as ArticleIcon,
    Quiz as QuizIcon,
    School as SchoolIcon,
    Refresh as RefreshIcon,
    ContentCopy as RepeatedIcon
} from '@mui/icons-material';
import backgroundImage from '../assets/pngtree-home-based-e-learning-and-online-education-in-a-3d-illustration-picture-image_7253729.jpg';

const TeacherQuestionBank = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        subject: "",
        type: "",
        topic: "",
        difficulty: ""
    });
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [subjects, setSubjects] = useState([]);

    // Fetch subjects from backend
    const fetchSubjects = async () => {
        try {
            const response = await fetch('http://localhost:8088/api/v1/subjects');
            if (!response.ok) {
                throw new Error('Failed to fetch subjects');
            }
            const data = await response.json();
            console.log('Subjects response:', data);

            if (data.subjects && Array.isArray(data.subjects)) {
                const subjectNames = data.subjects.map(subject =>
                    typeof subject === 'string' ? subject : subject.name || subject.id
                );
                setSubjects(subjectNames);
            } else {
                setSubjects([]);
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
            setError('Failed to load subjects');
        }
    };

    // Fetch questions from backend
    const fetchQuestions = async (subjectFilter = '') => {
        try {
            setLoading(true);
            setError('');

            let url = 'http://localhost:8088/api/v1/questions';
            if (subjectFilter) {
                url += `?subject=${encodeURIComponent(subjectFilter)}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch questions');
            }

            const data = await response.json();
            console.log('Questions response:', data);

            if (data.questions && Array.isArray(data.questions)) {
                // Transform backend data to match frontend format
                const transformedQuestions = data.questions.map((q, index) => ({
                    id: q.id || `q-${index}`,
                    text: q.text || 'No question text',
                    type: q.type || 'MCQ',
                    subject: q.subject || 'General',
                    topic: q.topic || q.subject || 'General',
                    difficulty: mapDifficulty(q.points),
                    options: q.options || [],
                    correct_answer: q.correct_answer || '',
                    points: q.points || 2,
                    source: q.source || 'extracted',
                    source_file: q.source_file || 'Unknown',
                    created_at: q.created_at || new Date().toISOString(),
                    // Calculate repetition
                    repetitionCount: calculateRepetitionCount(q, data.questions),
                    isRepeated: calculateIsRepeated(q, data.questions)
                }));

                setQuestions(transformedQuestions);
                setFilteredQuestions(transformedQuestions);
            } else {
                setQuestions([]);
                setFilteredQuestions([]);
            }

        } catch (err) {
            console.error('Error fetching questions:', err);
            setError(`Failed to load questions: ${err.message}`);
            setQuestions([]);
            setFilteredQuestions([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
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

    // Helper function to map points to difficulty
    const mapDifficulty = (points) => {
        if (!points) return "Medium";
        if (points <= 2) return "Easy";
        if (points <= 5) return "Medium";
        return "Hard";
    };

    // Helper function to calculate average score based on points
    const calculateAvgScore = (points) => {
        if (points <= 2) return 0.8 + Math.random() * 0.15;
        if (points <= 5) return 0.6 + Math.random() * 0.25;
        return 0.4 + Math.random() * 0.3;
    };

    useEffect(() => {
        fetchSubjects();
        fetchQuestions();
    }, []);

    useEffect(() => {
        filterQuestions();
    }, [searchTerm, filters, questions]);

    const filterQuestions = () => {
        let filtered = [...questions];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(q =>
                q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Subject filter
        if (filters.subject) {
            filtered = filtered.filter(q => q.subject === filters.subject);
        }

        // Type filter
        if (filters.type) {
            filtered = filtered.filter(q => q.type === filters.type);
        }

        // Topic filter
        if (filters.topic) {
            filtered = filtered.filter(q => q.topic === filters.topic);
        }

        // Difficulty filter
        if (filters.difficulty) {
            filtered = filtered.filter(q => q.difficulty === filters.difficulty);
        }

        setFilteredQuestions(filtered);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));

        // If subject filter changes, fetch questions for that subject
        if (name === 'subject' && value) {
            fetchQuestions(value);
        } else if (name === 'subject' && !value) {
            // If subject filter is cleared, fetch all questions
            fetchQuestions();
        }
    };

    const toggleQuestionSelect = (id) => {
        setSelectedQuestions(prev =>
            prev.includes(id)
                ? prev.filter(qId => qId !== id)
                : [...prev, id]
        );
    };

    const refreshData = () => {
        setRefreshing(true);
        if (filters.subject) {
            fetchQuestions(filters.subject);
        } else {
            fetchQuestions();
        }
    };

    const clearFilters = () => {
        setFilters({
            subject: "",
            type: "",
            topic: "",
            difficulty: ""
        });
        setSearchTerm("");
        fetchQuestions();
    };

    const getQuestionTypeColor = (type) => {
        const colors = {
            'MCQ': 'primary',
            'Short Answer': 'secondary',
            'Essay': 'info'
        };
        return colors[type] || 'default';
    };

    const getRepetitionColor = (count) => {
        if (count >= 4) return 'error';
        if (count >= 2) return 'warning';
        return 'success';
    };

    const getUniqueTopics = () => {
        return Array.from(new Set(questions.map(q => q.topic).filter(Boolean)));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{
            p: 3,
            minHeight: '100vh',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                opacity: 0.15,
                zIndex: -1
            }
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                    <QuizIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Question Bank
                </Typography>
                <Box>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={refreshData}
                        disabled={refreshing}
                        sx={{ mr: 2 }}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />}>
                        Add Question
                    </Button>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Search and Filter Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search questions, subjects, or topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Stack direction="row" spacing={2}>
                            <FormControl sx={{ minWidth: 120 }} size="small">
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    name="subject"
                                    value={filters.subject}
                                    onChange={handleFilterChange}
                                    label="Subject"
                                >
                                    <MenuItem value=""><em>All Subjects</em></MenuItem>
                                    {subjects.map((subject) => (
                                        <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl sx={{ minWidth: 120 }} size="small">
                                <InputLabel>Type</InputLabel>
                                <Select
                                    name="type"
                                    value={filters.type}
                                    onChange={handleFilterChange}
                                    label="Type"
                                >
                                    <MenuItem value=""><em>All Types</em></MenuItem>
                                    <MenuItem value="MCQ">MCQ</MenuItem>
                                    <MenuItem value="Short Answer">Short Answer</MenuItem>
                                    <MenuItem value="Essay">Essay</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl sx={{ minWidth: 120 }} size="small">
                                <InputLabel>Difficulty</InputLabel>
                                <Select
                                    name="difficulty"
                                    value={filters.difficulty}
                                    onChange={handleFilterChange}
                                    label="Difficulty"
                                >
                                    <MenuItem value=""><em>All Levels</em></MenuItem>
                                    <MenuItem value="Easy">Easy</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="Hard">Hard</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={clearFilters}
                                size="small"
                                sx={{ minHeight: '40px' }}
                            >
                                Clear
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

            {/* Results Summary */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    {filteredQuestions.length} Questions Found
                    {filters.subject && ` in ${filters.subject}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {questions.length} total questions in database
                </Typography>
            </Box>

            {/* Action Bar */}
            {selectedQuestions.length > 0 && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.selected' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography>
                            {selectedQuestions.length} selected
                        </Typography>
                        <Button variant="outlined" size="small">
                            Add to Exam
                        </Button>
                        <Button variant="outlined" size="small">
                            Export
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => setSelectedQuestions([])}>
                            Clear
                        </Button>
                    </Stack>
                </Paper>
            )}

            {/* Questions Grid */}
            <Grid container spacing={3}>
                {filteredQuestions.map((question) => (
                    <Grid item xs={12} sm={6} md={4} key={question.id}>
                        <Card
                            variant="outlined"
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderColor: selectedQuestions.includes(question.id) ? 'primary.main' : 'divider',
                                borderLeft: question.isRepeated ? `4px solid` : '1px solid',
                                borderLeftColor: question.isRepeated ?
                                    getRepetitionColor(question.repetitionCount) : 'divider',
                                boxShadow: selectedQuestions.includes(question.id) ? 1 : 0
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Chip
                                            label={question.type}
                                            size="small"
                                            color={getQuestionTypeColor(question.type)}
                                            sx={{ mb: 1 }}
                                        />
                                        {question.isRepeated && (
                                            <Tooltip title={`This question appears ${question.repetitionCount} times in the database`}>
                                                <Chip
                                                    icon={<RepeatedIcon />}
                                                    label={`Repeated ${question.repetitionCount}x`}
                                                    size="small"
                                                    color={getRepetitionColor(question.repetitionCount)}
                                                    variant="outlined"
                                                    sx={{ ml: 1 }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Checkbox
                                        icon={<RadioButtonUncheckedIcon />}
                                        checkedIcon={<CheckCircleIcon color="primary" />}
                                        checked={selectedQuestions.includes(question.id)}
                                        onChange={() => toggleQuestionSelect(question.id)}
                                    />
                                </Box>

                                <Typography variant="body1" sx={{ mt: 1, mb: 2, minHeight: '60px' }}>
                                    {question.text}
                                </Typography>

                                <Divider sx={{ my: 1 }} />

                                <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" gap={0.5}>
                                    <Chip label={question.subject} size="small" variant="outlined" />
                                    {question.topic && question.topic !== question.subject && (
                                        <Chip label={question.topic} size="small" variant="outlined" />
                                    )}
                                    <Chip
                                        label={question.difficulty}
                                        size="small"
                                        color={
                                            question.difficulty === "Easy" ? "success" :
                                                question.difficulty === "Medium" ? "warning" : "error"
                                        }
                                    />
                                    <Chip
                                        label={`${question.points} pts`}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Stack>

                                {question.type === 'MCQ' && question.options && question.options.length > 0 && (
                                    <Box sx={{ mt: 1, mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Options: {question.options.slice(0, 2).map((opt, idx) =>
                                            `${String.fromCharCode(65 + idx)}) ${opt.substring(0, 20)}${opt.length > 20 ? '...' : ''}`
                                        ).join(', ')}
                                            {question.options.length > 2 && ` ... +${question.options.length - 2} more`}
                                        </Typography>
                                    </Box>
                                )}

                                <Typography variant="body2" color="text.secondary">
                                    <SchoolIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                    Source: {question.source_file} • {new Date(question.created_at).toLocaleDateString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {filteredQuestions.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        No questions found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {questions.length === 0
                            ? "No questions available in the database."
                            : "Try adjusting your filters or search terms."
                        }
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default TeacherQuestionBank;