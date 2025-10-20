import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Stack,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Button,
    Chip,
    CircularProgress
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const QuestionBankSelection = ({ onQuestionsSelected, onClose }) => {
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        subject: '',
        type: '',
        difficulty: ''
    });
    const [loading, setLoading] = useState(true);

    // Fetch questions
    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8088/api/v1/questions');
            if (response.ok) {
                const data = await response.json();
                const questionsArray = data.questions || [];
                setQuestions(questionsArray);
                setFilteredQuestions(questionsArray);
            }
        } catch (err) {
            console.error('Error fetching questions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    useEffect(() => {
        filterQuestions();
    }, [searchTerm, filters, questions]);

    const filterQuestions = () => {
        let filtered = [...questions];

        if (searchTerm) {
            filtered = filtered.filter(q =>
                q.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.subject?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filters.subject) {
            filtered = filtered.filter(q => q.subject === filters.subject);
        }

        if (filters.type) {
            filtered = filtered.filter(q => q.type === filters.type);
        }

        if (filters.difficulty) {
            filtered = filtered.filter(q => q.difficulty === filters.difficulty);
        }

        setFilteredQuestions(filtered);
    };

    const toggleQuestionSelect = (question) => {
        setSelectedQuestions(prev =>
            prev.find(q => q.id === question.id)
                ? prev.filter(q => q.id !== question.id)
                : [...prev, question]
        );
    };

    const handleAddToAssignment = () => {
        onQuestionsSelected(selectedQuestions);
    };

    const getQuestionTypeColor = (type) => {
        const colors = {
            'MCQ': 'primary',
            'Short Answer': 'secondary',
            'Essay': 'info'
        };
        return colors[type] || 'default';
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 1 }}
                        InputProps={{
                            startAdornment: <SearchIcon color="action" />
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={filters.type}
                            label="Type"
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="MCQ">MCQ</MenuItem>
                            <MenuItem value="Short Answer">Short Answer</MenuItem>
                            <MenuItem value="Essay">Essay</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Difficulty</InputLabel>
                        <Select
                            value={filters.difficulty}
                            label="Difficulty"
                            onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="Easy">Easy</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Hard">Hard</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Selection Info */}
            {selectedQuestions.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {selectedQuestions.length} questions selected
                </Alert>
            )}

            {/* Questions List */}
            <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredQuestions.length === 0 ? (
                    <Typography textAlign="center" color="text.secondary" sx={{ p: 3 }}>
                        No questions found
                    </Typography>
                ) : (
                    <Stack spacing={1}>
                        {filteredQuestions.map((question) => (
                            <Paper
                                key={question.id}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderColor: selectedQuestions.find(q => q.id === question.id) ? 'primary.main' : 'divider',
                                    bgcolor: selectedQuestions.find(q => q.id === question.id) ? 'action.selected' : 'background.paper'
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <input
                                        type="checkbox"
                                        checked={!!selectedQuestions.find(q => q.id === question.id)}
                                        onChange={() => toggleQuestionSelect(question)}
                                        style={{ marginTop: '4px' }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" gutterBottom>
                                            {question.text}
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                                            <Chip
                                                label={question.type}
                                                size="small"
                                                color={getQuestionTypeColor(question.type)}
                                            />
                                            <Chip label={question.subject} size="small" variant="outlined" />
                                            {question.points && (
                                                <Chip label={`${question.points} pts`} size="small" variant="outlined" />
                                            )}
                                            {question.difficulty && (
                                                <Chip
                                                    label={question.difficulty}
                                                    size="small"
                                                    color={
                                                        question.difficulty === "Easy" ? "success" :
                                                            question.difficulty === "Medium" ? "warning" : "error"
                                                    }
                                                />
                                            )}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleAddToAssignment}
                    disabled={selectedQuestions.length === 0}
                >
                    Add {selectedQuestions.length} Questions to Assignment
                </Button>
            </Box>
        </Box>
    );
};

export default QuestionBankSelection;