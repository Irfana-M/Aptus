// import React, { useEffect } from "react";
// import { useAppDispatch } from "./app/hooks";
// import { Toaster } from "react-hot-toast";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { Loader } from "./components/ui/Loader";

// import LandingPage from "./pages/LandingPage";
// import Register from "./pages/auth/Registration";
// import VerifyOtp from "./pages/auth/VerifyOtp";
// import Login from "./pages/auth/Login";
// import AdminLoginPage from "./pages/admin/Login";
// import Dashboard from "./pages/admin/adminDashboard";
// import GoogleCallback from "./pages/auth/GoogleCallback";
// import ForgotPassword from "./pages/auth/ForgotPassword";
// import ResetPassword from "./pages/auth/ResetPassword";
// import MentorProfileSetup from "./pages/mentor/ProfileSetup";
// import MentorProfilePage from "./pages/admin/mentorProfile";
// import MentorsManagement from "./pages/admin/mentors";
// import ProtectedRoute from "./routes/protectedRoute";
// import { ROLES } from "./constants/roles";
// import StudentsManagement from "./pages/admin/student";
// import TrialBookingPage from "./pages/student/TrialBookingPage";
// import TrialClassesManagement from "./pages/admin/TrialClassesManagement";
// import MentorRequestsPage from './pages/admin/MentorRequestsPage';
// import StudentProfilePage from "./pages/admin/StudentProfile";
// import AdminEnrollmentsPage from "./pages/admin/AdminEnrollmentsPage";
// import TrialClassDetailsPage from "./pages/admin/TrialClassDetails";
// import StudentTrialClassesPage from "./pages/admin/StudentTrialClassPage";
// import CreateOneToOneCourse from "./pages/admin/courseManagement";
// import VideoCallRoom from "./pages/VideoCallRoom";
// import Finance from "./pages/admin/Finance";
// import TrialClassFeedback from "./pages/student/TrialFeedback";
// import StudentProfile from "./pages/student/StudentProfile";
// import StudentDashboard from "./pages/student/dashboard";
// import BookTuitionSessions from "./pages/student/BookTuitionSessions";
// import SubscriptionPlans from "./pages/student/SubscriptionPlans";
// // Lazy load PaymentPage to prevent early Stripe initialization crash
// const PaymentPage = React.lazy(() => import("./pages/student/PaymentPage"));
// import PaymentHistory from "./pages/student/PaymentHistory";
// import MyCourses from "./pages/student/MyCourses";
// import MentorDashboard from "./pages/mentor/MentorDashboard";
// import MentorAvailabilityPage from "./pages/mentor/Availability";
// import MentorStudentsPage from "./pages/mentor/Students";
// import MentorAttendance from "./pages/mentor/Attendance";
// import MentorClassroom from "./pages/mentor/Classroom";
// import StudentAttendance from "./pages/student/Attendance";
// import StudentClassroom from "./pages/student/Classroom";
// import AdminAttendance from "./pages/admin/Attendance";
// import ClassHistory from "./pages/mentor/ClassHistory";
// import SubjectsSelectionPage from "./pages/student/preferences/SubjectsSelectionPage";
// import TimeSlotsSelectionPage from "./pages/student/preferences/TimeSlotsSelectionPage";
// import MentorSelectionPage from "./pages/student/preferences/MentorSelectionPage";
// import MentorStudyMaterials from "./pages/mentor/MentorStudyMaterials";
// import MentorExamList from "./pages/mentor/exams/MentorExamList";
// import CreateExam from "./pages/mentor/exams/CreateExam";
// import StudentExamList from "./pages/student/exams/StudentExamList";
// import TakeExam from "./pages/student/exams/TakeExam";
// import ExamResultPage from "./pages/student/exams/ExamResult";
// import StudentStudyMaterials from "./pages/student/StudentStudyMaterials";
// import MentorExamResults from "./pages/mentor/exams/MentorExamResults";
// import ExamGrading from "./pages/mentor/exams/ExamGrading";
// import StudentExamAnalysis from "./pages/student/exams/StudentExamAnalysis";
// import SessionJoin from "./pages/scheduling/SessionJoin";
// import MentorLeaves from "./pages/mentor/Leaves";
// import LeaveManagement from "./pages/admin/LeaveManagement";


// import { VideoCallProvider } from "./context/VideoCallContext";
// import FloatingCallOverlay from "./components/video/FloatingCallOverlay";
// import NotificationsPage from "./pages/common/NotificationsPage";

// import { ROUTES } from "./constants/routes.constants";

// const App: React.FC = () => {
//   return (
//     <Router>
//       <VideoCallProvider>
//       <Toaster
//         position="top-right"
//         toastOptions={{
//           duration: 4000,
//           style: {
//             background: "#363636",
//             color: "#fff",
//           },
//           success: {
//             duration: 3000,
//             iconTheme: {
//               primary: "#10B981",
//               secondary: "#fff",
//             },
//           },
//           error: {
//             duration: 4000,
//             iconTheme: {
//               primary: "#EF4444",
//               secondary: "#fff",
//             },
//           },
//         }}
//       />
//       <AppContent />
//       <FloatingCallOverlay />
//       </VideoCallProvider>
//     </Router>
//   );
// };

// const AppContent: React.FC = () => {
//     const dispatch = useAppDispatch();
    
//     useEffect(() => {
//         const path = window.location.pathname;
        
//         // Sync AuthContext with current path to ensure interceptors have correct role
//         import("./utils/authContext").then(({ AuthContext }) => {
//             AuthContext.getInstance().setRoleFromPath(path);
//         });

//         //const userRole = localStorage.getItem("userRole");
//         const studentToken = localStorage.getItem("student_accessToken");
//         const mentorToken = localStorage.getItem("mentor_accessToken");
//         const adminToken = localStorage.getItem("admin_accessToken") || localStorage.getItem("adminAccessToken");
//         const genericToken = localStorage.getItem("accessToken");
        
//         // Prioritize refresh based on current path to avoid race conditions
//         const isAdminPath = path.startsWith(ROUTES.ADMIN.DASHBOARD.split('/')[1]);
//         const isStudentPath = path.startsWith(ROUTES.STUDENT.DASHBOARD.split('/')[1]);
//         const isMentorPath = path.startsWith(ROUTES.MENTOR.DASHBOARD.split('/')[1]);
        
//         // 1. Refresh Admin if on admin path or generic refresh needed and we are admin
//         if (adminToken && (isAdminPath || (!isStudentPath && !isMentorPath))) {
//             import("./features/admin/adminThunk").then(({ refreshAdminToken }) => {
//                 dispatch(refreshAdminToken());
//             });
//         }
        
//         // 2. Refresh User if on user path or generic refresh needed
//         // Fallback to genericToken if role-specific tokens are missing
//         const normalizedPath = path.toLowerCase().replace(/\/$/, "");
//         const normalizedCallback = ROUTES.AUTH.GOOGLE_CALLBACK.toLowerCase().replace(/\/$/, "");
//         const isGoogleCallbackPath = normalizedPath === normalizedCallback;
        
//         // Skip refresh if we already have the user in state (e.g. just logged in via Google)
//         // or if we are on the callback path
//         import("./app/store").then(({ store }) => {
//             const state = store.getState();
//             const hasUser = !!state.auth.user;
            
//             if (!hasUser) {
//               import("./features/auth/authSlice").then(({ initAuthFromStorage }) => {
//                  dispatch(initAuthFromStorage());
//               });
//             }
            
//             if ((studentToken || mentorToken || (genericToken && !isAdminPath)) && (!isAdminPath) && !isGoogleCallbackPath && !hasUser) {
//                 import("./features/auth/authThunks").then(({ refreshAccessToken }) => {
//                     dispatch(refreshAccessToken());
//                 });
//             }
//         });
//     }, [dispatch]);

//   return (
//       <Routes>
//         <Route path={ROUTES.HOME} element={<LandingPage />} />
//         <Route path={ROUTES.REGISTER} element={<Register />} />
//         <Route path={ROUTES.VERIFY_OTP} element={<VerifyOtp />} />
//         <Route path={ROUTES.LOGIN} element={<Login />} />
//         <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
//         <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
//         <Route path={ROUTES.AUTH.GOOGLE_CALLBACK} element={<GoogleCallback />} />

//         <Route path={ROUTES.ADMIN.LOGIN} element={<AdminLoginPage />} />

//         <Route
//           path={ROUTES.ADMIN.DASHBOARD}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <Dashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.ADMIN.MENTORS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <MentorsManagement />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.ADMIN.MENTOR_DETAILS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <MentorProfilePage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.ADMIN.STUDENTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <StudentsManagement />
//             </ProtectedRoute>
//           }
//         />

//         {/* Student Profile - plural path (primary) */}
//         <Route
//           path={ROUTES.ADMIN.STUDENT_DETAILS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <StudentProfilePage />
//             </ProtectedRoute>
//           }
//         />

//         {/* Student Profile - singular path (legacy support) */}
//           <Route
//           path={ROUTES.ADMIN.STUDENT_PROFILE}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <StudentProfilePage />
//             </ProtectedRoute>
//           }
//         />

//         <Route path={ROUTES.ADMIN.TRIAL_CLASSES} element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <TrialClassesManagement />
//             </ProtectedRoute>
//           }
//         />

//         <Route path={ROUTES.ADMIN.STUDENT_TRIAL_CLASSES} element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <StudentTrialClassesPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.ADMIN.TRIAL_CLASS_DETAILS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <TrialClassDetailsPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.COMMON.VIDEO_CALL}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR, ROLES.STUDENT]}>
//               <VideoCallRoom />
//             </ProtectedRoute>
//           }
//         />
        
//         <Route
//           path={ROUTES.COMMON.SESSION_CALL}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR, ROLES.STUDENT]}>
//               <VideoCallRoom />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.COMMON.CLASSROOM_TOKEN}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR, ROLES.STUDENT]}>
//               <SessionJoin />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.COMMON.TRIAL_FEEDBACK}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <TrialClassFeedback />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.BOOK_FREE_TRIAL}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <TrialBookingPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.TIME_SLOTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <BookTuitionSessions />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.SUBSCRIPTION_PLANS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <SubscriptionPlans />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.PAYMENT}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <React.Suspense fallback={<div className="flex justify-center p-8">Loading Payment Gateway...</div>}>
//                 <PaymentPage />
//               </React.Suspense>
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.PREFERENCES.SUBJECTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <SubjectsSelectionPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.PREFERENCES.TIME_SLOTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <TimeSlotsSelectionPage />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.PREFERENCES.MENTORS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <MentorSelectionPage />
//             </ProtectedRoute>
//           }
//         />


//         <Route
//           path={ROUTES.STUDENT.PROFILE}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <StudentProfile />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.STUDENT.PROFILE_SETUP}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <StudentProfile />
//             </ProtectedRoute>
//           }
//         />



//         <Route
//           path={ROUTES.STUDENT.MY_COURSES}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <MyCourses />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.DASHBOARD}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <StudentDashboard />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.STUDENT.PAYMENTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <PaymentHistory />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.STUDENT.ATTENDANCE}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <StudentAttendance />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.STUDENT.CLASSROOM}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <StudentClassroom />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.STUDENT.STUDY_MATERIALS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//               <StudentStudyMaterials />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.STUDENT.EXAMS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//                <StudentExamList />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//             path={ROUTES.STUDENT.EXAM_TAKE}
//             element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//                 <TakeExam />
//             </ProtectedRoute>
//             }
//         />
//         <Route
//             path={ROUTES.STUDENT.RESULTS}
//             element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//                 <ExamResultPage />
//             </ProtectedRoute>
//             }
//         />
//         <Route
//             path={ROUTES.STUDENT.RESULT_DETAILS}
//             element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
//                 <StudentExamAnalysis />
//             </ProtectedRoute>
//             }
//         />

//         <Route
//           path={ROUTES.MENTOR.PROFILE_SETUP}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorProfileSetup />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.MENTOR.PROFILE}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorProfileSetup />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.MENTOR.DASHBOARD}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorDashboard />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.STUDENTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorStudentsPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.AVAILABILITY}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorAvailabilityPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.ATTENDANCE}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorAttendance />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.CLASSROOM}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorClassroom />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.CLASS_HISTORY}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <ClassHistory />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.EXAMS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorExamList />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.CREATE_EXAM}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <CreateExam />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.EXAM_RESULTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <React.Suspense fallback={<Loader size="lg" text="Loading Dashboard..." />}>
//                   <MentorExamResults />
//               </React.Suspense>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.EXAM_GRADING}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//                <React.Suspense fallback={<Loader size="lg" text="Loading Page..." />}>
//                   <ExamGrading />
//                </React.Suspense>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.LEAVES}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorLeaves />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.MENTOR.STUDY_MATERIALS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.MENTOR]}>
//               <MentorStudyMaterials />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.ADMIN.COURSES}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <CreateOneToOneCourse />
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path={ROUTES.ADMIN.FINANCE}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <Finance />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.ADMIN.MENTOR_REQUESTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <MentorRequestsPage />
//             </ProtectedRoute>
//           }
//         />
        
//         <Route
//           path={ROUTES.ADMIN.ENROLLMENTS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <AdminEnrollmentsPage />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path={ROUTES.ADMIN.LEAVES}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <LeaveManagement />
//             </ProtectedRoute>
//           }
//         />

//         <Route path={ROUTES.ADMIN.LOGOUT} element={<AdminLoginPage />} />
        
//         <Route
//           path={ROUTES.ADMIN.ATTENDANCE}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
//               <AdminAttendance />
//             </ProtectedRoute>
//           }
//         />


//         <Route
//           path={ROUTES.COMMON.NOTIFICATIONS}
//           element={
//             <ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.MENTOR, ROLES.ADMIN]}>
//               <NotificationsPage />
//             </ProtectedRoute>
//           }
//         />
//       </Routes>
//   );
// };

// export default App;

import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState,AppDispatch } from "./app/store";
import { ROLES } from "./constants/roles";
import { ROUTES } from "./constants/routes.constants";
import { AuthContext } from "./utils/authContext";
import { fetchStudentProfile } from "./features/student/studentThunk";
import { getStudentRedirect } from "./utils/StudentOnboardingGuard";
import type { User } from "./types";
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { pathname: path } = location;

  const adminState = useSelector((state: RootState) => state.admin);
  const authState = useSelector((state: RootState) => state.auth);
  const studentProfile = useSelector((state: RootState) => state.student?.profile);
  const studentLoading = useSelector((state: RootState) => state.student?.loading);

  const authContext = AuthContext.getInstance();

  // ────────────────────────────────────────────────
  //  Prevent fetching profile multiple times per navigation
  // ────────────────────────────────────────────────
  const fetchAttempted = useRef<Record<string, boolean>>({});

  const pathKey = `${path}-${authContext.getCurrentRole() || "unknown"}`;

  // Reset fetch attempt when path or role changes significantly
  useEffect(() => {
    fetchAttempted.current = {};
  }, [path, authContext.getCurrentRole()]);

  // ────────────────────────────────────────────────
  //  Determine role from path (most reliable source)
  // ────────────────────────────────────────────────
  const getPathRole = (): string | null => {
    if (path.startsWith("/admin")) return ROLES.ADMIN;
    if (path.startsWith("/student")) return ROLES.STUDENT;
    if (path.startsWith("/mentor")) return ROLES.MENTOR;

    // Shared routes
    const sharedPrefixes = [
      ROUTES.STUDENT.BOOK_FREE_TRIAL.split("/")[1],
      ROUTES.COMMON.VIDEO_CALL.split("/")[1],
      ROUTES.COMMON.NOTIFICATIONS,
      ROUTES.COMMON.CLASSROOM_TOKEN.split("/")[1],
    ];

    if (sharedPrefixes.some((p) => path.includes(p))) {
      // Classroom token special case
      if (path.includes(ROUTES.COMMON.CLASSROOM_TOKEN.split("/")[1])) {
        const tokenPart = path.split("/").pop();
        if (tokenPart?.includes(".")) {
          try {
            const payload = JSON.parse(atob(tokenPart.split(".")[1]));
            if (payload.role) return payload.role;
          } catch {
            // silent fail
          }
        }
      }

      // Prefer locked tab role
      const tabRole = authContext.getCurrentRole();
      if (tabRole) return tabRole;

      // Fallback: token inspection
      for (const role of [ROLES.STUDENT, ROLES.MENTOR, ROLES.ADMIN]) {
        const key = role === ROLES.ADMIN ? "adminAccessToken" : `${role.toLowerCase()}_accessToken`;
        const token = localStorage.getItem(key);
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.role === role) return role;
          } catch {}
        }
      }
    }

    return null;
  };

  const pathRole = getPathRole();

  // Lock role in context (runs when pathRole becomes available)
  useEffect(() => {
    if (pathRole) {
      authContext.setRoleFromPath(path);
    }
  }, [pathRole, path]);

  // ────────────────────────────────────────────────
  //  Fetch student profile — ONLY when clearly needed
  // ────────────────────────────────────────────────
  useEffect(() => {
    const studentToken = localStorage.getItem("student_accessToken");
    const isCallRoute = path.includes("/trial-class/") && path.includes("/call");

    if (
      pathRole !== ROLES.STUDENT ||
      !studentToken ||
      studentProfile ||        // already have it → skip
      studentLoading ||        // already fetching → skip
      isCallRoute ||           // call pages handle their own data
      fetchAttempted.current[pathKey] // already tried on this path+role
    ) {
      return;
    }

    console.log("📥 Fetching student profile for onboarding check");
    fetchAttempted.current[pathKey] = true;
    dispatch(fetchStudentProfile());
  }, [pathRole, path, studentProfile, studentLoading, dispatch]);

  // ────────────────────────────────────────────────
  //  Early returns & loading states
  // ────────────────────────────────────────────────
  if (path === "/") {
    return children;
  }

  const isCallPath =
    (path.includes(ROUTES.STUDENT.BOOK_FREE_TRIAL.split("/")[1]) ||
      path.includes(ROUTES.COMMON.VIDEO_CALL.split("/")[1])) &&
    path.includes("/call");

  if (isCallPath) {
    return children;
  }

  if (pathRole === ROLES.STUDENT && (studentLoading || !studentProfile)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" color="teal" text="Verifying your student profile..." />
      </div>
    );
  }

  if (pathRole === ROLES.ADMIN && adminState.loading && !adminState.admin) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" color="tealth" text="Loading admin console..." />
      </div>
    );
  }

  // ────────────────────────────────────────────────
  //  Token & role validation
  // ────────────────────────────────────────────────
  const token = (() => {
    if (!pathRole) return null;
    if (path.includes(ROUTES.COMMON.CLASSROOM_TOKEN.split("/")[1])) {
      return path.split("/").pop() || null;
    }
    const key = pathRole === ROLES.ADMIN ? "adminAccessToken" : `${pathRole.toLowerCase()}_accessToken`;
    return localStorage.getItem(key) || localStorage.getItem("accessToken") || null;
  })();

  if (!token) {
    if (pathRole === ROLES.ADMIN) {
      return <Navigate to={ROUTES.ADMIN.LOGIN} replace state={{ from: location }} />;
    }
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(pathRole ?? "")) {
    if (pathRole === ROLES.ADMIN) return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    if (pathRole === ROLES.STUDENT) return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
    if (pathRole === ROLES.MENTOR) return <Navigate to={ROUTES.MENTOR.DASHBOARD} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }

  // Role consistency check (tab isolation)
  if (!authContext.validateRoleForPath(path)) {
    const current = authContext.getCurrentRole();
    if (current === ROLES.ADMIN) return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    if (current === ROLES.STUDENT) return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
    if (current === ROLES.MENTOR) return <Navigate to={ROUTES.MENTOR.DASHBOARD} replace />;
  }

  // Get correct user object
  const user = pathRole === ROLES.ADMIN ? adminState.admin : authState.user;

  // Student Onboarding Guard
  if (pathRole === ROLES.STUDENT && user) {
    const effectiveUser = studentProfile
      ? ({
          ...user,
          ...studentProfile,
          isProfileComplete: studentProfile.isProfileCompleted ?? (user as User).isProfileComplete,
          onboardingStatus: studentProfile.onboardingStatus ?? (user as User).onboardingStatus,
        } as User)
      : (user as User);

    const isTrialRoute = path.startsWith("/trial-class/");
    const redirect = isTrialRoute ? null : getStudentRedirect(effectiveUser);

    if (redirect && redirect !== path) {
      return <Navigate to={redirect} replace />;
    }
  }

  // Mentor approval check
  if (pathRole === ROLES.MENTOR && user) {
    const approvalStatus = (user as any).approvalStatus;
    if (path.includes(ROUTES.MENTOR.DASHBOARD) && approvalStatus !== "approved") {
      return <Navigate to={ROUTES.MENTOR.PROFILE_SETUP} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;