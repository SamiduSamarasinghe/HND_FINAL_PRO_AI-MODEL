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
    FormControlLabel
} from '@mui/material';
import { MenuBook, Psychology, ContentCopy, Download } from '@mui/icons-material';

const MockTest = () => {
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [questionTypes, setQuestionTypes] = useState({
        mcq: true,
        shortAnswer: true,
        essay: false
    });
    const [questionCount, setQuestionCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTest, setGeneratedTest] = useState(null);

    const subjects = {
        mathematics: ['Algebra', 'Calculus', 'Statistics and Probability'],
        physics: ['Mechanics', 'Thermodynamics', 'Quantum Physics', 'Optics', 'Waves'],
        chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry'],
        computerScience: ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems']
    };

    const handleGenerate = () => {
        setIsGenerating(true);

        // Simulate API call delay
        setTimeout(() => {
            setGeneratedTest({
                confidence: 92,
                processingTime: 3.2,
                summary: `This ${difficulty} level mock test contains ${questionCount} questions focusing on ${topic} in ${subject}.`,
                questions: [
                    ...(questionTypes.mcq ?
                        Array(Math.floor(questionCount * 0.6)).fill().map((_, i) => ({
                            type: 'MCQ',
                            text: `Sample multiple choice question ${i+1} about ${topic}`,
                            options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                            points: 2
                        })) : []),
                    ...(questionTypes.shortAnswer ?
                        Array(Math.floor(questionCount * 0.3)).fill().map((_, i) => ({
                            type: 'Short Answer',
                            text: `Sample short answer question ${i+1} about ${topic}`,
                            points: 5
                        })) : []),
                    ...(questionTypes.essay ?
                        Array(Math.ceil(questionCount * 0.1)).fill().map((_, i) => ({
                            type: 'Essay',
                            text: `Sample essay question ${i+1} about ${topic}`,
                            points: 10
                        })) : [])
                ]
            });
            setIsGenerating(false);
        }, 2500);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const resetForm = () => {
        setGeneratedTest(null);
        setSubject('');
        setTopic('');
        setDifficulty('');
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Generate Mock Test
            </Typography>

            {!generatedTest ? (
                <>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Create customized practice tests with AI-generated questions based on your subject preferences, difficulty level, and question types.
                    </Typography>

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
                                            onChange={(e) => {
                                                setSubject(e.target.value);
                                                setTopic('');
                                            }}
                                        >
                                            <MenuItem value="" disabled>Select a subject</MenuItem>
                                            {Object.keys(subjects).map((sub) => (
                                                <MenuItem key={sub} value={sub}>
                                                    {sub.charAt(0).toUpperCase() + sub.slice(1)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {subject && (
                                        <FormControl fullWidth sx={{ mb: 3 }}>
                                            <InputLabel>Topic</InputLabel>
                                            <Select
                                                value={topic}
                                                label="Topic"
                                                onChange={(e) => setTopic(e.target.value)}
                                            >
                                                <MenuItem value="" disabled>Select a topic</MenuItem>
                                                {subjects[subject].map((top) => (
                                                    <MenuItem key={top} value={top}>{top}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                        Difficulty Level
                                    </Typography>
                                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                        {['easy', 'medium', 'hard'].map((level) => (
                                            <Chip
                                                key={level}
                                                label={`${level.charAt(0).toUpperCase() + level.slice(1)} - ${
                                                    level === 'easy' ? 'Basic concepts' :
                                                        level === 'medium' ? 'Intermediate level' : 'Advanced concepts'
                                                }`}
                                                color={
                                                    level === 'easy' ? 'success' :
                                                        level === 'medium' ? 'warning' : 'error'
                                                }
                                                onClick={() => setDifficulty(level)}
                                                variant={difficulty === level ? 'filled' : 'outlined'}
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
                                                    checked={questionTypes.mcq}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, mcq: e.target.checked})}
                                                />
                                            }
                                            label="MCQ (2 pts)"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={questionTypes.shortAnswer}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, shortAnswer: e.target.checked})}
                                                />
                                            }
                                            label="Short Answer (5 pts)"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={questionTypes.essay}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, essay: e.target.checked})}
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
                                            disabled={!subject || !topic || !difficulty}
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
                            <Typography variant="h5">Generated Mock Test</Typography>
                            <Chip
                                label={`Confidence: ${generatedTest.confidence}%`}
                                color="success"
                                variant="outlined"
                            />
                        </Box>
                        <Typography color="text.secondary" gutterBottom>
                            Processed in {generatedTest.processingTime} seconds
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ position: 'relative' }}>
                            <Typography variant="h6" gutterBottom>
                                Test Summary
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(generatedTest.summary)}
                                sx={{ position: 'absolute', right: 0, top: 0 }}
                            >
                                Copy
                            </Button>
                            <Typography paragraph sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                                {generatedTest.summary}
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
                                Download Test
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