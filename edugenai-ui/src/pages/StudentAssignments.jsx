import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Stack,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    Upload as UploadIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Block as BlockIcon,
    Description as TextIcon,
    QuestionAnswer as QuestionBankIcon,
    PictureAsPdf as PdfIcon
} from '@mui/icons-material';

const StudentAssignments = () => {
    const { user, userProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [studentClasses, setStudentClasses] = useState([]);

    // Check authentication and role
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/login');
                return;
            }
            if (userProfile?.role !== 'student') {
                navigate('/select-role');
                return;
            }
        }
    }, [user, userProfile, authLoading, navigate]);

    useEffect(() => {
        if (user) {
            fetchStudentClasses();
        }
    }, [user]);

    // First, get all classes where this student is enrolled
    const fetchStudentClasses = async () => {
        try {
            const response = await fetch('http://localhost:8088/api/v1/student/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentEmail: user.email,
                    studentId: user.uid
                })
            });

            if (response.ok) {
                const data = await response.json();
                setStudentClasses(data.classes || []);
                // Fetch assignments for all classes
                if (data.classes && data.classes.length > 0) {
                    fetchAllAssignments(data.classes);
                } else {
                    setLoading(false);
                }
            } else {
                throw new Error('Failed to fetch student classes');
            }
        } catch (err) {
            console.error('Error fetching student classes:', err);
            setError('Failed to load your classes');
            setLoading(false);
        }
    };

    // Fetch assignments for all classes the student is in
    const fetchAllAssignments = async (classes) => {
        try {
            const allAssignments = [];

            for (const classItem of classes) {
                try {
                    console.log(`Fetching assignments for class: ${classItem.name} (${classItem.id})`);
                    const response = await fetch(`http://localhost:8088/api/v1/student/assignments/${classItem.id}?student_email=${user.email}&student_id=${user.uid}`);

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`Found ${data.assignments?.length || 0} assignments for class ${classItem.name}`);

                        const assignmentsWithClass = (data.assignments || []).map(assignment => ({
                            ...assignment,
                            className: classItem.name,
                            classSubject: classItem.subject
                        }));
                        allAssignments.push(...assignmentsWithClass);
                    } else {
                        console.error(`Failed to fetch assignments for class ${classItem.name}: ${response.status}`);
                    }
                } catch (classError) {
                    console.error(`Error fetching assignments for class ${classItem.name}:`, classError);
                }
            }

            console.log(`Total assignments found: ${allAssignments.length}`);
            setAssignments(allAssignments);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setError('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (assignment) => {
        setSelectedAssignment(assignment);
        setSelectedFile(null);
        setUploadDialogOpen(true);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setError('');
        } else {
            setError('Please select a PDF file');
        }
    };

    const handleSubmitAssignment = async () => {
        if (!selectedFile || !selectedAssignment) return;

        try {
            setUploading(true);
            setError('');

            const formData = new FormData();
            formData.append('assignment_id', selectedAssignment.id);
            formData.append('student_email', user.email);
            formData.append('student_name', user.displayName || 'Student');
            formData.append('student_id', user.uid);
            formData.append('class_id', selectedAssignment.classId);
            formData.append('file', selectedFile);

            const response = await fetch('http://localhost:8088/api/v1/student/submit-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to submit assignment');
            }

            const result = await response.json();
            setSuccess('Assignment submitted successfully!');
            setUploadDialogOpen(false);
            fetchStudentClasses(); // Refresh assignments
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const getStatusChip = (assignment) => {
        if (assignment.submission) {
            return (
                <Chip
                    icon={<CheckCircleIcon />}
                    label="Submitted"
                    color="success"
                    size="small"
                />
            );
        } else if (assignment.is_late) {
            return (
                <Chip
                    icon={<BlockIcon />}
                    label="Late"
                    color="error"
                    size="small"
                />
            );
        } else {
            return (
                <Chip
                    icon={<ScheduleIcon />}
                    label="Pending"
                    color="warning"
                    size="small"
                />
            );
        }
    };

    const getAssignmentTypeIcon = (type) => {
        switch (type) {
            case 'text':
                return <TextIcon fontSize="small" />;
            case 'question_bank':
                return <QuestionBankIcon fontSize="small" />;
            case 'pdf':
                return <PdfIcon fontSize="small" />;
            default:
                return <AssignmentIcon fontSize="small" />;
        }
    };

    const getAssignmentTypeText = (type) => {
        switch (type) {
            case 'text': return 'Text Assignment';
            case 'question_bank': return 'Question Bank';
            case 'pdf': return 'PDF Assignment';
            default: return 'Assignment';
        }
    };

    const renderAssignmentContent = (assignment) => {
        switch (assignment.type) {
            case 'text':
                return (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {assignment.content || 'No content provided'}
                    </Typography>
                );
            case 'question_bank':
                const questions = assignment.questions || [];
                return (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                            {questions.length} question{questions.length !== 1 ? 's' : ''} from question bank
                        </Typography>
                        {questions.length > 0 && (
                            <List dense sx={{ pl: 2 }}>
                                {questions.slice(0, 3).map((question, index) => (
                                    <ListItem key={index} sx={{ py: 0 }}>
                                        <ListItemText
                                            primary={`${index + 1}. ${question.text?.substring(0, 100)}${question.text?.length > 100 ? '...' : ''}`}
                                            secondary={`Type: ${question.type} • Points: ${question.points || 2}`}
                                        />
                                    </ListItem>
                                ))}
                                {questions.length > 3 && (
                                    <Typography variant="body2" color="text.secondary">
                                        ... and {questions.length - 3} more questions
                                    </Typography>
                                )}
                            </List>
                        )}
                    </Box>
                );
            case 'pdf':
                return (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        PDF Document: {assignment.pdfFile || 'Uploaded file'}
                    </Typography>
                );
            default:
                return null;
        }
    };

    const getDueDateText = (dueDate) => {
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `Due ${Math.abs(diffDays)} days ago`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `Due in ${diffDays} days`;
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                My Assignments
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            {assignments.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="h6" color="text.secondary">
                            No assignments found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            You don't have any assignments yet, or you're not enrolled in any classes.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Stack spacing={2}>
                    {assignments.map((assignment) => (
                        <Card key={assignment.id} variant="outlined">
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {assignment.title}
                                        </Typography>

                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                            <Chip
                                                icon={getAssignmentTypeIcon(assignment.type)}
                                                label={getAssignmentTypeText(assignment.type)}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                {assignment.className} • {assignment.classSubject}
                                            </Typography>
                                        </Stack>

                                        {renderAssignmentContent(assignment)}

                                        <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
                                            {getStatusChip(assignment)}
                                            <Typography variant="body2" color="text.secondary">
                                                {getDueDateText(assignment.dueDate)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </Typography>
                                        </Stack>

                                        {assignment.submission && (
                                            <Box sx={{ mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                                                <Typography variant="body2" color="success.dark">
                                                    ✓ Submitted on {new Date(assignment.submission.submittedAt).toLocaleDateString()}
                                                </Typography>
                                                {assignment.submission.grade && (
                                                    <Typography variant="body2" color="success.dark" fontWeight="bold">
                                                        Grade: {assignment.submission.grade}
                                                    </Typography>
                                                )}
                                                {assignment.submission.teacherFeedback && (
                                                    <Typography variant="body2" color="success.dark">
                                                        Feedback: {assignment.submission.teacherFeedback}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                    <Box>
                                        {assignment.can_submit && (
                                            <Button
                                                variant="contained"
                                                startIcon={<UploadIcon />}
                                                onClick={() => handleFileSelect(assignment)}
                                            >
                                                Submit PDF
                                            </Button>
                                        )}
                                        {assignment.is_late && !assignment.submission && (
                                            <Button variant="outlined" disabled>
                                                Submission Closed
                                            </Button>
                                        )}
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}

            {/* Upload Dialog */}
            <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Submit Assignment: {selectedAssignment?.title}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2">
                            Due Date: {selectedAssignment && new Date(selectedAssignment.dueDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Class: {selectedAssignment?.className}
                        </Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadIcon />}
                            fullWidth
                        >
                            Select PDF File
                            <input
                                type="file"
                                hidden
                                accept=".pdf"
                                onChange={handleFileUpload}
                            />
                        </Button>
                        {selectedFile && (
                            <Typography variant="body2" color="primary">
                                Selected: {selectedFile.name}
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitAssignment}
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? 'Submitting...' : 'Submit Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StudentAssignments;