import { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox
} from '@mui/material';

export default function ExamGenerator() {
    const [topic, setTopic] = useState('Any');
    const [difficulty, setDifficulty] = useState('Medium');

    return (
        <Box sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            backgroundColor: '#f8f9fa'
        }}>
            <Typography variant="h6" sx={{
                fontWeight: 'bold',
                mb: 3,
                color: '#333'
            }}>
                Mock Exam Generator
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel sx={{ color: '#555' }}>Topic</InputLabel>
                <Select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    label="Topic"
                    size="small"
                    sx={{
                        borderRadius: 1,
                        backgroundColor: 'white'
                    }}
                >
                    <MenuItem value="Any">Any</MenuItem>
                    <MenuItem value="Algebra">Algebra</MenuItem>
                    <MenuItem value="Geometry">Geometry</MenuItem>
                    <MenuItem value="Calculus">Calculus</MenuItem>
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel sx={{ color: '#555' }}>Difficulty</InputLabel>
                <Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    label="Difficulty"
                    size="small"
                    sx={{
                        borderRadius: 1,
                        backgroundColor: 'white'
                    }}
                >
                    <MenuItem value="Easy">Easy</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Hard">Hard</MenuItem>
                </Select>
            </FormControl>
            <FormControlLabel
                control={<Checkbox defaultChecked/>}
                label="Multiple Choice"
                sx={{mb:2}}
                />
            <FormControlLabel
                control={<Checkbox defaultChecked/> }
                label="Short Answer"
                sx={{mb:2}}
                />
            <FormControlLabel
                control={<Checkbox/>}
                label="Essay"
                sx={{mb:3}}
                />

            <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => alert(`Generating ${difficulty} exam on ${topic}`)}
                sx={{
                    py: 1.5,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    backgroundColor: '#1976d2',
                    borderRadius: 1,
                    '&:hover': {
                        backgroundColor: '#1565c0'
                    }
                }}
            >
                GENERATE EXAM
            </Button>
        </Box>
    );
}