import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, CircularProgress, Typography, Button, Container } from '@mui/material';

const ProtectedRoute = ({ children, requireEmailVerification = true}) => {
    const { user, loading, isEmailVerified, userProfile } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{from: location}} replace />;
    }

    if (requireEmailVerification && !isEmailVerified) {
        return (
            <Container maxWidth="sm" sx={{mt: 8, textAlign: 'center'}}>
                <Typography variant="h5" gutterBottom>
                    Email Verification Required
                </Typography>
                <Typography variant="body1" sx={{mb: 3}}>
                    Please verify your email address before accessing the application.
                    Check your in box for the verification link.
                </Typography>
                <Button variant="contained" onClick={() => window.location.reload()}>
                    I've Verified My Email
                </Button>
            </Container>
        );
    }

    if (!userProfile?.role && location.pathname !== '/select-role') {
        return <Navigate to="/select-role" replace />;
    }
    return children;
};
export default ProtectedRoute;