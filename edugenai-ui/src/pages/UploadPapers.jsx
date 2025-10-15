import { useState, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Divider,
    Chip,
    LinearProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import { Upload as UploadIcon, InsertDriveFile, Download, ContentCopy } from '@mui/icons-material';

const UploadPapers = () => {
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [subject, setSubject] = useState("");
    const [year, setYear] = useState("");
    const [institute, setInstitute] = useState("");
    const [paperType, setPaperType] = useState(""); // 🆕 store paper type
    const [openDialog, setOpenDialog] = useState(false); // 🆕 for dialog open/close

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            // open dialog to ask for paper type
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
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        setIsAnalyzing(true);

        // Simulate processing (replace this with API call)
        console.log("File:", file.name);
        console.log("Paper Type:", paperType);
        console.log("Subject:", subject);
        console.log("Year:", year);
        console.log("Institute:", institute);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
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
                            <Typography variant="h5">AI Analysis Results</Typography>
                            <Chip
                                label={`Confidence: ${analysisResult.confidence}%`}
                                color="success"
                                variant="outlined"
                            />
                        </Box>
                        <Typography color="text.secondary" gutterBottom>
                            Processed in {analysisResult.processingTime} seconds
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ position: 'relative' }}>
                            <Typography variant="h6" gutterBottom>
                                Executive Summary
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(analysisResult.summary)}
                                sx={{ position: 'absolute', right: 0, top: 0 }}
                            >
                                Copy
                            </Button>
                            <Typography paragraph sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                                {analysisResult.summary}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* 🆕 Dialog for Paper Type */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Enter Paper Subject (eg.statistics)</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Paper Type"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={paperType}
                        onChange={(e) => setPaperType(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handlePaperTypeSubmit}>Continue</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UploadPapers;
