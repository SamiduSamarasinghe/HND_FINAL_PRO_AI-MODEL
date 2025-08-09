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
    Stack
} from '@mui/material';
import { Upload as UploadIcon, InsertDriveFile, Download, ContentCopy } from '@mui/icons-material';

const UploadPapers = () => {
    const [file, setFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            processFile(selectedFile);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            processFile(droppedFile);
        }
    }, []);

    const processFile = (file) => {
        setFile(file);
        setIsAnalyzing(true);

        // Simulate AI processing
        setTimeout(() => {
            setAnalysisResult({
                confidence: 89,
                processingTime: 2.7,
                summary: "This document contains exam questions focusing on calculus derivatives and algebraic equations, with emphasis on problem-solving techniques.",
                insights: [
                    "15 derivative problems identified (Difficulty: Medium)",
                    "10 algebraic equations (Difficulty: Easy)",
                    "5 complex word problems (Difficulty: Hard)"
                ]
            });
            setIsAnalyzing(false);
        }, 2700);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            {/* Title */}
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                PDF AI Analyzer
            </Typography>

            {/* Description */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                Upload your past papers and get instant AI-powered analysis, summaries and insights. Our advanced AI model processes your content and provides comprehensive reports with actionable recommendations.
            </Typography>

            {!analysisResult ? (
                /* UPLOAD AREA */
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

                        {/* Drag & Drop Text */}
                        <Typography variant="h6" gutterBottom>
                            Drop your PDF file here
                        </Typography>

                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            or click to browse and select a file<br />
                            <Typography component="span" variant="caption">
                                Supports PDF files up to 50MB
                            </Typography>
                        </Typography>

                        {/* Hidden File Input */}
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
                /* ANALYSIS RESULTS */
                <Card sx={{ boxShadow: 3, textAlign: 'left' }}>
                    <CardContent>
                        {/* Header */}
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

                        {/* Executive Summary */}
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

                        {/* Key Insights */}
                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                            Key Insights
                        </Typography>
                        <List>
                            {analysisResult.insights.map((insight, index) => (
                                <ListItem key={index} sx={{ px: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Checkbox edge="start" checked={false} />
                                    </ListItemIcon>
                                    <ListItemText primary={insight} />
                                </ListItem>
                            ))}
                        </List>

                        {/* Actions */}
                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={() => alert("Exporting analysis...")}
                            >
                                Download Report
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => setAnalysisResult(null)}
                            >
                                Analyze Another
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default UploadPapers;