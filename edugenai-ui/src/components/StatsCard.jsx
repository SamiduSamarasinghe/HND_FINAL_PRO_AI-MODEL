import { Card, CardContent, Typography } from '@mui/material';

export default function StatsCard({ title, value }) {
    return (
        <Card elevation={0} sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
        </Card>
    );
}