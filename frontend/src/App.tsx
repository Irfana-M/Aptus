import React from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Register from "./pages/auth/Registration";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Login from "./pages/auth/Login";
import AdminLoginPage from "./pages/admin/Login";
import Dashboard from "./pages/admin/AdminDashboard";
import GoogleCallback from "./pages/auth/GoogleCallback";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import MentorProfileSetup from "./pages/mentor/ProfileSetup";
import MentorProfilePage from "./pages/admin/MentorProfile";
import MentorsManagement from "./pages/admin/Mentors";
import ProtectedRoute from "./routes/protectedRoute";
import { ROLES } from "./constants/roles";
import StudentsManagement from "./pages/admin/Student";
import TrialBookingPage from "./pages/student/TrialBookingPage";
import TrialClassesManagement from "./pages/admin/TrialClassesManagement";
import StudentProfilePage from "./pages/admin/StudentProfile";
import TrialClassDetailsPage from "./pages/admin/TrialClassDetails";
import StudentTrialClassesPage from "./pages/admin/StudentTrialClassPage";

const App: React.FC = () => {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mentors"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <MentorsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mentor/:mentorId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <MentorProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <StudentsManagement />
            </ProtectedRoute>
          }
        />

          <Route
          path="/admin/student/:studentId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/trial-classes" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <TrialClassesManagement />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/students/:studentId/trial-classes" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <StudentTrialClassesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/trial-class/:trialClassId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <TrialClassDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/book-free-trial"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <TrialBookingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mentor/profile-setup"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
              <MentorProfileSetup />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/logout" element={<AdminLoginPage />} />
      </Routes>
    </Router>
  );
};

export default App;
