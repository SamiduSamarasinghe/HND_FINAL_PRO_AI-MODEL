import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Divider,
    Chip,
    LinearProgress,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Grid,
    FormControlLabel,
    Alert
} from '@mui/material';
import { MenuBook, Psychology, ContentCopy, Download, Class as ClassIcon } from '@mui/icons-material';

const TeacherMockTest = () => {
    const [subject, setSubject] = useState('');
    const [classGroup, setClassGroup] = useState('');
    const [questionTypes, setQuestionTypes] = useState({
        MCQ: true,
        "Short Answer": true,
        Essay: false
    });
    const [questionCount, setQuestionCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTest, setGeneratedTest] = useState(null);
    const [error, setError] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    // Teacher-specific data
    const teacherClasses = [
        { id: 'math101', name: 'Mathematics 101', students: 32 },
        { id: 'physics201', name: 'Physics 201', students: 28 },
        { id: 'advCalc', name: 'Advanced Calculus', students: 24 },
        { id: 'stats', name: 'Statistics', students: 35 }
    ];

    // Fetch subjects from backend
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await fetch('http://localhost:8088/api/v1/subjects');
                if (!response.ok) {
                    throw new Error('Failed to fetch subjects');
                }
                const data = await response.json();
                setSubjects(data.subjects || []);
            } catch (err) {
                console.error('Error fetching subjects:', err);
                setError('Failed to load subjects');
            } finally {
                setLoadingSubjects(false);
            }
        };

        fetchSubjects();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        setGeneratedTest(null);

        try {
            const response = await fetch('http://localhost:8088/api/v1/generate-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: subject,
                    question_types: questionTypes,
                    question_count: questionCount,
                    class_id: classGroup
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate test');
            }

            const testData = await response.json();
            setGeneratedTest(testData);

        } catch (err) {
            setError(err.message);
            console.error('Test generation error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const resetForm = () => {
        setGeneratedTest(null);
        setSubject('');
        setClassGroup('');
        setError('');
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Create New Exam Paper
            </Typography>

            {!generatedTest ? (
                <Card sx={{ boxShadow: 3, p: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <MenuBook color="primary" sx={{ fontSize: 32, mr: 2 }} />
                            <Typography variant="h5">Exam Paper Generator</Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {isGenerating ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <LinearProgress sx={{ mb: 2 }} />
                                <Typography>Generating exam questions...</Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={3}>
                                {/* Left Column */}
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth sx={{ mb: 3 }}>
                                        <InputLabel>Class</InputLabel>
                                        <Select
                                            value={classGroup}
                                            label="Class"
                                            onChange={(e) => setClassGroup(e.target.value)}
                                        >
                                            <MenuItem value="" disabled>Select a class</MenuItem>
                                            {teacherClasses.map((cls) => (
                                                <MenuItem key={cls.id} value={cls.id}>
                                                    {cls.name} ({cls.students} students)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth sx={{ mb: 3 }}>
                                        <InputLabel>Subject</InputLabel>
                                        <Select
                                            value={subject}
                                            label="Subject"
                                            onChange={(e) => setSubject(e.target.value)}
                                            disabled={loadingSubjects}
                                        >
                                            <MenuItem value="" disabled>
                                                {loadingSubjects ? "Loading subjects..." : "Select subject"}
                                            </MenuItem>
                                            {subjects.map((sub) => (
                                                <MenuItem key={sub.id} value={sub.id}>
                                                    {sub.name} ({sub.total_questions} questions)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* Right Column */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Question Types
                                    </Typography>
                                    <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={questionTypes.MCQ}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, MCQ: e.target.checked})}
                                                />
                                            }
                                            label="MCQ (2 pts)"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={questionTypes["Short Answer"]}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, "Short Answer": e.target.checked})}
                                                />
                                            }
                                            label="Short Answer (5 pts)"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={questionTypes.Essay}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, Essay: e.target.checked})}
                                                />
                                            }
                                            label="Essay (10 pts)"
                                        />
                                    </Stack>

                                    <Typography variant="subtitle1" gutterBottom>
                                        Number of Questions: {questionCount}
                                    </Typography>
                                    <Slider
                                        value={questionCount}
                                        onChange={(e, newValue) => setQuestionCount(newValue)}
                                        min={5}
                                        max={50}
                                        step={5}
                                        marks={[
                                            { value: 5, label: '5' },
                                            { value: 25, label: '25' },
                                            { value: 50, label: '50' }
                                        ]}
                                        sx={{ mb: 4 }}
                                    />
                                </Grid>
                            </Grid>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Psychology />}
                                onClick={handleGenerate}
                                disabled={!subject}
                                sx={{ px: 4, py: 1.5 }}
                            >
                                Generate Exam Paper
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <Card sx={{ boxShadow: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5">
                                {generatedTest.title}
                            </Typography>
                            <Chip
                                label={`Total Points: ${generatedTest.total_points}`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <ClassIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>
                                {generatedTest.total_questions} questions
                            </Typography>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ position: 'relative' }}>
                            <Typography variant="h6" gutterBottom>
                                Exam Summary
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(generatedTest.title)}
                                sx={{ position: 'absolute', right: 0, top: 0 }}
                            >
                                Copy
                            </Button>
                            <Typography paragraph sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                                This exam contains {generatedTest.total_questions} questions
                                on {generatedTest.subject.replace('-', ' ')} with a total of {generatedTest.total_points} points.
                            </Typography>
                        </Box>

                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                            Questions ({generatedTest.questions.length})
                        </Typography>
                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {generatedTest.questions.map((question, index) => (
                                <ListItem key={index} divider sx={{ alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 36, pt: 1 }}>
                                        <Chip
                                            label={question.type}
                                            size="small"
                                            color="primary"
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`${index + 1}. ${question.text}`}
                                        secondary={`${question.points} point${question.points !== 1 ? 's' : ''}`}
                                    />
                                </ListItem>
                            ))}
                        </List>

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => alert("PDF generation would be implemented here")}
                            >
                                Download Exam
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => alert("Publishing to class...")}
                            >
                                Publish to Class
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={resetForm}
                            >
                                Create Another
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default TeacherMockTest;