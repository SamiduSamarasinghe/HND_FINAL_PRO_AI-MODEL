import { useState, useCallback } from 'react';
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
    Alert
} from '@mui/material';
import { Upload as UploadIcon, InsertDriveFile, ContentCopy } from '@mui/icons-material';

const UploadPapers = () => {
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [subject, setSubject] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setOpenDialog(true);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            setOpenDialog(true);
        }
    }, []);

    const handlePaperTypeSubmit = () => {
        setOpenDialog(false);
        if (file && subject) {
            processFile(file, subject);
        }
    };

    const processFile = async (file, subject) => {
        setIsAnalyzing(true);
        setError('');
        setAnalysisResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const url = `http://localhost:8088/api/v1/pdf-reader?isPaper=true&subject=${encodeURIComponent(subject)}`;

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

        } catch (err) {
            setError(err.message);
            console.error('Upload error:', err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const resetForm = () => {
        setFile(null);
        setSubject('');
        setAnalysisResult(null);
        setError('');
    };

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

                        {/* FIXED: Properly access the message property */}
                        <Typography color="text.secondary" gutterBottom>
                            {analysisResult.message || 'Document processed successfully'}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ position: 'relative' }}>
                            <Typography variant="h6" gutterBottom>
                                Processing Summary
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(analysisResult.message || 'Processing complete')}
                                sx={{ position: 'absolute', right: 0, top: 0 }}
                            >
                                Copy
                            </Button>

                            {/* FIXED: Properly render the processing summary */}
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
                                        <Typography variant="body2" color="text.secondry">
                                            {analysisResult.note}
                                        </Typography>
                                    </Box>
                                )}
                            </Typography>
                        </Box>

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