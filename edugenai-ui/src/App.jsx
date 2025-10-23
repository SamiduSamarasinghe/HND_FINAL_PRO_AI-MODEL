import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
                        {/* PUBLIC ROUTES */}
                        <Route path="/login" element={<Login />} />

                        {/* DEFAULT ROUTE - Redirect based on auth state */}
                        <Route path="/" element={<Navigate to="/login" replace />} />

                        {/* PROTECTED ROUTES - Require authentication */}
                        <Route path="/select-role" element={
                            <ProtectedRoute requireEmailVerification={false}>
                                <RoleSelection />
                            </ProtectedRoute>
                        } />

                        {/* STUDENT ROUTES - Require student role */}
                        <Route path="/student" element={
                            <ProtectedRoute requiredRole="student">
                                <StudentDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/student/upload-papers" element={
                            <ProtectedRoute requiredRole="student">
                                <UploadPapers />
                            </ProtectedRoute>
                        } />
                        <Route path="/student/question-bank" element={
                            <ProtectedRoute requiredRole="student">
                                <QuestionBank />
                            </ProtectedRoute>
                        } />
                        <Route path="/student/generate-test" element={
                            <ProtectedRoute requiredRole="student">
                                <MockTest />
                            </ProtectedRoute>
                        } />
                        <Route path="/student/analytics" element={
                            <ProtectedRoute requiredRole="student">
                                <AnalyticsPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/student/assignments" element={
                            <ProtectedRoute requiredRole="student">
                                <StudentAssignments />
                            </ProtectedRoute>
                        } />
                        <Route path="/ai/chat" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <ChatUI/>
                            </ProtectedRoute>
                        }/>

                        {/* TEACHER ROUTES - Require teacher role */}
                        <Route path="/teacher" element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/create-exam" element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherMockTest />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/question-bank" element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherQuestionBank />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/upload-questions" element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherUploadQuestions />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/manage-classes" element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherManageClasses />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/upload-papers" element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherUploadPapers />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/submissions" element={
                            <ProtectedRoute requiredRole="teacher">
                                <TeacherViewSubmissions />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/analytics" element={
                            <ProtectedRoute requiredRole="teacher">
                                <AnalyticsPage />
                            </ProtectedRoute>
                        } />

                        {/* FALLBACK ROUTE */}
                        <Route path="*" element={<Navigate to="/login" replace />} />

                        <Route path="/ai/chat" element={
                            <ProtectedRoute requireEmailVerification={true}>
                                <ChatUI/>
                            </ProtectedRoute>
                        }/>

                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;