import { Card, CardContent, Grid, Typography, LinearProgress, Box } from '@mui/material';

const ClassOverview = ({ classes }) => {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Class Overview
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Performance summary across all your classes
                </Typography>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                    {classes.map((cls, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        {cls.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {cls.students} students • {cls.papers} papers
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <Box sx={{ width: '100%', mr: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={parseInt(cls.avgScore)}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {cls.avgScore}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default ClassOverview;