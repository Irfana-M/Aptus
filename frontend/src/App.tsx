import React, { useEffect } from "react";
import { useAppDispatch } from "./app/hooks";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Loader } from "./components/ui/Loader";

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
import MentorRequestsPage from "./pages/admin/MentorRequestsPage";
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
// Lazy load PaymentPage to prevent early Stripe initialization crash
const PaymentPage = React.lazy(() => import("./pages/student/PaymentPage"));
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
import ClassHistory from "./pages/mentor/ClassHistory";
import SubjectsSelectionPage from "./pages/student/preferences/SubjectsSelectionPage";
import TimeSlotsSelectionPage from "./pages/student/preferences/TimeSlotsSelectionPage";
import MentorSelectionPage from "./pages/student/preferences/MentorSelectionPage";
import MentorStudyMaterials from "./pages/mentor/MentorStudyMaterials";
import MentorExamList from "./pages/mentor/exams/MentorExamList";
import CreateExam from "./pages/mentor/exams/CreateExam";
import StudentExamList from "./pages/student/exams/StudentExamList";
import TakeExam from "./pages/student/exams/TakeExam";
import ExamResultPage from "./pages/student/exams/ExamResult";
import StudentStudyMaterials from "./pages/student/StudentStudyMaterials";
import MentorExamResults from "./pages/mentor/exams/MentorExamResults";
import ExamGrading from "./pages/mentor/exams/ExamGrading";
import StudentExamAnalysis from "./pages/student/exams/StudentExamAnalysis";
import SessionJoin from "./pages/scheduling/SessionJoin";
import MentorLeaves from "./pages/mentor/Leaves";
import LeaveManagement from "./pages/admin/LeaveManagement";

import { VideoCallProvider } from "./context/VideoCallContext";
import FloatingCallOverlay from "./components/video/FloatingCallOverlay";
import NotificationsPage from "./pages/common/NotificationsPage";

import { ROUTES } from "./constants/routes.constants";
import { refreshAccessToken } from "./features/auth/authThunks";
import { TokenManager } from "./utils/tokenManager";

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
    const token = TokenManager.getAnyToken();
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");

    if (token  && !justLoggedIn) {
      dispatch(refreshAccessToken());
    }
     sessionStorage.removeItem("justLoggedIn");
  }, [dispatch]);
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<LandingPage />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.VERIFY_OTP} element={<VerifyOtp />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      <Route path={ROUTES.AUTH.GOOGLE_CALLBACK} element={<GoogleCallback />} />

      <Route path={ROUTES.ADMIN.LOGIN} element={<AdminLoginPage />} />

      <Route
        path={ROUTES.ADMIN.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.MENTORS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <MentorsManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.MENTOR_DETAILS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <MentorProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.STUDENTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <StudentsManagement />
          </ProtectedRoute>
        }
      />

      {/* Student Profile - plural path (primary) */}
      <Route
        path={ROUTES.ADMIN.STUDENT_DETAILS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <StudentProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Student Profile - singular path (legacy support) */}
      <Route
        path={ROUTES.ADMIN.STUDENT_PROFILE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <StudentProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.TRIAL_CLASSES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <TrialClassesManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.STUDENT_TRIAL_CLASSES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <StudentTrialClassesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.TRIAL_CLASS_DETAILS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <TrialClassDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.COMMON.VIDEO_CALL}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR, ROLES.STUDENT]}>
            <VideoCallRoom />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.COMMON.SESSION_CALL}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR, ROLES.STUDENT]}>
            <VideoCallRoom />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.COMMON.CLASSROOM_TOKEN}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR, ROLES.STUDENT]}>
            <SessionJoin />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.COMMON.TRIAL_FEEDBACK}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <TrialClassFeedback />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.BOOK_FREE_TRIAL}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <TrialBookingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.TIME_SLOTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <BookTuitionSessions />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.SUBSCRIPTION_PLANS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <SubscriptionPlans />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.PAYMENT}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <React.Suspense
              fallback={
                <div className="flex justify-center p-8">
                  Loading Payment Gateway...
                </div>
              }
            >
              <PaymentPage />
            </React.Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.PREFERENCES.SUBJECTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <SubjectsSelectionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.PREFERENCES.TIME_SLOTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <TimeSlotsSelectionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.PREFERENCES.MENTORS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <MentorSelectionPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.PROFILE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT.PROFILE_SETUP}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.MY_COURSES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <MyCourses />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.STUDENT.PAYMENTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <PaymentHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT.ATTENDANCE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT.CLASSROOM}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentClassroom />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT.STUDY_MATERIALS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentStudyMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT.EXAMS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentExamList />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT.EXAM_TAKE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <TakeExam />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT.RESULTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <ExamResultPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.STUDENT.RESULT_DETAILS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <StudentExamAnalysis />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.MENTOR.PROFILE_SETUP}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorProfileSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.MENTOR.PROFILE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorProfileSetup />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.MENTOR.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.STUDENTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.AVAILABILITY}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorAvailabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.ATTENDANCE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.CLASSROOM}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorClassroom />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.CLASS_HISTORY}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <ClassHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.EXAMS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorExamList />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.CREATE_EXAM}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <CreateExam />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.EXAM_RESULTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <React.Suspense
              fallback={<Loader size="lg" text="Loading Dashboard..." />}
            >
              <MentorExamResults />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.EXAM_GRADING}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <React.Suspense
              fallback={<Loader size="lg" text="Loading Page..." />}
            >
              <ExamGrading />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.LEAVES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorLeaves />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MENTOR.STUDY_MATERIALS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
            <MentorStudyMaterials />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.COURSES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <CreateOneToOneCourse />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.FINANCE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <Finance />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.MENTOR_REQUESTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <MentorRequestsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ADMIN.ENROLLMENTS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminEnrollmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN.LEAVES}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <LeaveManagement />
          </ProtectedRoute>
        }
      />

      <Route path={ROUTES.ADMIN.LOGOUT} element={<AdminLoginPage />} />

      <Route
        path={ROUTES.ADMIN.ATTENDANCE}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminAttendance />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.COMMON.NOTIFICATIONS}
        element={
          <ProtectedRoute
            allowedRoles={[ROLES.STUDENT, ROLES.MENTOR, ROLES.ADMIN]}
          >
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
