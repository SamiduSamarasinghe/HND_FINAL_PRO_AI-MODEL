import { Chip, Stack, Typography, Box } from '@mui/material';

export default function QuestionInsights() {
    return (
        <Box>
            <Typography variant="subtitle1" sx={{
                fontWeight: 'bold',
                mb: 2,
                color: '#333'
            }}>
                Topics
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                {['Algebra', 'Geometry', 'Calculus'].map(topic => (
                    <Chip
                        key={topic}
                        label={topic}
                        sx={{
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            fontWeight: '500',
                            borderRadius: 1
                        }}
                    />
                ))}
            </Stack>

            <Typography variant="subtitle1" sx={{
                fontWeight: 'bold',
                mb: 2,
                color: '#333'
            }}>
                Difficulty Levels
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {['Easy', 'Medium', 'Hard'].map(level => (
                    <Chip
                        key={level}
                        label={level}
                        variant="outlined"
                        sx={{
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            fontWeight: '500',
                            borderRadius: 1
                        }}
                    />
                ))}
            </Stack>
        </Box>
    );
}