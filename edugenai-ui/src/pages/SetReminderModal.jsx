import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Chip,
    Grid,
    Switch,
    FormControlLabel,
    FormGroup,
    Checkbox, IconButton
} from '@mui/material';
import {
    Close as CloseIcon,
    Group as GroupIcon,
    Person as PersonIcon
} from '@mui/icons-material';

const SetReminderModal = ({ open, onClose, teacherId }) => {
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        type: 'class',
        due_date: '',
        priority: 'medium',
        target_type: 'class', // 'class' or 'individual'
        target_emails: [],
        target_class_ids: []
    });

    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedClassIds, setSelectedClassIds] = useState([]);
    const [selectedStudentEmails, setSelectedStudentEmails] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch teacher's classes
    const fetchClasses = async () => {
        try {
            const response = await fetch(`http://localhost:8088/api/v1/teacher/classes?teacher_id=${teacherId}`);
            if (response.ok) {
                const data = await response.json();
                setClasses(data.classes || []);

                // Auto-fetch students for these classes
                fetchStudentsForClasses(data.classes || []);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    // Fetch students for the teacher's classes
    const fetchStudentsForClasses = async (classesList) => {
        const allStudents = [];

        for (const classItem of classesList) {
            if (classItem.students) {
                classItem.students.forEach(student => {
                    allStudents.push({
                        ...student,
                        className: classItem.name,
                        classId: classItem.id
                    });
                });
            }
        }

        setStudents(allStudents);
    };

    useEffect(() => {
        if (open && teacherId) {
            fetchClasses();
        }
    }, [open, teacherId]);

    const handleCreateEvent = async () => {
        if (!eventData.title.trim() || !eventData.due_date) {
            alert('Event title and due date are required');
            return;
        }

        setLoading(true);
        try {
            // Prepare target data based on selection
            const targetData = {
                target_type: eventData.target_type,
                target_emails: [],
                target_class_ids: []
            };

            if (eventData.target_type === 'class') {
                targetData.target_class_ids = selectedClassIds;
                // Get all student emails from selected classes
                selectedClassIds.forEach(classId => {
                    const classItem = classes.find(c => c.id === classId);
                    if (classItem && classItem.students) {
                        classItem.students.forEach(student => {
                            if (student.email) {
                                targetData.target_emails.push(student.email);
                            }
                        });
                    }
                });
            } else {
                // Individual targeting
                targetData.target_emails = selectedStudentEmails;
            }

            const eventPayload = {
                ...eventData,
                ...targetData,
                teacher_classes: classes.map(c => c.id) // All classes teacher teaches
            };

            const response = await fetch(`http://localhost:8088/api/v1/teacher/events?teacher_id=${teacherId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventPayload)
            });

            if (response.ok) {
                alert('Event created successfully!');
                onClose();
                // Reset form
                setEventData({
                    title: '',
                    description: '',
                    type: 'class',
                    due_date: '',
                    priority: 'medium',
                    target_type: 'class'
                });
                setSelectedClassIds([]);
                setSelectedStudentEmails([]);
            } else {
                throw new Error('Failed to create event');
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    const handleClassSelection = (classId) => {
        setSelectedClassIds(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const handleStudentSelection = (studentEmail) => {
        setSelectedStudentEmails(prev =>
            prev.includes(studentEmail)
                ? prev.filter(email => email !== studentEmail)
                : [...prev, studentEmail]
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Create Event</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                    Create events that will appear in the Upcoming Events box for selected students and yourself.
                </Typography>

                {/* Basic Event Information */}
                <TextField
                    fullWidth
                    label="Event Title"
                    value={eventData.title}
                    onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                    margin="normal"
                    required
                />

                <TextField
                    fullWidth
                    label="Description"
                    value={eventData.description}
                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                    margin="normal"
                    multiline
                    rows={3}
                />

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Event Type</InputLabel>
                            <Select
                                value={eventData.type}
                                onChange={(e) => setEventData({ ...eventData, type: e.target.value })}
                                label="Event Type"
                            >
                                <MenuItem value="school">School Event</MenuItem>
                                <MenuItem value="class">Class Event</MenuItem>
                                <MenuItem value="assignment">Assignment Reminder</MenuItem>
                                <MenuItem value="announcement">Announcement</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={eventData.priority}
                                onChange={(e) => setEventData({ ...eventData, priority: e.target.value })}
                                label="Priority"
                            >
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                <TextField
                    fullWidth
                    label="Due Date & Time"
                    type="datetime-local"
                    value={eventData.due_date}
                    onChange={(e) => setEventData({ ...eventData, due_date: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    required
                />

                {/* Target Selection */}
                <FormControl fullWidth margin="normal">
                    <InputLabel>Target Audience</InputLabel>
                    <Select
                        value={eventData.target_type}
                        onChange={(e) => setEventData({ ...eventData, target_type: e.target.value })}
                        label="Target Audience"
                    >
                        <MenuItem value="class">Entire Class</MenuItem>
                        <MenuItem value="individual">Individual Students</MenuItem>
                    </Select>
                </FormControl>

                {/* Class Selection (for class targeting) */}
                {eventData.target_type === 'class' && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Select Classes
                        </Typography>
                        <FormGroup>
                            {classes.map(classItem => (
                                <FormControlLabel
                                    key={classItem.id}
                                    control={
                                        <Checkbox
                                            checked={selectedClassIds.includes(classItem.id)}
                                            onChange={() => handleClassSelection(classItem.id)}
                                        />
                                    }
                                    label={
                                        <Box display="flex" justifyContent="space-between" width="100%">
                                            <span>{classItem.name}</span>
                                            <Chip
                                                label={`${classItem.students?.length || 0} students`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                />
                            ))}
                        </FormGroup>
                        {selectedClassIds.length > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Event will be sent to {selectedClassIds.length} class(es)
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Individual Student Selection */}
                {eventData.target_type === 'individual' && (
                    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Select Students
                        </Typography>
                        <FormGroup>
                            {students.map(student => (
                                <FormControlLabel
                                    key={student.email}
                                    control={
                                        <Checkbox
                                            checked={selectedStudentEmails.includes(student.email)}
                                            onChange={() => handleStudentSelection(student.email)}
                                        />
                                    }
                                    label={`${student.name} (${student.email}) - ${student.className}`}
                                />
                            ))}
                        </FormGroup>
                        {selectedStudentEmails.length > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Event will be sent to {selectedStudentEmails.length} student(s)
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleCreateEvent}
                    disabled={loading || !eventData.title || !eventData.due_date}
                >
                    Create Event
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SetReminderModal;