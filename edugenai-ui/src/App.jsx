import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Login from './pages/Login';
import UploadPapers from './pages/UploadPapers';
import MockTest from './pages/MockTest';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/select-role" element={<RoleSelection />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/upload-papers" element={<UploadPapers />} />
                <Route path="/generate-test" element={<MockTest />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;