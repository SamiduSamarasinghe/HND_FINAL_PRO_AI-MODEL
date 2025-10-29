import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Divider,
    Chip,
    LinearProgress,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Grid,
    FormControlLabel,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress
} from '@mui/material';
import { MenuBook, Psychology, ContentCopy, Download, Class as ClassIcon, Save, Share } from '@mui/icons-material';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const TeacherMockTest = () => {
    const { user, userProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [subject, setSubject] = useState('');
    const [classGroup, setClassGroup] = useState('');
    const [paperTitle, setPaperTitle] = useState('');
    const [questionTypes, setQuestionTypes] = useState({
        MCQ: true,
        "Short Answer": true,
        Essay: false
    });
    const [questionCount, setQuestionCount] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTest, setGeneratedTest] = useState(null);
    const [error, setError] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [savedPaperTitle, setSavedPaperTitle] = useState('');

    // Authentication check
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
                return;
            }
            if (userProfile?.role !== 'teacher') {
                navigate('/select-role');
                return;
            }
        }
    }, [user, userProfile, authLoading, navigate]);



    // Fetch subjects from backend
    useEffect(() => {
        if (!user?.uid) return;

        const fetchSubjects = async () => {
            try {
                const response = await fetch('http://localhost:8088/api/v1/subjects');
                if (!response.ok) {
                    throw new Error('Failed to fetch subjects');
                }
                const data = await response.json();
                setSubjects(data.subjects || []);
            } catch (err) {
                console.error('Error fetching subjects:', err);
                setError('Failed to load subjects. Please make sure the backend server is running.');
            } finally {
                setLoadingSubjects(false);
            }
        };

        fetchSubjects();
    }, [user]);

    const handleGenerate = async () => {
        if (!user?.uid) {
            setError('User not authenticated');
            return;
        }

        if (!subject) {
            setError('Please select a subject');
            return;
        }

        setIsGenerating(true);
        setError('');
        setGeneratedTest(null);

        try {
            const response = await fetch('http://localhost:8088/api/v1/generate-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: subject,
                    question_types: questionTypes,
                    question_count: questionCount,
                    class_id: classGroup,
                    teacher_id: user.uid // Add teacher ID
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate test');
            }

            const testData = await response.json();

            // Add custom title if provided
            if (paperTitle) {
                testData.title = paperTitle;
            }

            setGeneratedTest(testData);

        } catch (err) {
            setError(err.message);
            console.error('Test generation error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!generatedTest || !user?.uid) return;

        try {
            setIsGenerating(true);
            const response = await fetch('http://localhost:8088/api/v1/export/test-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...generatedTest,
                    teacher_id: user.uid,
                    teacher_email: user.email
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            const filename = `${user.uid}_${generatedTest.subject}_${paperTitle || 'exam'}.pdf`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = filename;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('PDF download error:', error);
            setError('Failed to download PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // You can add a snackbar/toast notification here
        alert('Copied to clipboard!');
    };

    const resetForm = () => {
        setGeneratedTest(null);
        setSubject('');
        setClassGroup('');
        setPaperTitle('');
        setError('');
    };

    const handleSavePaper = async () => {
        if (!user?.uid) {
            setError('User not authenticated');
            return;
        }

        if (!savedPaperTitle.trim()) {
            setError('Please enter a title for the paper');
            return;
        }

        try {
            const paperData = {
                ...generatedTest,
                title: savedPaperTitle,
                class_id: classGroup,
                teacher_id: user.uid,
                teacher_email: user.email,
                saved_at: new Date().toISOString()
            };

            console.log('Saving paper:', paperData);

            alert(`Paper "${savedPaperTitle}" saved successfully!`);
            setSaveDialogOpen(false);
            setSavedPaperTitle('');

        } catch (err) {
            setError('Failed to save paper: ' + err.message);
        }
    };

    const handlePublishToClass = () => {
        if (!classGroup) {
            setError('Please select a class first');
            return;
        }

        const selectedClass = teacherClasses.find(cls => cls.id === classGroup);
        if (selectedClass) {
            alert(`Paper published to ${selectedClass.name}! ${selectedClass.students} students will now have access.`);
        } else {
            alert('Paper published to class!');
        }
    };

    const getQuestionTypeCount = (type) => {
        if (!generatedTest) return 0;
        return generatedTest.questions.filter(q => q.type === type).length;
    };

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                Create New Exam Paper
            </Typography>

            {!generatedTest ? (
                <Card sx={{ boxShadow: 3, p: 3, borderRadius: 2 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <MenuBook color="primary" sx={{ fontSize: 32, mr: 2 }} />
                            <Typography variant="h5">Exam Paper Generator</Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        {isGenerating ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <LinearProgress sx={{ mb: 2 }} />
                                <Typography variant="h6" color="primary">
                                    Generating exam questions...
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This may take a few moments
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={4}>
                                {/* Left Column - Basic Settings */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                                        Paper Settings
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        label="Paper Title (Optional)"
                                        value={paperTitle}
                                        onChange={(e) => setPaperTitle(e.target.value)}
                                        placeholder="e.g., Mathematics Final Exam 2024"
                                        sx={{ mb: 3 }}
                                        helperText="Leave empty to use auto-generated title"
                                    />

                                    <FormControl fullWidth sx={{ mb: 3 }}>
                                        <InputLabel>Subject *</InputLabel>
                                        <Select
                                            value={subject}
                                            label="Subject *"
                                            onChange={(e) => setSubject(e.target.value)}
                                            disabled={loadingSubjects}
                                        >
                                            <MenuItem value="" disabled>
                                                {loadingSubjects ? "Loading subjects..." : "Select subject"}
                                            </MenuItem>
                                            {subjects.map((sub) => (
                                                <MenuItem key={sub.id} value={sub.id}>
                                                    {sub.name} ({sub.total_questions || 0} questions available)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* Right Column - Question Settings */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                                        Question Settings
                                    </Typography>

                                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                                        Question Types
                                    </Typography>
                                    <Stack direction="column" spacing={1} sx={{ mb: 3 }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={questionTypes.MCQ}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, MCQ: e.target.checked})}
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography>Multiple Choice (MCQ)</Typography>
                                                    <Chip label="2 pts" size="small" sx={{ ml: 1 }} color="primary" variant="outlined" />
                                                </Box>
                                            }
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={questionTypes["Short Answer"]}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, "Short Answer": e.target.checked})}
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography>Short Answer</Typography>
                                                    <Chip label="5 pts" size="small" sx={{ ml: 1 }} color="secondary" variant="outlined" />
                                                </Box>
                                            }
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={questionTypes.Essay}
                                                    onChange={(e) => setQuestionTypes({...questionTypes, Essay: e.target.checked})}
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography>Essay Questions</Typography>
                                                    <Chip label="10 pts" size="small" sx={{ ml: 1 }} color="info" variant="outlined" />
                                                </Box>
                                            }
                                        />
                                    </Stack>

                                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                                        Number of Questions: {questionCount}
                                    </Typography>
                                    <Slider
                                        value={questionCount}
                                        onChange={(e, newValue) => setQuestionCount(newValue)}
                                        min={5}
                                        max={50}
                                        step={5}
                                        valueLabelDisplay="auto"
                                        marks={[
                                            { value: 5, label: '5' },
                                            { value: 15, label: '15' },
                                            { value: 25, label: '25' },
                                            { value: 35, label: '35' },
                                            { value: 50, label: '50' }
                                        ]}
                                        sx={{ mb: 4 }}
                                        color="primary"
                                    />
                                </Grid>
                            </Grid>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={resetForm}
                                disabled={isGenerating}
                                sx={{ px: 4, py: 1.5 }}
                            >
                                Clear All
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Psychology />}
                                onClick={handleGenerate}
                                disabled={!subject || isGenerating}
                                sx={{ px: 4, py: 1.5 }}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Exam Paper'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ) : (
                <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
                    <CardContent sx={{ p: 4 }}>
                        {/* Header Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box>
                                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    {generatedTest.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<ClassIcon />}
                                        label={`${generatedTest.total_questions} questions`}
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`Total Points: ${generatedTest.total_points}`}
                                        color="success"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={generatedTest.subject.replace('-', ' ').toUpperCase()}
                                        color="secondary"
                                    />
                                </Box>
                            </Box>
                            <Button
                                size="small"
                                startIcon={<ContentCopy />}
                                onClick={() => copyToClipboard(generatedTest.title)}
                                variant="outlined"
                            >
                                Copy Title
                            </Button>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Question Type Summary */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Question Distribution
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                <Chip
                                    label={`${getQuestionTypeCount('MCQ')} MCQ Questions`}
                                    color="primary"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`${getQuestionTypeCount('Short Answer')} Short Answer`}
                                    color="secondary"
                                    variant="outlined"
                                />
                                <Chip
                                    label={`${getQuestionTypeCount('Essay')} Essay Questions`}
                                    color="info"
                                    variant="outlined"
                                />
                            </Stack>
                        </Box>

                        {/* Questions List */}
                        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                            Questions Preview
                        </Typography>
                        <List sx={{ maxHeight: 500, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                            {generatedTest.questions.map((question, index) => (
                                <ListItem key={index} divider sx={{ alignItems: 'flex-start', py: 2 }}>
                                    <ListItemIcon sx={{ minWidth: 44, pt: 1 }}>
                                        <Chip
                                            label={`${index + 1}`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </ListItemIcon>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                                    {question.text}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                                    <Chip
                                                        label={question.type}
                                                        size="small"
                                                        color={
                                                            question.type === "MCQ" ? "primary" :
                                                                question.type === "Short Answer" ? "secondary" : "info"
                                                        }
                                                    />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {question.points} point{question.points !== 1 ? 's' : ''}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        {question.type === 'MCQ' && question.options && (
                                            <Box sx={{ mt: 1, pl: 2 }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Options:
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    {question.options.map((option, optIndex) => (
                                                        <Grid item xs={12} sm={6} key={optIndex}>
                                                            <Box sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                p: 1,
                                                                borderRadius: 1,
                                                                bgcolor: 'grey.50',
                                                                border: question.correct_answer === String.fromCharCode(65 + optIndex) ? '2px solid' : '1px solid',
                                                                borderColor: question.correct_answer === String.fromCharCode(65 + optIndex) ? 'success.main' : 'grey.300',
                                                            }}>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontWeight: question.correct_answer === String.fromCharCode(65 + optIndex) ? 'bold' : 'normal',
                                                                        color: question.correct_answer === String.fromCharCode(65 + optIndex) ? 'success.main' : 'inherit',
                                                                    }}
                                                                >
                                                                    {String.fromCharCode(65 + optIndex)}) {option}
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}
                                    </Box>
                                </ListItem>
                            ))}
                        </List>

                        {/* Action Buttons */}
                        <Stack direction="row" spacing={2} sx={{ mt: 4, flexWrap: 'wrap', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={handleDownloadPDF}
                                disabled={isGenerating}
                                size="large"
                            >
                                {isGenerating ? 'Generating PDF...' : 'Download Exam PDF'}
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<Save />}
                                onClick={() => setSaveDialogOpen(true)}
                                size="large"
                            >
                                Save Paper
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<Share />}
                                onClick={handlePublishToClass}
                                size="large"
                            >
                                Publish to Class
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={resetForm}
                                size="large"
                            >
                                Create Another
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            {/* Save Paper Dialog */}
            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Save Exam Paper</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Paper Title"
                        fullWidth
                        variant="outlined"
                        value={savedPaperTitle}
                        onChange={(e) => setSavedPaperTitle(e.target.value)}
                        placeholder="Enter a descriptive title for this paper"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSavePaper} variant="contained">
                        Save Paper
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherMockTest;