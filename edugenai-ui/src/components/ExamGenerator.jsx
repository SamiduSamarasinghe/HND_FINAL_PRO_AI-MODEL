import { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';

export default function ExamGenerator() {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');

    return (
        <Box sx={{ p: 3, border: '1px solid #eee', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Mock Exam Generator</Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Topic</InputLabel>
                <Select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    label="Topic"
                >
                    <MenuItem value="Algebra">Algebra</MenuItem>
                    <MenuItem value="Geometry">Geometry</MenuItem>
                    <MenuItem value="Calculus">Calculus</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    label="Difficulty"
                >
                    <MenuItem value="Easy">Easy</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Hard">Hard</MenuItem>
                </Select>
            </FormControl>

            <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => alert(`Generating ${difficulty} exam on ${topic || 'any topic'}`)}
            >
                GENERATE EXAM
            </Button>
        </Box>
    );
}