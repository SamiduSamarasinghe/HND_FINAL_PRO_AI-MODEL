import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    Divider,
    Grid,
    Paper,
    IconButton
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Clear as ClearIcon,
    School as SchoolIcon
} from '@mui/icons-material';

const TeacherUploadQuestions = () => {
    const [questions, setQuestions] = useState([{
        id: 1,
        text: '',
        type: 'MCQ',
        subject: '',
        points: 2,
        options: ['', '', '', ''],
        correctAnswer: 'A',
        topic: ''
    }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const questionTypes = [
        { value: 'MCQ', label: 'Multiple Choice (MCQ)', points: 2 },
        { value: 'Short Answer', label: 'Short Answer', points: 5 },
        { value: 'Essay', label: 'Essay', points: 10 }
    ];

    const subjects = [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Computer Science',
        'Statistics',
        'English',
        'History'
    ];

    const addNewQuestion = () => {
        const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
        setQuestions(prev => [...prev, {
            id: newId,
            text: '',
            type: 'MCQ',
            subject: '',
            points: 2,
            options: ['', '', '', ''],
            correctAnswer: 'A',
            topic: ''
        }]);
    };

    const removeQuestion = (id) => {
        if (questions.length > 1) {
            setQuestions(prev => prev.filter(q => q.id !== id));
        }
    };

    const updateQuestion = (id, field, value) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === id) {
                const updated = { ...q, [field]: value };

                // Auto-update points when type changes
                if (field === 'type') {
                    const typeConfig = questionTypes.find(t => t.value === value);
                    updated.points = typeConfig ? typeConfig.points : 2;
                }

                // Reset options if changing from MCQ to other types
                if (field === 'type' && value !== 'MCQ') {
                    updated.options = [];
                    updated.correctAnswer = '';
                }

                // Initialize options if changing to MCQ
                if (field === 'type' && value === 'MCQ' && (!q.options || q.options.length === 0)) {
                    updated.options = ['', '', '', ''];
                    updated.correctAnswer = 'A';
                }

                return updated;
            }
            return q;
        }));
    };

    const updateOption = (questionId, optionIndex, value) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === questionId) {
                const newOptions = [...q.options];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const validateQuestions = () => {
        for (const question of questions) {
            if (!question.text.trim()) {
                return `Question ${question.id} text is required`;
            }
            if (!question.subject) {
                return `Question ${question.id} subject is required`;
            }
            if (question.type === 'MCQ') {
                if (question.options.some(opt => !opt.trim())) {
                    return `Question ${question.id} has empty MCQ options`;
                }
                if (!question.correctAnswer) {
                    return `Question ${question.id} requires a correct answer`;
                }
            }
        }
        return null;
    };

    const uploadQuestions = async () => {
        setError('');
        setSuccess('');

        const validationError = validateQuestions();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            // Prepare questions for Firestore
            const questionsToUpload = questions.map(q => ({
                text: q.text.trim(),
                type: q.type,
                subject: q.subject,
                points: q.points,
                options: q.type === 'MCQ' ? q.options.map(opt => opt.trim()) : [],
                correct_answer: q.type === 'MCQ' ? q.correctAnswer : '',
                topic: q.topic.trim() || q.subject,
                source: 'manual_upload',
                source_file: 'Manual Entry',
                created_at: new Date().toISOString()
            }));

            console.log('Uploading questions:', questionsToUpload);

            // Save to Firestore via your backend API
            const response = await fetch('http://localhost:8088/api/v1/questions/manual-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questions: questionsToUpload,
                    subject: questions[0].subject // Use first question's subject for batch
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to upload questions');
            }

            const result = await response.json();
            console.log('Upload result:', result);

            setSuccess(`Successfully uploaded ${questionsToUpload.length} questions to the question bank!`);

            // Reset form after successful upload
            setQuestions([{
                id: 1,
                text: '',
                type: 'MCQ',
                subject: '',
                points: 2,
                options: ['', '', '', ''],
                correctAnswer: 'A',
                topic: ''
            }]);

        } catch (err) {
            console.error('Upload error:', err);
            setError(`Upload failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const clearAll = () => {
        setQuestions([{
            id: 1,
            text: '',
            type: 'MCQ',
            subject: '',
            points: 2,
            options: ['', '', '', ''],
            correctAnswer: 'A',
            topic: ''
        }]);
        setError('');
        setSuccess('');
    };

    const getTotalPoints = () => {
        return questions.reduce((total, q) => total + (q.points || 0), 0);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1 }} />
                    Manual Question Upload
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Create and upload custom questions directly to the question bank
                </Typography>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left Column - Questions Form */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6">
                                    Questions ({questions.length})
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={addNewQuestion}
                                        variant="outlined"
                                    >
                                        Add Question
                                    </Button>
                                    <Button
                                        startIcon={<ClearIcon />}
                                        onClick={clearAll}
                                        variant="outlined"
                                        color="secondary"
                                    >
                                        Clear All
                                    </Button>
                                </Stack>
                            </Box>

                            {questions.map((question, index) => (
                                <Paper key={question.id} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Typography variant="h6" color="primary">
                                            Question {index + 1}
                                        </Typography>
                                        {questions.length > 1 && (
                                            <IconButton
                                                onClick={() => removeQuestion(question.id)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Box>

                                    <Grid container spacing={2}>
                                        {/* Question Text */}
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Question Text"
                                                value={question.text}
                                                onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                                fullWidth
                                                multiline
                                                rows={3}
                                                required
                                                placeholder="Enter your question here..."
                                            />
                                        </Grid>

                                        {/* Question Type and Subject */}
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Question Type</InputLabel>
                                                <Select
                                                    value={question.type}
                                                    label="Question Type"
                                                    onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                                                >
                                                    {questionTypes.map(type => (
                                                        <MenuItem key={type.value} value={type.value}>
                                                            {type.label} ({type.points} pts)
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Subject *"
                                                value={question.subject}
                                                onChange={(e) => updateQuestion(question.id, 'subject', e.target.value)}
                                                fullWidth
                                                required
                                                placeholder="e.g., Mathematics, Physics, Statistics"
                                                helperText="Type the subject name exactly as you want it to appear"
                                            />
                                        </Grid>

                                        {/* Topic and Points */}
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Topic (Optional)"
                                                value={question.topic}
                                                onChange={(e) => updateQuestion(question.id, 'topic', e.target.value)}
                                                fullWidth
                                                placeholder="e.g., Algebra, Mechanics, Organic Chemistry"
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Points"
                                                value={question.points}
                                                onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 0)}
                                                type="number"
                                                fullWidth
                                                InputProps={{ inputProps: { min: 1, max: 20 } }}
                                            />
                                        </Grid>

                                        {/* MCQ Options */}
                                        {question.type === 'MCQ' && (
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 2 }} />
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Multiple Choice Options
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    {question.options.map((option, optIndex) => (
                                                        <Grid item xs={12} sm={6} key={optIndex}>
                                                            <TextField
                                                                label={`Option ${String.fromCharCode(65 + optIndex)}`}
                                                                value={option}
                                                                onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                                                fullWidth
                                                                required
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <Chip
                                                                            label={String.fromCharCode(65 + optIndex)}
                                                                            color={question.correctAnswer === String.fromCharCode(65 + optIndex) ? "primary" : "default"}
                                                                            variant={question.correctAnswer === String.fromCharCode(65 + optIndex) ? "filled" : "outlined"}
                                                                            onClick={() => updateQuestion(question.id, 'correctAnswer', String.fromCharCode(65 + optIndex))}
                                                                            clickable
                                                                        />
                                                                    )
                                                                }}
                                                            />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                                    Click on the letter to set as correct answer
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column - Summary and Actions */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ position: 'sticky', top: 100 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Upload Summary
                            </Typography>

                            <Stack spacing={2} sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography>Total Questions:</Typography>
                                    <Typography fontWeight="bold">{questions.length}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography>Total Points:</Typography>
                                    <Typography fontWeight="bold">{getTotalPoints()}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography>Question Types:</Typography>
                                    <Box>
                                        {Array.from(new Set(questions.map(q => q.type))).map(type => (
                                            <Chip
                                                key={type}
                                                label={type}
                                                size="small"
                                                sx={{ ml: 0.5 }}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                startIcon={<SaveIcon />}
                                onClick={uploadQuestions}
                                disabled={loading || questions.length === 0}
                                sx={{ mb: 2 }}
                            >
                                {loading ? 'Uploading...' : `Upload ${questions.length} Questions`}
                            </Button>

                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                                Questions will be saved to Firestore and added to the question bank
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherUploadQuestions;