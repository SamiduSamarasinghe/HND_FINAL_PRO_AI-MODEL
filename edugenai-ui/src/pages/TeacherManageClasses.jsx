import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Divider,
    Stack,
    Button,
    Grid,
    Paper,
    Tabs,
    Tab,
    Chip,
    Avatar,
    IconButton,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import {
    Groups as ClassIcon,
    Assignment as AssignmentIcon,
    Assignment as ExamIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    PersonAdd as AddStudentIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Description as DescriptionIcon,
    LibraryBooks as QuestionBankIcon,
    PictureAsPdf as PdfIcon,
    Close as CloseIcon,
    Visibility as ViewIcon,
    ArrowBack as BackIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import QuestionBankSelection from './QuestionBankSelection';

const TeacherManageClasses = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('classes');
    const [openDialog, setOpenDialog] = useState(false);
    const [openStudentDialog, setOpenStudentDialog] = useState(false);
    const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
    const [openQuestionBankModal, setOpenQuestionBankModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [viewClassDetails, setViewClassDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [classes, setClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [newClass, setNewClass] = useState({
        name: '',
        subject: '',
        gradeLevel: '10',
        description: ''
    });
    const [newStudent, setNewStudent] = useState({
        name: '',
        email: ''
    });
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        type: 'text',
        content: '',
        dueDate: '',
        questions: [],
        pdfFile: null
    });
    const [assignmentType, setAssignmentType] = useState('text');

    // Fetch classes from backend
    const fetchClasses = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8088/api/v1/teacher/classes');
            if (!response.ok) {
                throw new Error('Failed to fetch classes');
            }
            const data = await response.json();
            const classesData = data.classes || [];
            setClasses(classesData);

            // Fetch assignments for each class
            if (classesData.length > 0) {
                await fetchAssignmentsForClasses(classesData);
            }
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    // Fetch assignments for specific classes
    const fetchAssignmentsForClasses = async (classesList) => {
        try {
            console.log('Fetching assignments for classes:', classesList.map(c => ({ id: c.id, name: c.name })));

            const allAssignments = [];

            for (const cls of classesList) {
                if (!cls.id) {
                    console.log('Skipping class without ID:', cls);
                    continue;
                }

                try {
                    const url = `http://localhost:8088/api/v1/teacher/assignments/${cls.id}`;
                    console.log(`Fetching assignments from: ${url}`);

                    const response = await fetch(url);

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`Assignments response for class ${cls.name}:`, data);

                        const classAssignments = data.assignments || [];
                        console.log(`Found ${classAssignments.length} assignments for class ${cls.name}`);

                        classAssignments.forEach(assignment => {
                            allAssignments.push({
                                ...assignment,
                                className: cls.name,
                                classId: cls.id
                            });
                        });
                    } else if (response.status === 404) {
                        console.log(`No assignments endpoint found for class ${cls.name}, creating empty array`);
                        // If endpoint doesn't exist, create empty assignments array
                    } else {
                        console.log(`Failed to fetch assignments for class ${cls.name}: ${response.status}`);
                    }
                } catch (err) {
                    console.error(`Error fetching assignments for class ${cls.name}:`, err);
                }
            }

            console.log('Total assignments found:', allAssignments);
            setAssignments(allAssignments);

        } catch (err) {
            console.error('Error in fetchAssignmentsForClasses:', err);
        }
    };

    // Fetch assignments when a specific class is viewed
    const fetchAssignmentsForClass = async (classId) => {
        if (!classId) return [];

        try {
            console.log(`Fetching assignments for class: ${classId}`);
            const url = `http://localhost:8088/api/v1/teacher/assignments/${classId}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                return data.assignments || [];
            } else if (response.status === 404) {
                console.log(`No assignments found for class ${classId}`);
                return [];
            } else {
                console.log(`Failed to fetch assignments: ${response.status}`);
                return [];
            }
        } catch (err) {
            console.error(`Error fetching assignments for class ${classId}:`, err);
            return [];
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleCreateClass = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch('http://localhost:8088/api/v1/teacher/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newClass)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create class');
            }

            const result = await response.json();
            setSuccess(`Class "${newClass.name}" created successfully!`);
            setOpenDialog(false);
            setNewClass({ name: '', subject: '', gradeLevel: '10', description: '' });
            fetchClasses(); // This will refresh classes and assignments
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async () => {
        if (!selectedClass) return;

        try {
            setLoading(true);
            setError('');

            const response = await fetch(`http://localhost:8088/api/v1/teacher/classes/${selectedClass.id}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newStudent)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to add student');
            }

            const result = await response.json();
            setSuccess(`Student "${newStudent.name}" added successfully!`);
            setOpenStudentDialog(false);
            setNewStudent({ name: '', email: '' });
            fetchClasses(); // Refresh to get updated student list
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!selectedClass) return;

        try {
            setLoading(true);
            setError('');

            // Prepare assignment data
            const assignmentData = {
                classId: selectedClass.id,
                title: newAssignment.title,
                type: assignmentType,
                content: newAssignment.content,
                dueDate: newAssignment.dueDate,
                questions: newAssignment.questions, // Make sure this is included
                pdfFile: newAssignment.pdfFile ? newAssignment.pdfFile.name : null
            };

            console.log('📤 Sending assignment data:', assignmentData); // Debug log

            const response = await fetch('http://localhost:8088/api/v1/teacher/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(assignmentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create assignment');
            }

            const result = await response.json();
            console.log('✅ Assignment created successfully:', result);

            setSuccess(`Assignment "${newAssignment.title}" created successfully!`);
            setOpenAssignmentDialog(false);
            setNewAssignment({
                title: '',
                type: 'text',
                content: '',
                dueDate: '',
                questions: [],
                pdfFile: null
            });
            setAssignmentType('text');

            // Refresh the assignments
            fetchClasses();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudent = async (classId, studentId) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8088/api/v1/teacher/classes/${classId}/students/${studentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to remove student');
            }

            setSuccess('Student removed successfully!');
            fetchClasses();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openAddStudentDialog = (classItem) => {
        setSelectedClass(classItem);
        setOpenStudentDialog(true);
    };

    const openCreateAssignmentDialog = (classItem) => {
        setSelectedClass(classItem);
        setOpenAssignmentDialog(true);
    };

    const openClassDetails = async (classItem) => {
        setViewClassDetails(classItem);

        // Fetch fresh assignments for this specific class
        const classAssignments = await fetchAssignmentsForClass(classItem.id);
        const assignmentsWithClassInfo = classAssignments.map(assignment => ({
            ...assignment,
            className: classItem.name,
            classId: classItem.id
        }));

        // Update assignments state with fresh data for this class
        const otherAssignments = assignments.filter(a => a.classId !== classItem.id);
        setAssignments([...otherAssignments, ...assignmentsWithClassInfo]);
    };

    const closeClassDetails = () => {
        setViewClassDetails(null);
    };

    const handleAssignmentTypeChange = (type) => {
        setAssignmentType(type);
        setNewAssignment({
            ...newAssignment,
            type: type,
            content: '',
            questions: []
        });
    };

    const handleQuestionsSelected = (selectedQuestions) => {
        setNewAssignment(prev => ({
            ...prev,
            questions: selectedQuestions
        }));
        setOpenQuestionBankModal(false);
        setSuccess(`${selectedQuestions.length} questions added to assignment!`);
    };

    const removeQuestionFromAssignment = (questionId) => {
        setNewAssignment(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== questionId)
        }));
    };

    const openQuestionBankSelection = () => {
        setOpenQuestionBankModal(true);
    };

    const filteredClasses = classes.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get assignments for specific class
    const getClassAssignments = (classId) => {
        return assignments.filter(assignment => assignment.classId === classId);
    };

    // Render assignment content based on type
    // Replace the entire renderAssignmentContent function with this:
    const renderAssignmentContent = (assignment) => {
        console.log('📋 Rendering assignment:', assignment); // Debug log

        switch (assignment.type) {
            case 'text':
                return (
                    <Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                            {assignment.content || 'No content provided'}
                        </Typography>
                        <Chip label="Text Assignment" size="small" color="primary" />
                    </Box>
                );
            case 'question_bank':
                const questions = assignment.questions || [];
                const questionCount = questions.length;
                console.log('❓ Question bank assignment questions:', questions); // Debug log

                return (
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            {questionCount} question{questionCount !== 1 ? 's' : ''} selected from Question Bank
                        </Typography>
                        <Chip label="Question Bank" size="small" color="secondary" />

                        {questionCount > 0 ? (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2">Questions:</Typography>
                                {questions.map((question, index) => (
                                    <Paper key={question.id || `q-${index}`} variant="outlined" sx={{ p: 1, mt: 0.5 }}>
                                        <Typography variant="body2">
                                            {index + 1}. {question.text || 'Question text not available'}
                                        </Typography>
                                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                            <Chip label={question.type || 'MCQ'} size="small" />
                                            <Chip label={`${question.points || 2} pts`} size="small" variant="outlined" />
                                        </Stack>
                                    </Paper>
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                No questions selected
                            </Typography>
                        )}
                    </Box>
                );
            case 'pdf':
                return (
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            PDF Document: {assignment.pdfFile || assignment.pdfUrl || 'Uploaded file'}
                        </Typography>
                        {assignment.pdfUrl && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PdfIcon />}
                                onClick={() => window.open(assignment.pdfUrl, '_blank')}
                                sx={{ mt: 1 }}
                            >
                                View PDF
                            </Button>
                        )}
                        <Chip label="PDF Assignment" size="small" color="info" sx={{ ml: 1 }} />
                    </Box>
                );
            default:
                return (
                    <Typography variant="body2" color="text.secondary">
                        Unknown assignment type: {assignment.type}
                    </Typography>
                );
        }
    };

    // Class Details View
    if (viewClassDetails) {
        const classAssignments = getClassAssignments(viewClassDetails.id);
        console.log('Displaying assignments for class:', viewClassDetails.name, classAssignments);

        return (
            <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
                {/* Back Button and Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={closeClassDetails} sx={{ mr: 2 }}>
                        <BackIcon />
                    </IconButton>
                    <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                        <ClassIcon sx={{ mr: 1, color: 'primary.main' }} />
                        {viewClassDetails.name} - Class Details
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                        Assignments ({classAssignments.length})
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => openCreateAssignmentDialog(viewClassDetails)}
                        >
                            Create Assignment
                        </Button>
                        {/* Add this button */}
                        <Button
                            variant="contained"
                            startIcon={<AssignmentIcon />}
                            onClick={() => navigate('/teacher/submissions')}
                        >
                            View All Submissions
                        </Button>
                    </Stack>
                </Box>

                {/* Class Information */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Class Information</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">Subject</Typography>
                                <Typography variant="body1">{viewClassDetails.subject}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body2" color="text.secondary">Grade Level</Typography>
                                <Typography variant="body1">Grade {viewClassDetails.gradeLevel}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Description</Typography>
                                <Typography variant="body1">
                                    {viewClassDetails.description || 'No description provided'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Students Section */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Students ({viewClassDetails.students?.length || 0})
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddStudentIcon />}
                                onClick={() => openAddStudentDialog(viewClassDetails)}
                            >
                                Add Student
                            </Button>
                        </Box>

                        {viewClassDetails.students && viewClassDetails.students.length > 0 ? (
                            <Grid container spacing={1}>
                                {viewClassDetails.students.map((student) => (
                                    <Grid item xs={12} sm={6} md={4} key={student.id}>
                                        <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                    <PersonIcon />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2">{student.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {student.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRemoveStudent(viewClassDetails.id, student.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                No students in this class yet.
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* Assignments Section */}
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Assignments ({classAssignments.length})
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => openCreateAssignmentDialog(viewClassDetails)}
                            >
                                Create Assignment
                            </Button>
                        </Box>

                        {classAssignments.length > 0 ? (
                            <Stack spacing={2}>
                                {classAssignments.map((assignment, index) => (
                                    <Accordion key={assignment.id || `assignment-${index}`}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Box sx={{ width: '100%' }}>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {assignment.title}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                    <Chip
                                                        label={
                                                            assignment.type === 'text' ? 'Text' :
                                                                assignment.type === 'question_bank' ? 'Question Bank' :
                                                                    assignment.type === 'pdf' ? 'PDF' : 'Unknown'
                                                        }
                                                        size="small"
                                                        color={
                                                            assignment.type === 'text' ? 'primary' :
                                                                assignment.type === 'question_bank' ? 'secondary' : 'info'
                                                        }
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        Due: {new Date(assignment.dueDate).toLocaleDateString()} at {new Date(assignment.dueDate).toLocaleTimeString()}
                                                    </Typography>
                                                    {assignment.created && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Created: {new Date(assignment.created).toLocaleDateString()} at {new Date(assignment.created).toLocaleTimeString()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Divider sx={{ mb: 2 }} />
                                            {renderAssignmentContent(assignment)}
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                No assignments created for this class yet.
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>
        );
    }

    // Rest of the component (tabs, dialogs, etc.) remains the same...
    // [Keep all the existing code for the main view]

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ClassIcon sx={{ mr: 1, color: 'primary.main' }} />
                Manage Classes
            </Typography>

            {/* Alerts */}
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

            {/* Search and Action Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Search classes..."
                        InputProps={{
                            startAdornment: <SearchIcon color="action" />
                        }}
                        sx={{ flex: 1 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        disabled={loading}
                    >
                        New Class
                    </Button>
                    {/* ADD THIS BUTTON */}
                    <Button
                        variant="outlined"
                        startIcon={<AssignmentIcon />}
                        onClick={() => navigate('/teacher/submissions')}
                        disabled={loading}
                    >
                        View Submissions
                    </Button>
                </Stack>
            </Paper>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Classes" value="classes" />
                    <Tab label="Students" value="students" />
                    <Tab label="Assignments" value="assignments" />
                </Tabs>
            </Paper>

            {/* Tab Content - Classes */}
            {activeTab === 'classes' && (
                <Grid container spacing={3}>
                    {loading ? (
                        <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
                            <CircularProgress />
                        </Grid>
                    ) : filteredClasses.length === 0 ? (
                        <Grid item xs={12} sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                {classes.length === 0 ? 'No classes created yet.' : 'No classes match your search.'}
                            </Typography>
                        </Grid>
                    ) : (
                        filteredClasses.map((cls) => (
                            <Grid item xs={12} sm={6} md={4} key={cls.id}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" gutterBottom>{cls.name}</Typography>
                                                <Chip label={cls.subject} size="small" sx={{ mb: 1 }} />
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => openClassDetails(cls)}
                                                color="primary"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </Stack>

                                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                                            Grade {cls.gradeLevel} • {cls.students?.length || 0} students • {getClassAssignments(cls.id).length} assignments
                                        </Typography>

                                        {cls.description && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {cls.description}
                                            </Typography>
                                        )}

                                        <Divider sx={{ my: 1 }} />

                                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<AddStudentIcon />}
                                                onClick={() => openAddStudentDialog(cls)}
                                            >
                                                Add Students
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ExamIcon />}
                                                onClick={() => openCreateAssignmentDialog(cls)}
                                            >
                                                Create Assignment
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* Tab Content - Students */}
            {activeTab === 'students' && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            All Students by Class
                        </Typography>
                        {classes.map((cls) => (
                            <Paper key={cls.id} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <ClassIcon sx={{ mr: 1, fontSize: 20 }} />
                                    {cls.name} ({cls.students?.length || 0} students)
                                </Typography>

                                {cls.students && cls.students.length > 0 ? (
                                    <Grid container spacing={1}>
                                        {cls.students.map((student) => (
                                            <Grid item xs={12} sm={6} md={4} key={student.id}>
                                                <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                                            <PersonIcon />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2">{student.name}</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {student.email}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveStudent(cls.id, student.id)}
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                        No students in this class yet.
                                    </Typography>
                                )}
                            </Paper>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Tab Content - Assignments */}
            {activeTab === 'assignments' && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            All Assignments by Class
                        </Typography>
                        {assignments.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                No assignments created yet.
                            </Typography>
                        ) : (
                            classes.map((cls) => {
                                const classAssignments = getClassAssignments(cls.id);
                                if (classAssignments.length === 0) return null;

                                return (
                                    <Paper key={cls.id} sx={{ p: 2, mb: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            <ClassIcon sx={{ mr: 1, fontSize: 20 }} />
                                            {cls.name} ({classAssignments.length} assignments)
                                        </Typography>
                                        <List>
                                            {classAssignments.map((assignment) => (
                                                <ListItem key={assignment.id} divider>
                                                    <ListItemText
                                                        primary={assignment.title}
                                                        secondary={
                                                            <Box>
                                                                {renderAssignmentContent(assignment)}
                                                                <Typography variant="caption" display="block">
                                                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Paper>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            )}

            {/* New Class Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Class Name *"
                            fullWidth
                            value={newClass.name}
                            onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                            placeholder="e.g., Mathematics 101"
                        />
                        <TextField
                            label="Subject *"
                            fullWidth
                            value={newClass.subject}
                            onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                            placeholder="e.g., Mathematics, Physics, Chemistry"
                        />
                        <FormControl fullWidth>
                            <InputLabel>Grade Level</InputLabel>
                            <Select
                                value={newClass.gradeLevel}
                                label="Grade Level"
                                onChange={(e) => setNewClass({ ...newClass, gradeLevel: e.target.value })}
                            >
                                <MenuItem value="9">Grade 9</MenuItem>
                                <MenuItem value="10">Grade 10</MenuItem>
                                <MenuItem value="11">Grade 11</MenuItem>
                                <MenuItem value="12">Grade 12</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Description (Optional)"
                            fullWidth
                            multiline
                            rows={3}
                            value={newClass.description}
                            onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                            placeholder="Class description, objectives, or notes..."
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateClass}
                        disabled={!newClass.name || !newClass.subject || loading}
                    >
                        {loading ? 'Creating...' : 'Create Class'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Student Dialog */}
            <Dialog open={openStudentDialog} onClose={() => setOpenStudentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Add Student to {selectedClass?.name}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Student Name *"
                            fullWidth
                            value={newStudent.name}
                            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                            placeholder="Full name of the student"
                        />
                        <TextField
                            label="Student Email *"
                            fullWidth
                            type="email"
                            value={newStudent.email}
                            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                            placeholder="student@email.com"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenStudentDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddStudent}
                        disabled={!newStudent.name || !newStudent.email || loading}
                    >
                        {loading ? 'Adding...' : 'Add Student'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Assignment Dialog */}
            <Dialog open={openAssignmentDialog} onClose={() => setOpenAssignmentDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Create Assignment for {selectedClass?.name}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Assignment Title *"
                            fullWidth
                            value={newAssignment.title}
                            onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                            placeholder="e.g., Week 1 Quiz, Final Exam, Homework Assignment"
                        />

                        <FormControl component="fieldset">
                            <FormLabel component="legend">Assignment Type</FormLabel>
                            <RadioGroup
                                value={assignmentType}
                                onChange={(e) => handleAssignmentTypeChange(e.target.value)}
                                row
                            >
                                <FormControlLabel
                                    value="text"
                                    control={<Radio />}
                                    label={
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <DescriptionIcon />
                                            <Typography>Text Assignment</Typography>
                                        </Stack>
                                    }
                                />
                                <FormControlLabel
                                    value="question_bank"
                                    control={<Radio />}
                                    label={
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <QuestionBankIcon />
                                            <Typography>Question Bank</Typography>
                                        </Stack>
                                    }
                                />
                                <FormControlLabel
                                    value="pdf"
                                    control={<Radio />}
                                    label={
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <PdfIcon />
                                            <Typography>PDF Document</Typography>
                                        </Stack>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>

                        {assignmentType === 'text' && (
                            <TextField
                                label="Assignment Content *"
                                fullWidth
                                multiline
                                rows={6}
                                value={newAssignment.content}
                                onChange={(e) => setNewAssignment({ ...newAssignment, content: e.target.value })}
                                placeholder="Enter the assignment instructions, questions, or content..."
                            />
                        )}

                        {assignmentType === 'question_bank' && (
                            <Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<QuestionBankIcon />}
                                    onClick={openQuestionBankSelection}
                                    sx={{ mb: 2 }}
                                >
                                    Select Questions from Question Bank
                                </Button>

                                {newAssignment.questions.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Selected Questions ({newAssignment.questions.length}):
                                        </Typography>
                                        <Stack spacing={1}>
                                            {newAssignment.questions.map((question, index) => (
                                                <Paper key={question.id} variant="outlined" sx={{ p: 1.5 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="body2" gutterBottom>
                                                                {index + 1}. {question.text}
                                                            </Typography>
                                                            <Stack direction="row" spacing={1}>
                                                                <Chip label={question.type} size="small" />
                                                                <Chip label={`${question.points} pts`} size="small" variant="outlined" />
                                                            </Stack>
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => removeQuestionFromAssignment(question.id)}
                                                        >
                                                            <CloseIcon />
                                                        </IconButton>
                                                    </Stack>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {assignmentType === 'pdf' && (
                            <Box>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<PdfIcon />}
                                >
                                    Upload PDF File
                                    <input
                                        type="file"
                                        hidden
                                        accept=".pdf"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setNewAssignment({ ...newAssignment, pdfFile: file });
                                            }
                                        }}
                                    />
                                </Button>
                                {newAssignment.pdfFile && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Selected: {newAssignment.pdfFile.name}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <TextField
                            label="Due Date *"
                            type="datetime-local"
                            fullWidth
                            value={newAssignment.dueDate}
                            onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAssignmentDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateAssignment}
                        disabled={!newAssignment.title || !newAssignment.dueDate || loading}
                    >
                        {loading ? 'Creating...' : 'Create Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Question Bank Modal */}
            <Dialog
                open={openQuestionBankModal}
                onClose={() => setOpenQuestionBankModal(false)}
                maxWidth="lg"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        height: '90vh'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Select Questions from Question Bank</Typography>
                    <IconButton onClick={() => setOpenQuestionBankModal(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <QuestionBankSelection
                        onQuestionsSelected={handleQuestionsSelected}
                        onClose={() => setOpenQuestionBankModal(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default TeacherManageClasses;