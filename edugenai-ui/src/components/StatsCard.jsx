import { Card, CardContent, Typography } from '@mui/material';

export default function StatsCard({ title, value }) {
    return (
        <Card sx={{
            textAlign: 'center',
            p: 3,
            borderRadius: 2,
            height: '100%',
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            backgroundColor: '#f8f9fa'
        }}>
            <Typography variant="subtitle1" sx={{
                color: '#555',
                mb: 1,
                fontWeight: '500'
            }}>
                {title}
            </Typography>
            <Typography variant="h4" sx={{
                fontWeight: 'bold',
                color: '#1976d2'
            }}>
                {value}
            </Typography>
        </Card>
    );
}