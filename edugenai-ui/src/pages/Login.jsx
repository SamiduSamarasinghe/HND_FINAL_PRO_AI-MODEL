import { useState } from 'react';
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
    Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';

// Your Firebase config
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
const db = getFirestore(app);

const defaultTheme = createTheme();

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

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

                // Update last login timestamp in Firestore
                try {
                    await updateDoc(doc(db, 'user-data', user.uid), {
                        lastLogin: new Date()
                    });
                } catch (firestoreError) {
                    console.log('User document might not exist yet, continuing with login...');
                }

                console.log('User logged in successfully:', user);
                navigate('/select-role');
            } else {
                // Register new user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Store user data in Firestore 'user-data' collection
                await setDoc(doc(db, 'user-data', user.uid), {
                    email: email,
                    createdAt: new Date(),
                    uid: user.uid,
                    role: '',
                    profileCompleted: false,
                    lastLogin: new Date()
                });

                console.log('User registered and data saved to Firestore');
                navigate('/select-role');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            let errorMessage = 'An error occurred during authentication';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered. Please login instead.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please use a stronger password.';
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
                default:
                    errorMessage = error.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider) => {
        console.log(`Social login with ${provider}`);
        // For now, just navigate to select-role
        navigate('/select-role');
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email address first.');
            return;
        }

        try {
            // Firebase will send a password reset email
            // You'll need to import and use sendPasswordResetEmail
            // import { sendPasswordResetEmail } from 'firebase/auth';
            // await sendPasswordResetEmail(auth, email);
            
            alert(`Password reset email would be sent to: ${email}\n\n(Password reset functionality needs to be implemented)`);
        } catch (error) {
            setError('Error sending password reset email: ' + error.message);
        }
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
                            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
                        </Button>
                        <Divider sx={{ my: 2 }}>Or</Divider>
                        <Stack spacing={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FacebookIcon />}
                                sx={{ textTransform: 'none' }}
                                onClick={() => handleSocialLogin('facebook')}
                                disabled={loading}
                            >
                                {isLogin ? 'Login with Facebook' : 'Sign up with Facebook'}
                            </Button>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<GoogleIcon />}
                                sx={{ textTransform: 'none' }}
                                onClick={() => handleSocialLogin('google')}
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
                            ExamPrep AI
                        </Link>{' '}
                        {new Date().getFullYear()}
                    </Typography>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default Login;