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
    List,
    ListItem,
    ListItemText,
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
    CircularProgress
} from '@mui/material';
import {
    Groups as ClassIcon,
    Assignment as ExamIcon,
    BarChart as AnalyticsIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as AddStudentIcon,
    Search as SearchIcon,
    Person as PersonIcon,
    Share as ShareIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';

const TeacherManageClasses = () => {
    const [activeTab, setActiveTab] = useState('classes');
    const [openDialog, setOpenDialog] = useState(false);
    const [openStudentDialog, setOpenStudentDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [classes, setClasses] = useState([]);
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
            fetchClasses(); // Refresh the list
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
            fetchClasses(); // Refresh the list
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
            fetchClasses(); // Refresh the list
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

            {/* Tab Content */}
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

            {activeTab === 'assignments' && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Class Assignments
                        </Typography>
                        {classes.map((cls) => (
                            <Paper key={cls.id} sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AssignmentIcon sx={{ mr: 1, fontSize: 20 }} />
                                    {cls.name} Assignments
                                </Typography>
                                <Button variant="outlined" startIcon={<AddIcon />} sx={{ mb: 2 }}>
                                    Create New Assignment
                                </Button>
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                    No assignments created yet.
                                </Typography>
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
        </Box>
    );
};

export default TeacherManageClasses;