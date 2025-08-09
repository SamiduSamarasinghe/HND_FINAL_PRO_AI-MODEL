import { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
    Slider,
    Checkbox,
    FormControlLabel,
    Divider
} from '@mui/material';
import { MenuBook, Psychology } from '@mui/icons-material';

const subjects = {
    mathematics: ['Algebra', 'Calculus', 'Statistics and Probability'],
    physics: ['Mechanics', 'Thermodynamics', 'Quantum Physics', 'Optics', 'Waves'],
    chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry'],
    computerScience: ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems']
};

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

    const handleGenerate = () => {
        console.log({
            subject,
            topic,
            difficulty,
            questionTypes,
            questionCount
        });
        // Will implement actual generation later
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            {/* Header */}
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Generate Mock Test
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Create customized practice tests with AI-generated questions based on your subject preferences, difficulty level, and question types.
            </Typography>

            {/* Generator Card */}
            <Card sx={{ boxShadow: 3, p: 3, textAlign: 'left' }}>
                <CardContent>
                    {/* Title with Icon */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <MenuBook color="primary" sx={{ fontSize: 32, mr: 2 }} />
                        <Typography variant="h5">Mock Test Generator</Typography>
                    </Box>
                    <Typography color="text.secondary" sx={{ mb: 4 }}>
                        Create customized practice tests based on your subject preferences and difficulty level.
                    </Typography>

                    {/* Subject Selection */}
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

                    {/* Topic Selection */}
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

                    {/* Difficulty Level */}
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Difficulty Level
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <Chip
                            label="Easy - Basic concepts"
                            color={difficulty === 'easy' ? 'success' : 'default'}
                            onClick={() => setDifficulty('easy')}
                            variant={difficulty === 'easy' ? 'filled' : 'outlined'}
                            sx={{ flex: 1 }}
                        />
                        <Chip
                            label="Medium - Intermediate level"
                            color={difficulty === 'medium' ? 'warning' : 'default'}
                            onClick={() => setDifficulty('medium')}
                            variant={difficulty === 'medium' ? 'filled' : 'outlined'}
                            sx={{ flex: 1 }}
                        />
                        <Chip
                            label="Hard - Advanced concepts"
                            color={difficulty === 'hard' ? 'error' : 'default'}
                            onClick={() => setDifficulty('hard')}
                            variant={difficulty === 'hard' ? 'filled' : 'outlined'}
                            sx={{ flex: 1 }}
                        />
                    </Stack>

                    {/* Question Types */}
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

                    {/* Number of Questions */}
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

                    {/* Generate Button */}
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
                </CardContent>
            </Card>
        </Box>
    );
};

export default MockTest;