import React from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Register from "./pages/auth/Registration";
import VerifyOtp from "./pages/auth/VerifyOtp";
import Login from "./pages/auth/Login";
import AdminLoginPage from "./pages/admin/Login";
import Dashboard from "./pages/admin/adminDashboard";
import GoogleCallback from "./pages/auth/GoogleCallback";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import MentorProfileSetup from "./pages/mentor/ProfileSetup";
import MentorProfilePage from "./pages/admin/mentorProfile";
import MentorsManagement from "./pages/admin/mentors";
import ProtectedRoute from "./routes/protectedRoute";
import { ROLES } from "./constants/roles";
import StudentsManagement from "./pages/admin/student";

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Admin Login (public) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected Admin Routes */}
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

        {/* Protected Mentor Routes */}
        <Route
          path="/mentor/profile-setup"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
              <MentorProfileSetup />
            </ProtectedRoute>
          }
        />

        {/* Logout just redirects to login */}
        <Route path="/admin/logout" element={<AdminLoginPage />} />
      </Routes>
    </Router>
  );
};

export default App;
