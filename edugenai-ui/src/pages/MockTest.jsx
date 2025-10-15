import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
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
    FormControlLabel,
    Alert
} from '@mui/material';
import { MenuBook, Psychology, ContentCopy, Download } from '@mui/icons-material';

const MockTest = () => {
    const [subject, setSubject] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [questionTypes, setQuestionTypes] = useState({
        MCQ: true,
        "Short Answer": true,
        Essay: false
    });
    const [questionCount, setQuestionCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTest, setGeneratedTest] = useState(null);
    const [error, setError] = useState('');

    const subjects = [
        "statistics-papers",
        "mathematics",
        "physics",
        "chemistry"
    ];

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
                    difficulty: difficulty,
                    question_types: questionTypes,
                    question_count: questionCount
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

    // In MockTest.jsx and TeacherMockTest.jsx - UPDATE THIS FUNCTION:

    const handleDownloadPDF = async () => {
        try {
            const response = await fetch('http://localhost:8088/api/v1/export/test-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(generatedTest)
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            // Convert response to blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            // Create filename
            const filename = `${generatedTest.subject}_${generatedTest.difficulty}_test.pdf`;
            a.download = filename;

            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('PDF download error:', error);
            alert('Failed to download PDF. Please try again.');
        }
    };

    const resetForm = () => {
        setGeneratedTest(null);
        setSubject('');
        setDifficulty('');
        setError('');
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Generate Mock Test
            </Typography>

            {!generatedTest ? (
                <>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Create customized practice tests with AI-generated questions based on your subject preferences and difficulty level.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <Card sx={{ boxShadow: 3, p: 3, textAlign: 'left' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <MenuBook color="primary" sx={{ fontSize: 32, mr: 2 }} />
                                <Typography variant="h5">Mock Test Generator</Typography>
                            </Box>
                            <Typography color="text.secondary" sx={{ mb: 4 }}>
                                Create customized practice tests based on your subject preferences and difficulty level.
                            </Typography>

                            {isGenerating ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <LinearProgress sx={{ mb: 2 }} />
                                    <Typography>Generating your mock test...</Typography>
                                </Box>
                            ) : (
                                <>
                                    <FormControl fullWidth sx={{ mb: 3 }}>
                                        <InputLabel>Subject</InputLabel>
                                        <Select
                                            value={subject}
                                            label="Subject"
                                            onChange={(e) => setSubject(e.target.value)}
                                        >
                                            <MenuItem value="" disabled>Select a subject</MenuItem>
                                            {subjects.map((sub) => (
                                                <MenuItem key={sub} value={sub}>
                                                    {sub.split('-').map(word =>
                                                        word.charAt(0).toUpperCase() + word.slice(1)
                                                    ).join(' ')}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                        Difficulty Level
                                    </Typography>
                                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                        {[
                                            { level: 'Easy', description: 'Basic concepts' },
                                            { level: 'Medium', description: 'Intermediate level' },
                                            { level: 'Hard', description: 'Advanced concepts' }
                                        ].map((levelInfo) => (
                                            <Chip
                                                key={levelInfo.level}
                                                label={`${levelInfo.level} - ${levelInfo.description}`}
                                                color={
                                                    levelInfo.level === 'Easy' ? 'success' :
                                                        levelInfo.level === 'Medium' ? 'warning' : 'error'
                                                }
                                                onClick={() => setDifficulty(levelInfo.level)}
                                                variant={difficulty === levelInfo.level ? 'filled' : 'outlined'}
                                                sx={{ flex: 1 }}
                                            />
                                        ))}
                                    </Stack>

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

                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<Psychology />}
                                            onClick={handleGenerate}
                                            disabled={!subject || !difficulty}
                                            sx={{ px: 4, py: 1.5 }}
                                        >
                                            Generate Test
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card sx={{ boxShadow: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5">{generatedTest.title}</Typography>
                            <Chip
                                label={`Total Points: ${generatedTest.total_points}`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                        <Typography color="text.secondary" gutterBottom>
                            {generatedTest.total_questions} questions • {generatedTest.difficulty} level
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ position: 'relative' }}>
                            <Typography variant="h6" gutterBottom>
                                Test Summary
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
                                This {generatedTest.difficulty.toLowerCase()} level test contains {generatedTest.total_questions} questions
                                focusing on {generatedTest.subject.replace('-', ' ')} with a total of {generatedTest.total_points} points.
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
                                            color={
                                                question.type === "MCQ" ? "primary" :
                                                    question.type === "Short Answer" ? "secondary" : "info"
                                            }
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={`${index + 1}. ${question.text}`}
                                        secondary={`${question.points} point${question.points !== 1 ? 's' : ''} • ${question.difficulty}`}
                                    />
                                </ListItem>
                            ))}
                        </List>

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={handleDownloadPDF}
                            >
                                Download Test PDF
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={resetForm}
                            >
                                Generate Another
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default MockTest;
