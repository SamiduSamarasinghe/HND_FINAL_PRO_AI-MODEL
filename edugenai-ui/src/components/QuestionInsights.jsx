import { Box, Typography } from '@mui/material'; // Add missing imports
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

const data = {
    labels: ['Algebra', 'Geometry', 'Calculus'],
    datasets: [{
        label: 'Question Frequency',
        data: [45, 30, 25],
        backgroundColor: '#1976d2'
    }]
};

export default function QuestionInsights() {
    return (
        <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Topic Distribution
            </Typography>
            <Bar
                data={data}
                options={{
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } } // Add this for better chart scaling
                }}
            />
        </Box>
    );
}