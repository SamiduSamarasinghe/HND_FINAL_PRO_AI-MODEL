import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Divider,
    Chip,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Slider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Image as ImageIcon,
    Visibility as PreviewIcon,
    Check as CheckIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import backgroundImage
    from "../assets/pexels-julia-m-cameron-4144923.jpg";

const TeacherUploadQuestions = () => {
    const [question, setQuestion] = useState({
        text: '',
        type: 'MCQ',
        options: ['', ''],
        correctOption: null,
        subject: 'Mathematics',
        topic: '',
        difficulty: 3,
        image: null
    });



    const handleChange = (e) => {
        const { name, value } = e.target;
        setQuestion(prev => ({ ...prev, [name]: value }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...question.options];
        newOptions[index] = value;
        setQuestion(prev => ({ ...prev, options: newOptions }));
    };

    const addOption = () => {
        setQuestion(prev => ({ ...prev, options: [...prev.options, ''] }));
    };

    const removeOption = (index) => {
        const newOptions = question.options.filter((_, i) => i !== index);
        setQuestion(prev => ({
            ...prev,
            options: newOptions,
            correctOption: prev.correctOption === index ? null : prev.correctOption
        }));
    };

    const handleImageUpload = (e) => {
        // In real app, you'd handle file upload properly
        setQuestion(prev => ({ ...prev, image: e.target.files[0] }));
    };



    const handleSubmit = () => {
        console.log('Question submitted:', question);
        // In real app, submit to backend
        navigate('/question-bank');
    };

    const navigate = useNavigate();

    return (
        <Box sx={{ p: 3,
            minHeight: '100vh',
            // Background with controlled opacity
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                opacity: 0.25, // Adjust this value (0.1 to 0.3 works well)
                zIndex: -1
            }

        }}>
            {/*content container*/}
            <Box sx={{
                maxWidth: 800,
                margin: '0 auto',
                position: 'relative',
                zIndex: 1,
                backgroundColor: 'background.paper',
                borderRadius: 2,
                boxShadow: 3
            }}>
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Add New Question
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    {/* Question Type Toggle */}
                    <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                        {['MCQ', 'Short Answer', 'Essay'].map((type) => (
                            <Button
                                key={type}
                                variant={question.type === type ? 'contained' : 'outlined'}
                                onClick={() => setQuestion(prev => ({ ...prev, type }))}
                                sx={{ flex: 1 }}
                            >
                                {type}
                            </Button>
                        ))}
                    </Stack>

                    {/* Question Text */}
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Question Text"
                        value={question.text}
                        onChange={(e) => {
                            handleChange(e);
                            if (question.text.length > 20) analyzeQuestion();
                        }}
                        name="text"
                        sx={{ mb: 3 }}
                    />

                    {/* MCQ Options */}
                    {question.type === 'MCQ' && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Options (Mark correct answer)
                            </Typography>
                            {question.options.map((option, index) => (
                                <Stack key={index} direction="row" spacing={1} sx={{ mb: 1 }}>
                                    <Button
                                        variant={question.correctOption === index ? 'contained' : 'outlined'}
                                        onClick={() => setQuestion(prev => ({ ...prev, correctOption: index }))}
                                        sx={{ minWidth: 40 }}
                                    >
                                        {String.fromCharCode(65 + index)}
                                    </Button>
                                    <TextField
                                        fullWidth
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                    />
                                    {question.options.length > 2 && (
                                        <IconButton onClick={() => removeOption(index)}>
                                            <DeleteIcon color="error" />
                                        </IconButton>
                                    )}
                                </Stack>
                            ))}
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={addOption}
                                disabled={question.options.length >= 6}
                                sx={{ mt: 1 }}
                            >
                                Add Option
                            </Button>
                        </Box>
                    )}

                    {/* AI Suggestions */}


                    {/* Image Upload */}
                    <Box sx={{ mt: 3, mb: 3 }}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="question-image-upload"
                            type="file"
                            onChange={handleImageUpload}
                        />
                        <label htmlFor="question-image-upload">
                            <Button
                                variant="outlined"
                                startIcon={<ImageIcon />}
                                component="span"
                            >
                                {question.image ? 'Change Image' : 'Add Image'}
                            </Button>
                        </label>
                        {question.image && (
                            <Typography variant="caption" sx={{ ml: 2 }}>
                                {question.image.name}
                            </Typography>
                        )}
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={!question.text || (question.type === 'MCQ' && !question.options.some(opt => opt.trim()))}
                        >
                            Save Question
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
            </Box>
        </Box>
    );
};

export default TeacherUploadQuestions;