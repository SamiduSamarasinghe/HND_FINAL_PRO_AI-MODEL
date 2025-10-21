import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, CircularProgress, Typography, Button, Container } from '@mui/material';

const ProtectedRoute = ({ children, requireEmailVerification = true, requiredRole = null}) => {
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

    //Check if user has selected a role
    if (!userProfile?.role && location.pathname !== '/select-role') {
        return <Navigate to="/select-role" replace />;
    }

    //Check role based access
    if (requiredRole && userProfile?.role !== requiredRole) {
        //Redirect to their specific dashboard based on their actual role
        const redirectPath = userProfile?.role === 'student' ? '/student' : '/teacher';
        return <Navigate to={redirectPath} replace/>;
    }

    return children;
};
export default ProtectedRoute;