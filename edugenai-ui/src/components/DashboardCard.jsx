import { Card, CardContent, Typography } from '@mui/material';

const DashboardCard = ({ title, value }) => {
    return (
        <Card sx={{ minWidth: 275, height: '100%' }}>
            <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    {title}
                </Typography>
                <Typography variant="h4" component="div">
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default DashboardCard;