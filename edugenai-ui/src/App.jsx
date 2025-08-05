import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Login from './pages/Login';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/select-role" element={<RoleSelection />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/teacher" element={<TeacherDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;