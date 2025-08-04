import {useState} from "react";
import { useDropzone } from 'react-dropzone'
import { Paper, Typography, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export default function UploadArea() {
    const [files, setFiles] = useState([]);

    const { getRootProps, getInputProps } = useDropzone({
        accept: 'application/pdf',
        onDrop: (acceptedFiles) => {
            setFiles(acceptedFiles.map(file => ({
                name: file.name,
                size: (file.size / 1024).toFixed(2) + ' KB'
            })));
        }
    });

    return (
        <Paper
            {...getRootProps()}
            sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed #ccc',
                borderRadius: 2,
                backgroundColor: '#f8f9fa',
                cursor: 'pointer',
                '&:hover': {
                    borderColor: '#1976d2',
                    backgroundColor: '#f0f4f8'
                }
            }}
        >
            <input {...getInputProps()} />
            <Typography variant="h6" sx={{
                fontWeight: 'bold',
                mb: 1,
                color: '#333'
            }}>
                Upload Papers
            </Typography>
            <Typography variant="body2" sx={{
                color: '#666',
                mb: 2
            }}>
                Drag & drop PDF past papers here, or
            </Typography>
            <Button
                variant="contained"
                sx={{
                    px: 4,
                    py: 1,
                    fontWeight: 'bold',
                    textTransform: 'none',
                    backgroundColor: '#1976d2',
                    '&:hover': {
                        backgroundColor: '#1565c0'
                    }
                }}
            >
                UPLOAD
            </Button>
            {files.length > 0 && (
                <List sx={{mmt:2}}>
                    {files.map((file, index) => (
                        <ListItem key={index} secondryAction={
                            <IconButton edge="end" onClick={() => setFiles(files.filter((_, i) => i !== index))}>
                                <DeleteIcon/>
                            </IconButton>
                        }>
                            <ListItemText primary={file.name} secondary={file.size}/>
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
}