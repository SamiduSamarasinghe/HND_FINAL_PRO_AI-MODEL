import React, { useState, useEffect } from 'react';
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
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    Download as DownloadIcon,
    Grade as GradeIcon,
    CheckCircle as CheckCircleIcon,
    Schedule as ScheduleIcon,
    Groups as ClassIcon
} from '@mui/icons-material';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const TeacherViewSubmissions = () => {
    const { user, userProfile, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [classes, setClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [grading, setGrading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    useEffect(() => {
        if (user && userProfile?.role === 'teacher') {
            fetchTeacherClasses();
        }
    }, [user, userProfile]);

    const fetchTeacherClasses = async () => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8088/api/v1/teacher/classes?teacher_id=${user.uid}`);
            if (response.ok) {
                const data = await response.json();
                setClasses(data.classes || []);

                if (data.classes && data.classes.length > 0) {
                    await fetchAllAssignments(data.classes);
                }
            } else {
                throw new Error('Failed to fetch classes');
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllAssignments = async (classesList) => {
        if (!user?.uid) return;

        try {
            const allAssignments = [];

            for (const classItem of classesList) {
                const response = await fetch(`http://localhost:8088/api/v1/teacher/assignments/${classItem.id}?teacher_id=${user.uid}`);
                if (response.ok) {
                    const data = await response.json();
                    const assignmentsWithClass = (data.assignments || []).map(assignment => ({
                        ...assignment,
                        className: classItem.name,
                        classSubject: classItem.subject
                    }));
                    allAssignments.push(...assignmentsWithClass);
                }
            }

            setAssignments(allAssignments);
        } catch (err) {
            console.error('Error fetching assignments:', err);
        }
    };

    const fetchSubmissions = async (assignmentId) => {
        if (!user?.uid) return;

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8088/api/v1/teacher/submissions/${assignmentId}?teacher_id=${user.uid}`);
            if (response.ok) {
                const data = await response.json();
                setSubmissions(data.submissions || []);
                setSelectedAssignment(data.assignment);
                console.log('Submissions received:', data.submissions);
            } else {
                throw new Error('Failed to fetch submissions');
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
            setError('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const downloadSubmission = async (submission) => {
        if (!user?.uid) return;

        try {
            console.log('Downloading submission:', submission.id);
            const response = await fetch(`http://localhost:8088/api/v1/teacher/download-pdf/${submission.id}?teacher_id=${user.uid}`);
            if (response.ok) {
                const data = await response.json();

                const binaryString = atob(data.file_content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = data.file_name || `submission_${user.uid}_${submission.studentName}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                throw new Error('Download failed');
            }
        } catch (err) {
            console.error('Error downloading PDF:', err);
            alert('Failed to download PDF');
        }
    };

    const handleGradeSubmission = (submission) => {
        setSelectedSubmission(submission);
        setGrade(submission.grade || '');
        setFeedback(submission.teacherFeedback || '');
        setGradingDialogOpen(true);
    };

    const submitGrade = async () => {
        if (!selectedSubmission || !grade || !user?.uid) return;

        try {
            setGrading(true);
            const response = await fetch(`http://localhost:8088/api/v1/teacher/grade-submission?teacher_id=${user.uid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    submissionId: selectedSubmission.id,
                    grade: grade,
                    feedback: feedback,
                })
            });

            if (response.ok) {
                setGradingDialogOpen(false);
                if (selectedAssignment) {
                    await fetchSubmissions(selectedAssignment.id);
                }
                setSelectedSubmission(null);
                setGrade('');
                setFeedback('');
                setSuccess('Grade submitted successfully');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Grading failed');
            }
        } catch (err) {
            console.error('Error grading submission:', err);
            setError(err.message);
        } finally {
            setGrading(false);
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

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                View Student Submissions
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Classes and Assignments Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <ClassIcon sx={{ mr: 1 }} />
                        Your Classes & Assignments
                    </Typography>

                    {loading && classes.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : classes.length === 0 ? (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No classes found
                        </Typography>
                    ) : (
                        <Stack spacing={2}>
                            {classes.map((classItem) => {
                                const classAssignments = assignments.filter(a => a.classId === classItem.id);
                                return (
                                    <Paper key={classItem.id} sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            <ClassIcon sx={{ mr: 1, fontSize: 20 }} />
                                            {classItem.name} - {classItem.subject}
                                            <Chip label={`${classAssignments.length} assignments`} size="small" sx={{ ml: 2 }} />
                                        </Typography>

                                        {classAssignments.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                                                No assignments in this class
                                            </Typography>
                                        ) : (
                                            <Stack spacing={1}>
                                                {classAssignments.map((assignment) => (
                                                    <Card key={assignment.id} variant="outlined" sx={{ p: 1 }}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Box>
                                                                <Typography variant="body1" fontWeight="medium">
                                                                    {assignment.title}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {getAssignmentTypeText(assignment.type)} •
                                                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                                </Typography>
                                                            </Box>
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                onClick={() => fetchSubmissions(assignment.id)}
                                                            >
                                                                View Submissions
                                                            </Button>
                                                        </Stack>
                                                    </Card>
                                                ))}
                                            </Stack>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </CardContent>
            </Card>

            {/* Submissions Section */}
            {selectedAssignment && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Submissions for: {selectedAssignment.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {selectedAssignment.className} • {getAssignmentTypeText(selectedAssignment.type)}
                        </Typography>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : submissions.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                No submissions yet for this assignment
                            </Typography>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Student Name</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Submitted On</TableCell>
                                            <TableCell>File</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Grade</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {submissions.map((submission) => (
                                            <TableRow key={submission.id}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {submission.studentName}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {submission.studentEmail}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(submission.submittedAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        startIcon={<DownloadIcon />}
                                                        onClick={() => downloadSubmission(submission)}
                                                        variant="outlined"
                                                    >
                                                        Download PDF
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        icon={submission.status === 'graded' ? <CheckCircleIcon /> : <ScheduleIcon />}
                                                        label={submission.status === 'graded' ? 'Graded' : 'Submitted'}
                                                        color={submission.status === 'graded' ? 'success' : 'warning'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={submission.grade ? "bold" : "normal"}>
                                                        {submission.grade || 'Not graded'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<GradeIcon />}
                                                        onClick={() => handleGradeSubmission(submission)}
                                                    >
                                                        Grade
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Grading Dialog */}
            <Dialog open={gradingDialogOpen} onClose={() => setGradingDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Grade Submission - {selectedSubmission?.studentName}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2">
                            Assignment: {selectedAssignment?.title}
                        </Typography>
                        <TextField
                            label="Grade *"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder="e.g., 85/100, A, Pass"
                            fullWidth
                        />
                        <TextField
                            label="Feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            multiline
                            rows={4}
                            placeholder="Provide feedback to the student..."
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGradingDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={submitGrade}
                        disabled={!grade || grading}
                    >
                        {grading ? 'Grading...' : 'Submit Grade'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherViewSubmissions;

