import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import AdminLayout from '../layouts/AdminLayout';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import QuizzesPage from '../pages/admin/QuizzesPage';
import QuizBuilderPage from '../pages/admin/QuizBuilderPage';
import QuizAssignPage from '../pages/admin/QuizAssignPage';
import StudentsPage from '../pages/admin/StudentsPage';
import ResultsPage from '../pages/admin/ResultsPage';
import AttemptDetailPage from '../pages/admin/AttemptDetailPage';
import AdminsPage from '../pages/admin/AdminsPage';

import StudentLoginPage from '../pages/student/StudentLoginPage';
import QuizInstructionsPage from '../pages/student/QuizInstructionsPage';
import QuizEnginePage from '../pages/student/QuizEnginePage';

// Protected Route for Admins
const ProtectedAdminRoute = ({ children }) => {
  const { adminToken } = useAuth();
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Protected Route for Super Admin Only
const SuperAdminRoute = ({ children }) => {
  const { adminToken, isSuperAdmin } = useAuth();
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

// Protected Route for Students
const ProtectedStudentRoute = ({ children }) => {
  const { studentToken } = useAuth();
  if (!studentToken) {
    const activeToken = localStorage.getItem('activeAssignmentToken');
    if (activeToken) {
      return <Navigate to={`/quiz/${activeToken}`} replace />;
    }
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Admin Public Route */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin Protected Routes inside AdminLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="quizzes" element={<QuizzesPage />} />
        <Route path="quizzes/create" element={<QuizBuilderPage />} />
        <Route path="quizzes/:id/edit" element={<QuizBuilderPage />} />
        <Route path="quizzes/:id/assign" element={<QuizAssignPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="results/:attemptId" element={<AttemptDetailPage />} />
        <Route
          path="admins"
          element={
            <SuperAdminRoute>
              <AdminsPage />
            </SuperAdminRoute>
          }
        />
      </Route>

      {/* Student Examination Portal Routes */}
      <Route path="/quiz/:token" element={<StudentLoginPage />} />
      <Route
        path="/student/instructions"
        element={
          <ProtectedStudentRoute>
            <QuizInstructionsPage />
          </ProtectedStudentRoute>
        }
      />
      <Route
        path="/student/engine"
        element={
          <ProtectedStudentRoute>
            <QuizEnginePage />
          </ProtectedStudentRoute>
        }
      />

      {/* Default Catch-all */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
