import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Link,
    Avatar,
    CssBaseline,
    Divider,
    Stack,
    Alert,
    CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

//Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAMkknTE3aOMvP6s7daOSRkZMDIeT7ysqQ",
    authDomain: "edugenai-3a8e0.firebaseapp.com",
    projectId: "edugenai-3a8e0",
    storageBucket: "edugenai-3a8e0.appspot.com",
    messagingSenderId: "346092424756",
    appId: "1:346092424756:web:ea8d4ebc59c898b42c8461"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure auth settings to fix COOP issues
auth.settings.appVerificationDisabledForTesting = false;
setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Add these for better Google Auth compatibility
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

const defaultTheme = createTheme();

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const { refreshUserProfile } = useAuth();

    // Check if user is already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in, redirect to role selection
                navigate('/select-role');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        //Validation
        if (!isLogin && password !== confirmPassword) {
            setError("Passwords don't match!");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password should be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                // Login existing user
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                //Check if email is verified (skip for Google OAuth users)
                if (!user.emailVerified && user.providerData[0]?.providerId !== 'google.com') {
                    setError('Please verify your email address before logging in. Check your inbox for the verification link.');
                    await auth.signOut();
                    setLoading(false);
                    return;
                }

                // Update last login timestamp in Firestore
                await updateUserData(user.uid, {lastLogin: new Date()});

                // Refresh user profile in context
                await refreshUserProfile();

                console.log('User logged in successfully:', user);
                navigate('/select-role');
            } else {
                // Register new user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                //Send email verification
                await sendEmailVerification(user);

                //Create user profile in firebase
                await createUserProfile(user.uid, email);

                setSuccessMessage('Registration successful! Please check your email for verification link before logging in.');
                setIsLogin(true); //Switch to log in mode
                setEmail('');
                setPassword('');
                setConfirmPassword('');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            //Check if user exists in firestore, if not create profile
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                await createUserProfile(user.uid, user.email);
            } else {
                await updateUserData(user.uid, {lastLogin: new Date()});
            }

            // Refresh user profile in context
            await refreshUserProfile();

            console.log('Google login successful, navigating to role selection');
            navigate('/select-role');

        } catch (error) {
            console.error('Google login error:', error);

            // Handle specific Google auth errors
            if (error.code === 'auth/popup-blocked') {
                setError('Popup was blocked by your browser. Please allow popups for this site.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                setError('Google sign-in was cancelled.');
            } else {
                handleAuthError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage('Password reset email sent! Check your inbox.');
        } catch (error) {
            setError('Error sending password reset email: ' + error.message);
        }
    };

    const createUserProfile = async (userId, email) => {
        const userData = {
            email: email,
            createdAt: new Date(),
            uid: userId,
            role: '',
            profileCompleted: false,
            lastLogin: new Date(),
            emailVerified: false
        };
        await setDoc(doc(db, 'users', userId), userData);
        console.log('User profile created in Firestore');
    };

    const updateUserData = async (userId, data) => {
        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, data, {merge: true});
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    };

    const handleAuthError = (error) => {
        let errorMessage = 'An error occurred during authentication';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Please login instead.';
                break;

            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;

            case 'auth/weak-password':
                errorMessage = 'Password is too weak. please use a stronger password.';
                break;

            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Please sign up first.';
                break;

            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;

            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;

            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;

            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled. Please contact support.';
                break;

            case 'auth/requires-recent-login':
                errorMessage = 'Please log in again to perform this action.';
                break;

            case 'auth/popup-blocked':
                errorMessage = 'Popup was blocked by your browser. Please allow popups for this site.';
                break;

            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign-in was cancelled.';
                break;

            case 'auth/operation-not-supported-in-this-environment':
            case 'auth/auth-domain-config-required':
                errorMessage = 'Authentication configuration error. Please contact support.';
                break;

            default:
                errorMessage = error.message || 'Authentication failed. Please try again.';
        }
        setError(errorMessage);
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert severity="success" sx={{width: '100%', mt: 2}}>
                            {successMessage}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        {!isLogin && (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                id="confirmPassword"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        )}
                        {isLogin && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                                <Link
                                    href="#"
                                    variant="body2"
                                    onClick={handleForgotPassword}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    Forgot password?
                                </Link>
                            </Box>
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : (isLogin ? 'Login' : 'Sign Up')}
                        </Button>
                        <Divider sx={{ my: 2 }}>Or</Divider>
                        <Stack spacing={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<GoogleIcon />}
                                sx={{ textTransform: 'none' }}
                                onClick={handleGoogleLogin}
                                disabled={loading}
                            >
                                {isLogin ? 'Login with Google' : 'Sign up with Google'}
                            </Button>
                        </Stack>
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Link
                                href="#"
                                variant="body2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsLogin(!isLogin);
                                    setError('');
                                    setSuccessMessage('');
                                }}
                                sx={{ cursor: 'pointer' }}
                            >
                                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                            </Link>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ mt: 5 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                        {'© '}
                        <Link color="inherit" href="#">
                            EduGen AI
                        </Link>{' '}
                        {new Date().getFullYear()}
                    </Typography>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default Login;