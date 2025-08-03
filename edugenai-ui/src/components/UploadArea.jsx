import { useDropzone } from 'react-dropzone';
import { Paper, Typography, Button } from '@mui/material';

export default function UploadArea() {
    const { getRootProps, getInputProps } = useDropzone({
        accept: 'application/pdf',
        onDrop: files => console.log(files)
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
        </Paper>
    );
}