import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
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
import TrialBookingPage from "./pages/student/TrialBookingPage";
import TrialClassesManagement from "./pages/admin/TrialClassesManagement";
import StudentProfilePage from "./pages/admin/StudentProfile";
import TrialClassDetailsPage from "./pages/admin/TrialClassDetails";
import StudentTrialClassesPage from "./pages/admin/StudentTrialClassPage";
import CreateOneToOneCourse from "./pages/admin/courseManagement";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import VideoCallRoom from "./pages/VideoCallRoom";
import TrialClassFeedback from "./pages/student/TrialFeedback";
import StudentProfileSetup from "./pages/student/studentProfileSetup";
import BookTuitionSessions from "./pages/student/BookTuitionSessions";
import SubscriptionPlans from "./pages/student/SubscriptionPlans";


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
      <AppContent />
    </Router>
  );
};

const AppContent: React.FC = () => {
    const dispatch = useDispatch();
    
    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin") === "true";
        const token = localStorage.getItem("accessToken");
        
        // If we think we are an admin but have no Admin state, try to refresh/hydrate
        if (isAdmin && token) {
             // We can trigger a refresh token call which will fetch the profile
             // This assumes the refresh cookie is still valid.
             import("./features/admin/adminThunk").then(({ refreshAdminToken }) => {
                 dispatch(refreshAdminToken() as any);
             });
        }
    }, [dispatch]);

  return (
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

        {/* Student Profile - plural path (primary) */}
        <Route
          path="/admin/students/:studentId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Student Profile - singular path (legacy support) */}
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
          path="/trial-class/:trialClassId/call"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR, ROLES.STUDENT]}>
              <VideoCallRoom />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trial-class/:trialClassId/feedback"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <TrialClassFeedback />
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
          path="/student/time-slots"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <BookTuitionSessions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/subscription-plans"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <SubscriptionPlans />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile-setup"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentProfileSetup />
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

        <Route
          path="/mentor/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
              <MentorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <CreateOneToOneCourse />
            </ProtectedRoute>
          }
        />
        
        <Route path="/admin/logout" element={<AdminLoginPage />} />
      </Routes>
  );
};

export default App;
