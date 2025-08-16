import React, { useState } from 'react';
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
    InputLabel
} from '@mui/material';
import {
    Groups as ClassIcon,
    Assignment as ExamIcon,
    BarChart as AnalyticsIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as AddStudentIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TeacherManageClasses = () => {
    const [activeTab, setActiveTab] = useState('classes');
    const [openDialog, setOpenDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newClass, setNewClass] = useState({
        name: '',
        subject: 'Mathematics',
        gradeLevel: '10'
    });

    // Sample data
    const classes = [
        {
            id: 1,
            name: 'Mathematics 101',
            subject: 'Mathematics',
            gradeLevel: '10',
            students: 32,
            exams: 5,
            avgScore: 78
        },
        {
            id: 2,
            name: 'Physics 201',
            subject: 'Physics',
            gradeLevel: '11',
            students: 28,
            exams: 3,
            avgScore: 82
        },
        {
            id: 3,
            name: 'Advanced Calculus',
            subject: 'Mathematics',
            gradeLevel: '12',
            students: 24,
            exams: 7,
            avgScore: 75
        }
    ];

    const exams = [
        { id: 1, title: 'Midterm Exam', date: '2023-11-15', class: 'Mathematics 101' },
        { id: 2, title: 'Final Exam', date: '2023-12-20', class: 'Mathematics 101' },
        { id: 3, title: 'Quantum Physics Test', date: '2023-11-22', class: 'Physics 201' }
    ];

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleCreateClass = () => {
        console.log('Creating new class:', newClass);
        // In real app, this would call an API
        setOpenDialog(false);
        setNewClass({ name: '', subject: 'Mathematics', gradeLevel: '10' });
    };

    const handleAssignExam = (classId) => {
        console.log('Assigning exam to class:', classId);
        // Implementation would open exam assignment dialog
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ClassIcon sx={{ mr: 1, color: 'primary.main' }} />
                Manage Classes
            </Typography>

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
                    >
                        New Class
                    </Button>
                </Stack>
            </Paper>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Classes" value="classes" />
                    <Tab label="Exam Assignments" value="exams" />
                    <Tab label="Class Analytics" value="analytics" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            {activeTab === 'classes' && (
                <Grid container spacing={3}>
                    {classes.map((cls) => (
                        <Grid item xs={12} sm={6} md={4} key={cls.id}>
                            <Card variant="outlined" sx={{ height: '100%' }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="h6">{cls.name}</Typography>
                                        <Chip label={cls.subject} size="small" />
                                    </Stack>
                                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                                        Grade {cls.gradeLevel} • {cls.students} students
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2">Avg. Score</Typography>
                                            <Typography variant="h6">{cls.avgScore}%</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2">Exams</Typography>
                                            <Typography variant="h6">{cls.exams}</Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 1 }} />

                                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<ExamIcon />}
                                            onClick={() => handleAssignExam(cls.id)}
                                        >
                                            Assign Exam
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AddStudentIcon />}
                                        >
                                            Add Students
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {activeTab === 'exams' && (
                <Card variant="outlined">
                    <CardContent>
                        <List>
                            {exams.map((exam) => (
                                <ListItem
                                    key={exam.id}
                                    secondaryAction={
                                        <FormControl size="small" sx={{ minWidth: 180 }}>
                                            <InputLabel>Assign to Class</InputLabel>
                                            <Select label="Assign to Class">
                                                {classes.map((cls) => (
                                                    <MenuItem key={cls.id} value={cls.id}>
                                                        {cls.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    }
                                >
                                    <ListItemText
                                        primary={exam.title}
                                        secondary={`${exam.date} • ${exam.class}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'analytics' && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Class Performance Overview
                        </Typography>
                        <Grid container spacing={3}>
                            {classes.map((cls) => (
                                <Grid item xs={12} md={6} key={cls.id}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            {cls.name}
                                        </Typography>
                                        <Typography color="text.secondary" gutterBottom>
                                            Weak Areas: Algebra (32% miss rate), Geometry (28% miss rate)
                                        </Typography>
                                        <Button size="small" startIcon={<AnalyticsIcon />}>
                                            View Detailed Analytics
                                        </Button>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* New Class Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1, minWidth: 400 }}>
                        <TextField
                            label="Class Name"
                            fullWidth
                            value={newClass.name}
                            onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Subject</InputLabel>
                            <Select
                                value={newClass.subject}
                                label="Subject"
                                onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                            >
                                <MenuItem value="Mathematics">Mathematics</MenuItem>
                                <MenuItem value="Physics">Physics</MenuItem>
                                <MenuItem value="Chemistry">Chemistry</MenuItem>
                            </Select>
                        </FormControl>
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
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateClass}
                        disabled={!newClass.name}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherManageClasses;