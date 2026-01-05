import React, { useEffect } from "react";
import { useAppDispatch } from "./app/hooks";
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
import MentorRequestsPage from './pages/admin/MentorRequestsPage';
import StudentProfilePage from "./pages/admin/StudentProfile";
import AdminEnrollmentsPage from "./pages/admin/AdminEnrollmentsPage";
import TrialClassDetailsPage from "./pages/admin/TrialClassDetails";
import StudentTrialClassesPage from "./pages/admin/StudentTrialClassPage";
import CreateOneToOneCourse from "./pages/admin/courseManagement";
import VideoCallRoom from "./pages/VideoCallRoom";
import Finance from "./pages/admin/Finance";
import TrialClassFeedback from "./pages/student/TrialFeedback";
import StudentProfile from "./pages/student/StudentProfile";
import StudentDashboard from "./pages/student/dashboard";
import BookTuitionSessions from "./pages/student/BookTuitionSessions";
import SubscriptionPlans from "./pages/student/SubscriptionPlans";
import PaymentPage from "./pages/student/PaymentPage";
import WalletPage from "./pages/student/WalletPage";
import PaymentHistory from "./pages/student/PaymentHistory";
import MyCourses from "./pages/student/MyCourses";
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MentorAvailabilityPage from "./pages/mentor/Availability";
import MentorStudentsPage from "./pages/mentor/Students";
import MentorAttendance from "./pages/mentor/Attendance";
import MentorClassroom from "./pages/mentor/Classroom";
import StudentAttendance from "./pages/student/Attendance";
import StudentClassroom from "./pages/student/Classroom";
import AdminAttendance from "./pages/admin/Attendance";
import AdminClassroom from "./pages/admin/Classroom";
import CompletedTrialClasses from "./pages/mentor/CompletedTrialClasses";
import SubjectsSelectionPage from "./pages/student/preferences/SubjectsSelectionPage";
import TimeSlotsSelectionPage from "./pages/student/preferences/TimeSlotsSelectionPage";
import MentorSelectionPage from "./pages/student/preferences/MentorSelectionPage";


import { VideoCallProvider } from "./context/VideoCallContext";
import FloatingCallOverlay from "./components/video/FloatingCallOverlay";
import NotificationsPage from "./pages/common/NotificationsPage";


const App: React.FC = () => {
  return (
    <Router>
      <VideoCallProvider>
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
      <FloatingCallOverlay />
      </VideoCallProvider>
    </Router>
  );
};

const AppContent: React.FC = () => {
    const dispatch = useAppDispatch();
    
    useEffect(() => {
        const path = window.location.pathname;
        //const userRole = localStorage.getItem("userRole");
        const studentToken = localStorage.getItem("student_accessToken");
        const mentorToken = localStorage.getItem("mentor_accessToken");
        const adminToken = localStorage.getItem("admin_accessToken") || localStorage.getItem("adminAccessToken");
        const genericToken = localStorage.getItem("accessToken");
        
        // Prioritize refresh based on current path to avoid race conditions
        const isAdminPath = path.startsWith('/admin');
        const isStudentPath = path.startsWith('/student');
        const isMentorPath = path.startsWith('/mentor');
        
        // 1. Refresh Admin if on admin path or generic refresh needed and we are admin
        if (adminToken && (isAdminPath || (!isStudentPath && !isMentorPath))) {
            import("./features/admin/adminThunk").then(({ refreshAdminToken }) => {
                dispatch(refreshAdminToken());
            });
        }
        
        // 2. Refresh User if on user path or generic refresh needed
        // Fallback to genericToken if role-specific tokens are missing
        if ((studentToken || mentorToken || (genericToken && !isAdminPath)) && (!isAdminPath)) {
            import("./features/auth/authThunks").then(({ refreshAccessToken }) => {
                dispatch(refreshAccessToken());
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
          path="/student/payment"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/preferences/subjects"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <SubjectsSelectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/preferences/time-slots"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <TimeSlotsSelectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/preferences/mentors"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <MentorSelectionPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/wallet"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <WalletPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile-setup"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />



        <Route
          path="/student/my-courses"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <MyCourses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/payments"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <PaymentHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/classroom"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentClassroom />
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
          path="/mentor/profile"
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
          path="/mentor/students"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
              <MentorStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/availability"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
              <MentorAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
              <MentorAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/classroom"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
              <MentorClassroom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/completed-trial-classes"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
              <CompletedTrialClasses />
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

        <Route
          path="/admin/finance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <Finance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mentor-requests"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <MentorRequestsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/enrollments"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminEnrollmentsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/admin/logout" element={<AdminLoginPage />} />
        
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classroom"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminClassroom />
            </ProtectedRoute>
          }
        />


        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.MENTOR, ROLES.ADMIN]}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
  );
};

export default App;
