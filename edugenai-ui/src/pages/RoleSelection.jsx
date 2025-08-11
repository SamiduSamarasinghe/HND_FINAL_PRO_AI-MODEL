import React from 'react';
import { Box, Button, Typography, Container, useTheme } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom'; // Add this import

const RoleSelection = () => {
    const theme = useTheme();
    const navigate = useNavigate(); // Add this hook

    // Add click handlers
    const handleStudentClick = () => {
        navigate('/student');
    };

    const handleTeacherClick = () => {
        navigate('/teacher');
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f8f9fa',
            p: 2,

            backkgroundImage: 'url(pngtree-online-education-3d-render-of-a-computer-on-a-wooden-table-image_3792188.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            // Optional overlay to improve text readability:
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)', // White overlay with 70% opacity
                zIndex: 0
            }
        }}>
            <Container maxWidth="md" sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                <Typography variant="h3" gutterBottom sx={{
                    fontWeight: 'bold',
                    mb: 4,
                    color: theme.palette.primary.main
                }}>
                    EduGen-AI
                </Typography>

                <Typography variant="h5" gutterBottom sx={{
                    mb: 6,
                    color: theme.palette.text.primary
                }}>
                    Choose your role to continue
                </Typography>

                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 6,
                    width: '100%',
                    justifyContent: 'center',
                    alignItems: 'center' // Ensures equal height alignment
                }}>
                    {/* Student Portal Box */}
                    <Box sx={{
                        bgcolor: 'white',
                        p: 5,
                        borderRadius: 4, // Increased border radius
                        border: '2px solid #e0e0e0', // Thicker border
                        width: { xs: '100%', md: 400 }, // Wider boxes
                        maxWidth: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            border: '3px solid black', // Thicker border on hover
                            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)'
                        }
                    }}>
                        <Box sx={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            bgcolor: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 4
                        }}>
                            <MenuBookIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />
                        </Box>

                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Student Portal
                        </Typography>

                        <Typography variant="body1" sx={{
                            mb: 4,
                            color: theme.palette.text.secondary,
                            textAlign: 'center',
                            fontSize: '1.1rem' // Larger description text
                        }}>
                            Access your personalized study materials, take mock exams, and track your progress with AI-powered insights.
                        </Typography>

                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleStudentClick} // Add this line
                            sx={{
                                border: '2px solid gray',
                                color: 'black',
                                py: 1.5,
                                fontSize: '1rem',
                                '&:hover': {
                                    bgcolor: 'black',
                                    color: 'white',
                                    borderColor: 'black'
                                }
                            }}
                        >
                            CONTINUE AS STUDENT
                        </Button>
                    </Box>

                    {/* Teacher Portal Box */}
                    <Box sx={{
                        bgcolor: 'white',
                        p: 5,
                        borderRadius: 4,
                        border: '2px solid #e0e0e0',
                        width: { xs: '100%', md: 400 },
                        maxWidth: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            border: '3px solid black',
                            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)'
                        }
                    }}>
                        <Box sx={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            bgcolor: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 4
                        }}>
                            <SchoolIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />
                        </Box>

                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Teacher Portal
                        </Typography>

                        <Typography variant="body1" sx={{
                            mb: 4,
                            color: theme.palette.text.secondary,
                            textAlign: 'center',
                            fontSize: '1.1rem'
                        }}>
                            Create and manage exam papers, monitor student progress, and utilize AI tools for educational content.
                        </Typography>

                        <Button
                            variant="outlined"
                            fullWidth
                            onClick={handleTeacherClick} // Add this line
                            sx={{
                                border: '2px solid gray',
                                color: 'black',
                                py: 1.5,
                                fontSize: '1rem',
                                '&:hover': {
                                    bgcolor: 'black',
                                    color: 'white',
                                    borderColor: 'black'
                                }
                            }}
                        >
                            CONTINUE AS TEACHER
                        </Button>

                    </Box>
                </Box>

                {/* Footer with time and date */}
                <Box sx={{
                    mt: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: theme.palette.text.secondary
                }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>21:38</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>05/08/2025</Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default RoleSelection;