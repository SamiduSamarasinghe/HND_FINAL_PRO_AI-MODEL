import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Login from './pages/Login';
import UploadPapers from './pages/UploadPapers';
import MockTest from './pages/MockTest';
import TeacherMockTest from './pages/TeacherMockTest';
import TeacherQuestionBank from './pages/TeacherQuestionBank';
import TeacherUploadQuestions from './pages/TeacherUploadQuestions';
import TeacherManageClasses from './pages/TeacherManageClasses';
import QuestionBank from "./pages/QuestionBank.jsx";
import TeacherUploadPapers from "./pages/TeacherUploadPapers.jsx";
import AnalyticsPage from './pages/analytics.jsx';
import StudentAssignments from './pages/StudentAssignments.jsx';
import TeacherViewSubmissions from './pages/TeacherViewSubmissions.jsx'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/select-role" element={<RoleSelection />} />

                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/upload-papers" element={<UploadPapers />} />
                <Route path="/question-bank" element={<QuestionBank/>} />
                <Route path="/generate-test" element={<MockTest />} />
                <Route path="/analytics" element={<AnalyticsPage/>}/>
                <Route path="/student/assignments" element={<StudentAssignments />} />



                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/teacher/create-exam" element={<TeacherMockTest />} />
                <Route path="/teacher/question-bank" element={<TeacherQuestionBank />} />
                <Route path="upload-questions" element={<TeacherUploadQuestions />} />
                <Route path="manage-classes" element={<TeacherManageClasses />} />
                <Route path="/teacher/upload-papers" element={<TeacherUploadPapers />} />
                <Route path="/teacher/submissions" element={<TeacherViewSubmissions />} />


            </Routes>
        </BrowserRouter>
    );
}

export default App;