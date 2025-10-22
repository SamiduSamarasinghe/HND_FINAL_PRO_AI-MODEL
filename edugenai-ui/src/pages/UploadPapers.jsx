import { useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Divider,
    Chip,
    LinearProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress
} from '@mui/material';
import { Upload as UploadIcon, InsertDriveFile, ContentCopy } from '@mui/icons-material';

const UploadPapers = () => {
    const { user, userProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [similarityResult, setSimilarityResult] = useState(null);
    const [subject, setSubject] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');

    // Check authentication and role
    const checkAuth = () => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
                return false;
            }
            if (userProfile?.role !== 'student') {
                navigate('/select-role');
                return false;
            }
        }
        return true;
    };

    const handleFileChange = (e) => {
        if (!checkAuth()) return;

        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setOpenDialog(true);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        if (!checkAuth()) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            setOpenDialog(true);
        }
    }, [user, userProfile, authLoading]);

    const handlePaperTypeSubmit = () => {
        setOpenDialog(false);
        if (file && subject && user) {
            processFile(file, subject);
        }
    };

    const processFile = async (file, subject) => {
        setIsAnalyzing(true);
        setError('');
        setAnalysisResult(null);
        setSimilarityResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', user.uid); // Add user ID for tracking

            // Call similarity analysis first but don't set state yet
            const similarityPromise = callSimilarityAnalysis(file, subject);

            // First API call
            const url = `http://localhost:8088/api/v1/pdf-reader?isPaper=true&subject=${encodeURIComponent(subject)}&user_id=${user.uid}`;
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Upload failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            setAnalysisResult(result);
            console.log('Upload result:', result);

            // Now that first call is complete, wait for similarity analysis and set the result
            const similarityData = await similarityPromise;
            setSimilarityResult(similarityData);

        } catch (err) {
            setError(err.message);
            console.error('Upload error:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const callSimilarityAnalysis = async (file, subject) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', user.uid); // Add user ID

            const similarityUrl = `http://127.0.0.1:8088/api/v1/pdf-reader/analyze?subject=${encodeURIComponent(subject)}&user_id=${user.uid}`;
            const response = await fetch(similarityUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Similarity analysis failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData);
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const similarityData = await response.json();
            console.log('Similarity result:', similarityData);
            return similarityData;

        } catch (err) {
            console.error('Similarity analysis error:', err);
            return null;
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const resetForm = () => {
        setFile(null);
        setSubject('');
        setAnalysisResult(null);
        setSimilarityResult(null);
        setError('');
    };

    // Helper function to safely get message text
    const getMessageText = (result) => {
        if (!result || !result.message) return 'Document processed successfully';

        if (typeof result.message === 'object') {
            return result.message.message || JSON.stringify(result.message);
        }

        return result.message;
    };

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Redirect if not student (handled by useEffect, but return null during redirect)
    if (!user || userProfile?.role !== 'student') {
        return null;
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                PDF AI Analyzer
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                Upload your past papers and get instant AI-powered analysis, summaries, and insights.
            </Typography>

            {!analysisResult ? (
                <Card
                    sx={{
                        border: '2px dashed #e0e0e0',
                        p: 4,
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover'
                        }
                    }}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <CardContent>
                        <InsertDriveFile sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />

                        <Typography variant="h6" gutterBottom>
                            Drop your PDF file here
                        </Typography>

                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            or click to browse and select a file<br />
                            <Typography component="span" variant="caption">
                                Supports PDF files up to 50MB
                            </Typography>
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <input
                            accept=".pdf"
                            style={{ display: 'none' }}
                            id="pdf-upload"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="pdf-upload">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<UploadIcon />}
                                size="large"
                            >
                                Select PDF File
                            </Button>
                        </label>

                        {isAnalyzing && (
                            <Box sx={{ mt: 3 }}>
                                <LinearProgress />
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Analyzing document...
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card sx={{ boxShadow: 3, textAlign: 'left' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5">Upload Successful</Typography>
                            <Chip
                                label={`Subject: ${analysisResult.subject}`}
                                color="success"
                                variant="outlined"
                            />
                        </Box>

                        <Typography color="text.secondary" gutterBottom>
                            {getMessageText(analysisResult)}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ position: 'relative' }}>
                            <Typography variant="h6" gutterBottom>
                                Processing Summary
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(getMessageText(analysisResult))}
                                sx={{ position: 'absolute', right: 0, top: 0 }}
                            >
                                Copy
                            </Button>

                            <Typography paragraph sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                                {analysisResult.questions_processed} questions processed and saved to {analysisResult.subject}
                                {analysisResult.ai_generated_questions > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            label={`${analysisResult.ai_generated_questions} AI-generated questions`}
                                            color="success"
                                            size="small"
                                        />
                                    </Box>
                                )}
                                {analysisResult.note && (
                                    <Box sx={{ mt : 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {analysisResult.note}
                                        </Typography>
                                    </Box>
                                )}
                            </Typography>
                        </Box>

                        {/* Similarity Analysis Results - Only show after main analysis is complete */}
                        {similarityResult && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Similarity Analysis Results
                                </Typography>
                                <Box sx={{ maxHeight: 400, overflow: 'auto', bgcolor: '#f9f9f9', p: 2, borderRadius: 1 }}>
                                    {Object.entries(similarityResult).map(([question, matches], index) => (
                                        <Box key={index} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                {question}
                                            </Typography>
                                            {matches.map((match, matchIndex) => (
                                                <Box key={matchIndex} sx={{ ml: 2, mb: 1, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                                                    <Typography variant="body2">
                                                        <strong>Existing Question:</strong> {match.existing_question}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Source File:</strong> {match.source_file}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Similarity:</strong> {(match.similarity * 100).toFixed(2)}%
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    ))}
                                </Box>
                            </>
                        )}

                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                onClick={resetForm}
                            >
                                Upload Another
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            {/* Dialog for Subject Input */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Enter Paper Details</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Subject Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., statistics-papers, mathematics, physics"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handlePaperTypeSubmit} disabled={!subject}>
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UploadPapers;