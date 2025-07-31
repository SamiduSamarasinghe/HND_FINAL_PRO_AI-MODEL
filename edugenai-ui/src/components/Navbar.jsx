import { AppBar, Toolbar, Button } from '@mui/material';

export default function Navbar() {
    return (
        <AppBar position="static">
            <Toolbar>
                <Button color="inherit">Home</Button>
                <Button color="inherit">Upload Papers</Button>
            </Toolbar>
        </AppBar>
    );
}