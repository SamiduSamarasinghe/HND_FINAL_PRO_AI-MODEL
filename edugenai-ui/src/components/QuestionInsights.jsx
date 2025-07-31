import { Chip, Stack, Typography } from '@mui/material';

export default function QuestionInsights() {
    return (
        <>
            <Typography variant="h6">Question Insights</Typography>
            <Typography>Topics</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {['Algebra', 'Geometry', 'Calculus'].map(topic => (
                    <Chip key={topic} label={topic} />
                ))}
            </Stack>
            <Typography>Difficulty</Typography>
            <Stack direction="row" spacing={1}>
                {['Easy', 'Medium', 'Hard'].map(level => (
                    <Chip key={level} label={level} variant="outlined" />
                ))}
            </Stack>
        </>
    );
}