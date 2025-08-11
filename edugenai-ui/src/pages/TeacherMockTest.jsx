import { useState } from 'react';
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
    FormControlLabel
} from '@mui/material';
import { MenuBook, Psychology, ContentCopy, Download, Class as ClassIcon } from '@mui/icons-material';

const TeacherMockTest = () => {
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [classGroup, setClassGroup] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [questionTypes, setQuestionTypes] = useState({
        mcq: true,
        shortAnswer: true,
        essay: false
    });
    const [questionCount, setQuestionCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTest, setGeneratedTest] = useState(null);

    // Teacher-specific data
    const teacherClasses = [
        { id: 'math101', name: 'Mathematics 101', students: 32 },
        { id: 'physics201', name: 'Physics 201', students: 28 },
        { id: 'advCalc', name: 'Advanced Calculus', students: 24 },
        { id: 'stats', name: 'Statistics', students: 35 }
    ];

    const subjects = {
        mathematics: ['Algebra', 'Calculus', 'Statistics and Probability'],
        physics: ['Mechanics', 'Thermodynamics', 'Quantum Physics', 'Optics', 'Waves'],
        chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry']
    };

    const handleGenerate = () => {
        setIsGenerating(true);

        // Simulate API call delay
        setTimeout(() => {
            setGeneratedTest({
                confidence: 95,
                processingTime: 2.8,
                summary: `This ${difficulty} level exam for ${classGroup} contains ${questionCount} questions on ${topic}`,
                classInfo: teacherClasses.find(c => c.id === classGroup),
                questions: [
                    ...(questionTypes.mcq ?
                        Array(Math.floor(questionCount * 0.6)).fill().map((_, i) => ({
                            type: 'MCQ',
                            text: `Sample MCQ ${i+1} about ${topic} (${difficulty})`,
                            options: ['Option A', 'Option B', 'Option C', 'Option D'],
                            points: 2
                        })) : []),
                    ...(questionTypes.shortAnswer ?
                        Array(Math.floor(questionCount * 0.3)).fill().map((_, i) => ({
                            type: 'Short Answer',
                            text: `Explain ${topic} concept ${i+1} (${difficulty})`,
                            points: 5
                        })) : []),
                    ...(questionTypes.essay ?
                        Array(Math.ceil(questionCount * 0.1)).fill().map((_, i) => ({
                            type: 'Essay',
                            text: `Discuss ${topic} in depth (${difficulty})`,
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
        setClassGroup('');
        setDifficulty('');
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
                                            onChange={(e) => {
                                                setSubject(e.target.value);
                                                setTopic('');
                                            }}
                                        >
                                            <MenuItem value="" disabled>Select subject</MenuItem>
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
                                                <MenuItem value="" disabled>Select topic</MenuItem>
                                                {subjects[subject].map((top) => (
                                                    <MenuItem key={top} value={top}>{top}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}
                                </Grid>

                                {/* Right Column */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Difficulty Level
                                    </Typography>
                                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                        {['easy', 'medium', 'hard'].map((level) => (
                                            <Chip
                                                key={level}
                                                label={`${level.charAt(0).toUpperCase() + level.slice(1)}`}
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
                                </Grid>
                            </Grid>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Psychology />}
                                onClick={handleGenerate}
                                disabled={!subject || !topic || !difficulty || !classGroup}
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
                                Exam Paper for {generatedTest.classInfo.name}
                            </Typography>
                            <Chip
                                label={`Confidence: ${generatedTest.confidence}%`}
                                color="success"
                                variant="outlined"
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <ClassIcon color="primary" sx={{ mr: 1 }} />
                            <Typography>
                                {generatedTest.classInfo.students} students | {questionCount} questions
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