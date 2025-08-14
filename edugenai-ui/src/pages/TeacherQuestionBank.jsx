import React, { useState } from 'react';
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
    MenuItem
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Article as ArticleIcon,
    Quiz as QuizIcon,
    School as SchoolIcon
} from '@mui/icons-material';


const TeacherQuestionBank = () => {
    // Sample data - in real app this would come from API
    const questions = [
        {
            id: 1,
            text: "What is the derivative of x² with respect to x?",
            type: "MCQ",
            topic: "Calculus",
            subtopic: "Derivatives",
            difficulty: "Medium",
            options: ["2x", "x", "x²", "1"],
            answer: "2x",
            usedIn: 3,
            avgScore: 0.72
        },
        {
            id: 2,
            text: "Explain the fundamental theorem of calculus in your own words.",
            type: "Essay",
            topic: "Calculus",
            subtopic: "Integrals",
            difficulty: "Hard",
            usedIn: 2,
            avgScore: 0.58
        },
        {
            id: 3,
            text: "What is the value of π rounded to two decimal places?",
            type: "Short Answer",
            topic: "Geometry",
            subtopic: "Circles",
            difficulty: "Easy",
            answer: "3.14",
            usedIn: 5,
            avgScore: 0.91
        }
    ];

    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        type: "",
        topic: "",
        difficulty: ""
    });
    const [selectedQuestions, setSelectedQuestions] = useState([]);

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const toggleQuestionSelect = (id) => {
        setSelectedQuestions(prev =>
            prev.includes(id)
                ? prev.filter(qId => qId !== id)
                : [...prev, id]
        );
    };

    const filteredQuestions = questions.filter(q => {
        // Search filter
        const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());

        // Type filter
        const matchesType = !filters.type || q.type === filters.type;

        // Topic filter
        const matchesTopic = !filters.topic || q.topic === filters.topic;

        // Difficulty filter
        const matchesDifficulty = !filters.difficulty || q.difficulty === filters.difficulty;

        return matchesSearch && matchesType && matchesTopic && matchesDifficulty;
    });

    return (
        <Box sx={{
            p: 3
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                    <QuizIcon sx={{ mr: 1, color: 'primary.main' }} />
                    Question Bank
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}>
                    Add Question
                </Button>
            </Box>

            {/* Search and Filter Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search questions..."
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
                                <InputLabel>Topic</InputLabel>
                                <Select
                                    name="topic"
                                    value={filters.topic}
                                    onChange={handleFilterChange}
                                    label="Topic"
                                >
                                    <MenuItem value=""><em>All Topics</em></MenuItem>
                                    <MenuItem value="Calculus">Calculus</MenuItem>
                                    <MenuItem value="Geometry">Geometry</MenuItem>
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
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>

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
                                boxShadow: selectedQuestions.includes(question.id) ? 1 : 0
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Chip
                                        label={question.type}
                                        size="small"
                                        color={
                                            question.type === "MCQ" ? "primary" :
                                                question.type === "Short Answer" ? "secondary" : "info"
                                        }
                                    />
                                    <Checkbox
                                        icon={<RadioButtonUncheckedIcon />}
                                        checkedIcon={<CheckCircleIcon color="primary" />}
                                        checked={selectedQuestions.includes(question.id)}
                                        onChange={() => toggleQuestionSelect(question.id)}
                                    />
                                </Box>

                                <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                    {question.text}
                                </Typography>

                                <Divider sx={{ my: 1 }} />

                                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                    <Chip label={question.topic} size="small" variant="outlined" />
                                    {question.subtopic && (
                                        <Chip label={question.subtopic} size="small" variant="outlined" />
                                    )}
                                    <Chip
                                        label={question.difficulty}
                                        size="small"
                                        color={
                                            question.difficulty === "Easy" ? "success" :
                                                question.difficulty === "Medium" ? "warning" : "error"
                                        }
                                    />
                                </Stack>

                                <Typography variant="body2" color="text.secondary">
                                    <SchoolIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                    Used in {question.usedIn} exams • Avg. score: {(question.avgScore * 100).toFixed(0)}%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default TeacherQuestionBank;