import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { ROLES } from "../constants/roles";
import { ROUTES } from "../constants/routes.constants";
import { AuthContext } from "../utils/authContext";
import { fetchStudentProfile } from "../features/student/studentThunk";
import { getStudentRedirect } from "../utils/StudentOnboardingGuard";
import type { User } from "../types/auth.types";
import { Loader } from "../components/ui/Loader";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const adminState = useSelector((state: RootState) => state.admin);
  const authState = useSelector((state: RootState) => state.auth);

  const studentProfile = useSelector(
    (state: RootState) => state.student?.profile,
  );
  const studentLoading = useSelector(
    (state: RootState) => state.student?.loading,
  );
  const studentError = useSelector((state: RootState) => state.student?.error);

  const authContext = AuthContext.getInstance();

  const path = location.pathname;

  /* ------------------------------------------------ */
  /* ROLE DETECTION                                   */
  /* ------------------------------------------------ */

  const getPathRole = (): string | null => {
    if (path.startsWith("/admin")) return ROLES.ADMIN;
    if (path.startsWith("/student")) return ROLES.STUDENT;
    if (path.startsWith("/mentor")) return ROLES.MENTOR;

    return null;
  };

  const pathRole = getPathRole();

  /* ------------------------------------------------ */
  /* SET ROLE IN AUTH CONTEXT                         */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (pathRole) {
      authContext.setRoleFromPath(path);
    }
  }, [pathRole, path, authContext]);

  /* ------------------------------------------------ */
  /* FETCH STUDENT PROFILE                            */
  /* ------------------------------------------------ */

  useEffect(() => {
    const studentToken = localStorage.getItem("student_accessToken");

    const isCallRoute =
      path.includes("/trial-class/") && path.includes("/call");

    if (
      pathRole === ROLES.STUDENT &&
      studentToken &&
      !studentProfile &&
      !studentLoading &&
      !studentError &&
      !isCallRoute
    ) {
      dispatch(fetchStudentProfile());
    }
  }, [pathRole, studentProfile, studentLoading, studentError, dispatch, path]);

  /* ------------------------------------------------ */
  /* TOKEN DETECTION                                  */
  /* ------------------------------------------------ */

  const getToken = (): string | null => {
    if (!pathRole) return null;

    const roleKey = pathRole.toLowerCase();
    const specificToken = localStorage.getItem(`${roleKey}_accessToken`);

    if (specificToken) return specificToken;

    const genericToken = localStorage.getItem("accessToken");

    if (genericToken) {
      try {
        const payload = JSON.parse(atob(genericToken.split(".")[1]));

        if (payload.role === roleKey) {
          return genericToken;
        }
      } catch {
        return null;
      }
    }

    return null;
  };

  const token = getToken();

  /* ------------------------------------------------ */
  /* LANDING PAGE                                     */
  /* ------------------------------------------------ */

  if (path === "/") {
    return children;
  }

  /* ------------------------------------------------ */
  /* BYPASS CALL ROUTES                               */
  /* ------------------------------------------------ */

  const isCallPath =
    (path.includes(ROUTES.STUDENT.BOOK_FREE_TRIAL.split("/")[1]) ||
      path.includes(ROUTES.COMMON.VIDEO_CALL.split("/")[1])) &&
    path.includes("/call");

  if (isCallPath) {
    return children;
  }

  /* ------------------------------------------------ */
  /* STUDENT LOADER                                   */
  /* ------------------------------------------------ */

  if (pathRole === ROLES.STUDENT && studentLoading && !studentProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader
          size="lg"
          color="teal"
          text="Verifying your student profile..."
        />
      </div>
    );
  }

  /* ------------------------------------------------ */
  /* ADMIN LOADER                                     */
  /* ------------------------------------------------ */

  if (pathRole === ROLES.ADMIN && adminState.loading && !adminState.admin) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" color="teal" text="Loading admin console..." />
      </div>
    );
  }

  /* ------------------------------------------------ */
  /* ROLE VALIDATION                                  */
  /* ------------------------------------------------ */

  if (!authContext.validateRoleForPath(path)) {
    const currentRole = authContext.getCurrentRole();

    if (currentRole === ROLES.ADMIN)
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;

    if (currentRole === ROLES.STUDENT)
      return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;

    if (currentRole === ROLES.MENTOR)
      return <Navigate to={ROUTES.MENTOR.DASHBOARD} replace />;
  }

  /* ------------------------------------------------ */
  /* TOKEN CHECK                                      */
  /* ------------------------------------------------ */

  if (!token) {
    if (pathRole === ROLES.ADMIN) {
      return <Navigate to={ROUTES.ADMIN.LOGIN} replace />;
    }

    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  /* ------------------------------------------------ */
  /* ROLE ALLOWED CHECK                               */
  /* ------------------------------------------------ */

  if (pathRole && !allowedRoles.includes(pathRole)) {
    if (pathRole === ROLES.ADMIN)
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;

    if (pathRole === ROLES.STUDENT)
      return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;

    if (pathRole === ROLES.MENTOR)
      return <Navigate to={ROUTES.MENTOR.DASHBOARD} replace />;

    return <Navigate to={ROUTES.HOME} replace />;
  }

  /* ------------------------------------------------ */
  /* USER STATE                                       */
  /* ------------------------------------------------ */

  const user = pathRole === ROLES.ADMIN ? adminState.admin : authState.user;

  if (pathRole === ROLES.STUDENT && !authState.user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" color="teal" text="Loading session..." />
      </div>
    );
  }

  /* ------------------------------------------------ */
  /* STUDENT ONBOARDING GUARD                         */
  /* ------------------------------------------------ */

  if (pathRole === ROLES.STUDENT && user) {
    const effectiveUser = studentProfile
      ? ({
          ...user,
          ...studentProfile,
          isProfileComplete:
            studentProfile.isProfileCompleted ??
            (user as User).isProfileComplete,
          onboardingStatus:
            studentProfile.onboardingStatus ?? (user as User).onboardingStatus,
        } as User)
      : (user as User);

    const redirect = getStudentRedirect(effectiveUser, path);

    console.log("Redirect check:", {
      currentPath: path,
      redirectTo: redirect,
      status: effectiveUser.onboardingStatus,
    });

    if (redirect && redirect !== path && !path.startsWith(redirect)) {
      return <Navigate to={redirect} replace />;
    }
  }

  /* ------------------------------------------------ */
  /* MENTOR FLOW                                      */
  /* ------------------------------------------------ */

  if (pathRole === ROLES.MENTOR && user) {
    const approvalStatus = (user as { approvalStatus?: string })
      ?.approvalStatus;

    if (
      path.includes(ROUTES.MENTOR.DASHBOARD) &&
      approvalStatus !== "approved"
    ) {
      return <Navigate to={ROUTES.MENTOR.PROFILE_SETUP} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
