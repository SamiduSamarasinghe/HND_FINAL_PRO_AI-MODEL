import React, { useState, useEffect } from 'react';
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
    FormLabel
} from '@mui/material';
import {
    Groups as ClassIcon,
    Assignment as ExamIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    PersonAdd as AddStudentIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Description as DescriptionIcon,
    LibraryBooks as QuestionBankIcon,
    PictureAsPdf as PdfIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const TeacherManageClasses = () => {
    const [activeTab, setActiveTab] = useState('classes');
    const [openDialog, setOpenDialog] = useState(false);
    const [openStudentDialog, setOpenStudentDialog] = useState(false);
    const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
    const [openQuestionBankModal, setOpenQuestionBankModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
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
            setClasses(data.classes || []);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError('Failed to load classes');
        } finally {
            setLoading(false);
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
            fetchClasses();
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
            fetchClasses();
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

            const assignmentData = {
                classId: selectedClass.id,
                title: newAssignment.title,
                type: assignmentType,
                content: newAssignment.content,
                dueDate: newAssignment.dueDate,
                questions: newAssignment.questions
            };

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

    const handleAssignmentTypeChange = (type) => {
        setAssignmentType(type);
        setNewAssignment({
            ...newAssignment,
            type: type,
            content: '',
            questions: []
        });
    };

    // Handle questions selected from Question Bank modal
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
                                        </Stack>

                                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                                            Grade {cls.gradeLevel} • {cls.students?.length || 0} students
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

// Question Bank Selection Component (renamed from QuestionBankModal)
const QuestionBankSelection = ({ onQuestionsSelected, onClose }) => {
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        subject: '',
        type: '',
        difficulty: ''
    });
    const [loading, setLoading] = useState(true);

    // Fetch questions
    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8088/api/v1/questions');
            if (response.ok) {
                const data = await response.json();
                const questionsArray = data.questions || [];
                setQuestions(questionsArray);
                setFilteredQuestions(questionsArray);
            }
        } catch (err) {
            console.error('Error fetching questions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    useEffect(() => {
        filterQuestions();
    }, [searchTerm, filters, questions]);

    const filterQuestions = () => {
        let filtered = [...questions];

        if (searchTerm) {
            filtered = filtered.filter(q =>
                q.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.subject?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filters.subject) {
            filtered = filtered.filter(q => q.subject === filters.subject);
        }

        if (filters.type) {
            filtered = filtered.filter(q => q.type === filters.type);
        }

        if (filters.difficulty) {
            filtered = filtered.filter(q => q.difficulty === filters.difficulty);
        }

        setFilteredQuestions(filtered);
    };

    const toggleQuestionSelect = (question) => {
        setSelectedQuestions(prev =>
            prev.find(q => q.id === question.id)
                ? prev.filter(q => q.id !== question.id)
                : [...prev, question]
        );
    };

    const handleAddToAssignment = () => {
        onQuestionsSelected(selectedQuestions);
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 1 }}
                        InputProps={{
                            startAdornment: <SearchIcon color="action" />
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={filters.type}
                            label="Type"
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="MCQ">MCQ</MenuItem>
                            <MenuItem value="Short Answer">Short Answer</MenuItem>
                            <MenuItem value="Essay">Essay</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Selection Info */}
            {selectedQuestions.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {selectedQuestions.length} questions selected
                </Alert>
            )}

            {/* Questions List */}
            <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredQuestions.length === 0 ? (
                    <Typography textAlign="center" color="text.secondary" sx={{ p: 3 }}>
                        No questions found
                    </Typography>
                ) : (
                    <Stack spacing={1}>
                        {filteredQuestions.map((question) => (
                            <Paper
                                key={question.id}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderColor: selectedQuestions.find(q => q.id === question.id) ? 'primary.main' : 'divider',
                                    bgcolor: selectedQuestions.find(q => q.id === question.id) ? 'action.selected' : 'background.paper'
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <input
                                        type="checkbox"
                                        checked={!!selectedQuestions.find(q => q.id === question.id)}
                                        onChange={() => toggleQuestionSelect(question)}
                                        style={{ marginTop: '4px' }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" gutterBottom>
                                            {question.text}
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                                            <Chip label={question.type} size="small" />
                                            <Chip label={question.subject} size="small" variant="outlined" />
                                            {question.points && (
                                                <Chip label={`${question.points} pts`} size="small" variant="outlined" />
                                            )}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleAddToAssignment}
                    disabled={selectedQuestions.length === 0}
                >
                    Add {selectedQuestions.length} Questions to Assignment
                </Button>
            </Box>
        </Box>
    );
};

export default TeacherManageClasses;