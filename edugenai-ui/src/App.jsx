import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {ThemeProvider, createTheme} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {AuthProvider} from "./pages/AuthContext.jsx";
import ProtectedRoute from "./pages/ProtectedRoute.jsx";
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
import TeacherViewSubmissions from './pages/TeacherViewSubmissions.jsx';
import ChatUI from './pages/AITutor.jsx';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/*PUBLIC ROUTES*/}
                        <Route path="/" element={<Login />} />
                        <Route path="/login" element={<Login />} />

                        {/*Protected Routes - Require authentication and email verification*/}
                        <Route path="/select-role" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <RoleSelection />
                            </ProtectedRoute>
                        } />

                        {/*Student Routes - Require student role*/}
                        <Route path="/student" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <StudentDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/upload-papers" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <UploadPapers />
                            </ProtectedRoute>
                        } />
                        <Route path="/question-bank" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <QuestionBank />
                            </ProtectedRoute>
                        } />
                        <Route path="/generate-test" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <MockTest />
                            </ProtectedRoute>
                        } />
                        <Route path="/analytics" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <AnalyticsPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/student/assignments" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <StudentAssignments />
                            </ProtectedRoute>
                        } />
                        <Route path="/ai/chat" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <ChatUI/>
                            </ProtectedRoute>
                        }/>

                        {/*Teacher Routes - Require teacher role*/}
                        <Route path="/teacher" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <TeacherDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/create-exam" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <TeacherMockTest />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/question-bank" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <TeacherQuestionBank />
                            </ProtectedRoute>
                        } />
                        <Route path="/upload-questions" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <TeacherUploadQuestions />
                            </ProtectedRoute>
                        } />
                        <Route path="/manage-classes" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <TeacherManageClasses />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/upload-papers" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <TeacherUploadPapers />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/submissions" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <TeacherViewSubmissions />
                            </ProtectedRoute>
                        } />

                        <Route path="/ai/chat" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <ChatUI/>
                            </ProtectedRoute>
                        }/>

                        {/*Fallback route*/}
                        <Route path="*" element={<Login />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;