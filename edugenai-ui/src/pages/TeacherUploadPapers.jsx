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
    Alert,
    Grid,
    Paper
} from '@mui/material';
import {
    Upload as UploadIcon,
    InsertDriveFile,
    ContentCopy,
    School as SchoolIcon,
    Analytics as AnalyticsIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const TeacherUploadPapers = () => {
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [subject, setSubject] = useState("");
    const [paperType, setPaperType] = useState("pastPaper"); // "pastPaper" or "lectureNotes"
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');
    const [uploadHistory, setUploadHistory] = useState([]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setOpenDialog(true);
        } else {
            setError('Please select a PDF file');
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            setOpenDialog(true);
        } else {
            setError('Please drop a PDF file');
        }
    }, []);

    const handlePaperTypeSubmit = () => {
        setOpenDialog(false);
        if (file && subject) {
            processFile(file, subject, paperType);
        }
    };

    const processFile = async (file, subject, type) => {
        setIsAnalyzing(true);
        setError('');
        setAnalysisResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Determine if it's a past paper or lecture notes
            const isPaper = type === "pastPaper";

            const url = `http://localhost:8088/api/v1/pdf-reader?isPaper=${isPaper}&subject=${encodeURIComponent(subject)}`;
            console.log('Uploading to:', url);

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
            console.log('Upload result:', result);

            // Add to upload history
            const uploadRecord = {
                id: Date.now(),
                filename: file.name,
                subject: subject,
                type: type,
                result: result,
                timestamp: new Date().toISOString(),
                status: 'success'
            };

            setUploadHistory(prev => [uploadRecord, ...prev.slice(0, 4)]); // Keep last 5 records
            setAnalysisResult(result);

        } catch (err) {
            setError(err.message);
            console.error('Upload error:', err);

            // Add failed upload to history
            const uploadRecord = {
                id: Date.now(),
                filename: file.name,
                subject: subject,
                type: paperType,
                error: err.message,
                timestamp: new Date().toISOString(),
                status: 'error'
            };
            setUploadHistory(prev => [uploadRecord, ...prev.slice(0, 4)]);
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
        setPaperType('pastPaper');
        setAnalysisResult(null);
        setError('');
    };

    const getMessageText = (result) => {
        if (!result || !result.message) return 'Document processed successfully';

        if (typeof result.message === 'object') {
            return result.message.message || JSON.stringify(result.message);
        }

        return result.message;
    };

    const getUploadStats = () => {
        const total = uploadHistory.length;
        const successful = uploadHistory.filter(u => u.status === 'success').length;
        const papers = uploadHistory.filter(u => u.type === 'pastPaper').length;
        const lectures = uploadHistory.filter(u => u.type === 'lectureNotes').length;

        return { total, successful, papers, lectures };
    };

    const stats = getUploadStats();

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Upload Educational Content
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Upload past papers or lecture notes to extract questions and build your question bank.
            </Typography>

            <Grid container spacing={4}>
                {/* Left Column - Upload Section */}
                <Grid item xs={12} md={8}>
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
                            <CardContent sx={{ textAlign: 'center' }}>
                                <InsertDriveFile sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />

                                <Typography variant="h5" gutterBottom>
                                    Upload PDF Content
                                </Typography>

                                <Typography color="text.secondary" sx={{ mb: 3 }}>
                                    Drop your PDF file here or click to browse<br />
                                    <Typography component="span" variant="caption">
                                        Supports PDF files up to 50MB
                                    </Typography>
                                </Typography>

                                {error && (
                                    <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                                        {error}
                                    </Alert>
                                )}

                                <input
                                    accept=".pdf"
                                    style={{ display: 'none' }}
                                    id="pdf-upload-teacher"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="pdf-upload-teacher">
                                    <Button
                                        variant="contained"
                                        component="span"
                                        startIcon={<UploadIcon />}
                                        size="large"
                                        disabled={isAnalyzing}
                                    >
                                        {isAnalyzing ? 'Processing...' : 'Select PDF File'}
                                    </Button>
                                </label>

                                {isAnalyzing && (
                                    <Box sx={{ mt: 3 }}>
                                        <LinearProgress />
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Analyzing document and extracting questions...
                                        </Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card sx={{ boxShadow: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h5" gutterBottom>
                                            Upload Successful
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                            <Chip
                                                label={`Subject: ${analysisResult.subject}`}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={`Type: ${paperType === 'pastPaper' ? 'Past Paper' : 'Lecture Notes'}`}
                                                color="secondary"
                                                variant="outlined"
                                            />
                                        </Stack>
                                    </Box>
                                    <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                                </Box>

                                <Typography color="text.secondary" gutterBottom>
                                    {getMessageText(analysisResult)}
                                </Typography>

                                <Divider sx={{ my: 3 }} />

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

                                    <Paper sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Questions Processed
                                                </Typography>
                                                <Typography variant="h4" color="primary.main">
                                                    {analysisResult.questions_processed || 0}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    AI Generated Questions
                                                </Typography>
                                                <Typography variant="h4" color="secondary.main">
                                                    {analysisResult.ai_generated_questions || 0}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Existing Questions
                                                </Typography>
                                                <Typography variant="h6">
                                                    {analysisResult.existing_questions || 0}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Valid Questions
                                                </Typography>
                                                <Typography variant="h6">
                                                    {analysisResult.valid_questions || 0}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        {analysisResult.note && (
                                            <Alert severity="info" sx={{ mt: 2 }}>
                                                {analysisResult.note}
                                            </Alert>
                                        )}
                                    </Paper>
                                </Box>

                                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                                    <Button
                                        variant="contained"
                                        onClick={() => window.location.href = '/teacher/question-bank'}
                                    >
                                        View Question Bank
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={resetForm}
                                    >
                                        Upload Another
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Right Column - Stats and History */}
                <Grid item xs={12} md={4}>
                    {/* Upload Statistics */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <AnalyticsIcon sx={{ mr: 1 }} />
                                Upload Statistics
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Total Uploads</Typography>
                                    <Typography variant="body2" fontWeight="bold">{stats.total}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Successful</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                        {stats.successful}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Past Papers</Typography>
                                    <Typography variant="body2" fontWeight="bold">{stats.papers}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Lecture Notes</Typography>
                                    <Typography variant="body2" fontWeight="bold">{stats.lectures}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Recent Uploads */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Recent Uploads
                            </Typography>
                            {uploadHistory.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No recent uploads
                                </Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {uploadHistory.map((upload) => (
                                        <Paper key={upload.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box>
                                                    <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
                                                        {upload.filename}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {upload.subject} • {upload.type === 'pastPaper' ? 'Past Paper' : 'Lecture Notes'}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={upload.status === 'success' ? 'Success' : 'Failed'}
                                                    size="small"
                                                    color={upload.status === 'success' ? 'success' : 'error'}
                                                    variant="outlined"
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(upload.timestamp).toLocaleDateString()}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialog for Paper Details */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Details</DialogTitle>
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
                        placeholder="e.g., mathematics, physics, statistics-papers"
                        sx={{ mb: 3 }}
                    />

                    <Typography variant="subtitle1" gutterBottom>
                        Content Type
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant={paperType === 'pastPaper' ? 'contained' : 'outlined'}
                            onClick={() => setPaperType('pastPaper')}
                            fullWidth
                        >
                            Past Paper
                        </Button>
                        <Button
                            variant={paperType === 'lectureNotes' ? 'contained' : 'outlined'}
                            onClick={() => setPaperType('lectureNotes')}
                            fullWidth
                        >
                            Lecture Notes
                        </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        {paperType === 'pastPaper'
                            ? 'Extracts existing questions and generates additional MCQs if needed'
                            : 'Generates new questions from lecture content'
                        }
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handlePaperTypeSubmit}
                        disabled={!subject}
                    >
                        Upload & Process
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherUploadPapers;