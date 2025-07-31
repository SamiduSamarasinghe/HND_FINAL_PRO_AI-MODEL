import { useDropzone } from 'react-dropzone';
import { Paper, Typography, Button } from '@mui/material';

export default function UploadArea() {
    const { getRootProps, getInputProps } = useDropzone({
        accept: 'application/pdf',
        onDrop: files => console.log(files)
    });

    return (
        <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed #ccc' }}>
            <Typography variant="h6">Upload Papers</Typography>
            <Typography>Drag & drop PDF past papers here</Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>Upload</Button>
        </Paper>
    );
}