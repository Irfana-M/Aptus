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
  const authContext = AuthContext.getInstance();

  const path = location.pathname;

  // Get role from path (NOT from localStorage.userRole!)
  // Get role from path or tokens (for shared routes)
  const getPathRole = (): string | null => {
    if (path.startsWith("/admin")) return ROLES.ADMIN;
    if (path.startsWith("/student")) return ROLES.STUDENT;
    if (path.startsWith("/mentor")) return ROLES.MENTOR;

    // Shared routes mapping
    const sharedRoutes = [
      ROUTES.STUDENT.BOOK_FREE_TRIAL.split("/")[1],
      ROUTES.COMMON.VIDEO_CALL.split("/")[1],
      ROUTES.COMMON.NOTIFICATIONS,
      ROUTES.COMMON.CLASSROOM_TOKEN.split("/")[1],
    ];
    if (sharedRoutes.some((p) => path.includes(p))) {
      // SPECIAL CASE: Classroom link with token in URL
      if (path.includes(ROUTES.COMMON.CLASSROOM_TOKEN.split("/")[1])) {
        const urlToken = path.split("/").pop();
        if (urlToken && urlToken.includes(".")) {
          try {
            const payload = JSON.parse(atob(urlToken.split(".")[1]));
            if (payload.role) return payload.role;
          } catch {
            // Ignore decode errors
          }
        }
      }

      // If we are in a tab that already has a role locked, follow that
      const currentTabRole = authContext.getCurrentRole();
      if (currentTabRole) return currentTabRole;

      // Fallback: Detect role from available tokens
      const roles = [ROLES.STUDENT, ROLES.MENTOR, ROLES.ADMIN];
      for (const role of roles) {
        const token =
          localStorage.getItem(`${role}_accessToken`) ||
          (role === ROLES.ADMIN
            ? localStorage.getItem("adminAccessToken")
            : null);
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.role === role) return role;
          } catch {
            // Ignore decode errors
          }
        }
      }

      // Generic token check
      const genericToken = localStorage.getItem("accessToken");
      if (genericToken) {
        try {
          const payload = JSON.parse(atob(genericToken.split(".")[1]));
          if (payload.role) return payload.role;
        } catch {
          // Ignore decode errors
        }
      }
    }
    return null;
  };

  const pathRole = getPathRole();

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Set role in auth context for tab isolation
  useEffect(() => {
    if (pathRole) {
      authContext.setRoleFromPath(path);
    }
  }, [pathRole, path, authContext]);

  // Fetch student profile to get accurate onboardingStatus when accessing student paths
  useEffect(() => {
    const studentToken = localStorage.getItem("student_accessToken");
    const status =
      studentProfile?.onboardingStatus ?? authState.user?.onboardingStatus;

    // SKIP profile fetch if on a call route - those components handle their own data
    const isCallRoute =
      path.includes("/trial-class/") && path.endsWith("/call");

    // If status is missing, we need to fetch the profile to determine the onboarding state
    if (
      pathRole === ROLES.STUDENT &&
      studentToken &&
      !status &&
      !studentLoading &&
      !isCallRoute
    ) {
      console.log("📥 Fetching student profile for onboarding check...");
      dispatch(fetchStudentProfile());
    }
  }, [
    pathRole,
    studentProfile,
    studentLoading,
    authState.user,
    dispatch,
    path,
  ]);

  // Clean up contaminated localStorage.userRole
  useEffect(() => {
    const storedUserRole = localStorage.getItem("userRole");

    if (
      path.startsWith(ROUTES.STUDENT.DASHBOARD.split("/")[1]) &&
      storedUserRole === "admin"
    ) {
      console.log("🧹 Clearing admin userRole for student path");
      localStorage.removeItem("userRole");
    } else if (
      path.startsWith(ROUTES.ADMIN.DASHBOARD.split("/")[1]) &&
      storedUserRole &&
      storedUserRole !== "admin"
    ) {
      console.log(`🧹 Clearing ${storedUserRole} userRole for admin path`);
      localStorage.removeItem("userRole");
    } else if (
      path.startsWith(ROUTES.MENTOR.DASHBOARD.split("/")[1]) &&
      storedUserRole === "admin"
    ) {
      console.log("🧹 Clearing admin userRole for mentor path");
      localStorage.removeItem("userRole");
    }
  }, [path]);

  // Get token specifically for this path
  const getPathToken = (): string | null => {
    if (!pathRole) return null;

    // SPECIAL CASE: Classroom link with token in URL
    if (path.includes(ROUTES.COMMON.CLASSROOM_TOKEN.split("/")[1])) {
      const urlToken = path.split("/").pop();
      if (urlToken && urlToken.includes(".")) {
        return urlToken;
      }
    }

    // Convert role to lowercase for localStorage key
    const roleKey = pathRole.toLowerCase();
    const specificToken = localStorage.getItem(`${roleKey}_accessToken`);

    if (specificToken) return specificToken;

    // SMART FALLBACK: If specific token is missing, check the generic one
    const genericToken = localStorage.getItem("accessToken");
    if (genericToken) {
      try {
        const payload = JSON.parse(atob(genericToken.split(".")[1]));
        if (
          payload.role === roleKey ||
          (roleKey === "admin" && payload.role === "admin")
        ) {
          console.log(
            `🩹 Found matching generic token for ${roleKey}, using it.`,
          );
          return genericToken;
        }
      } catch (e) {
        console.error("Failed to decode generic token in ProtectedRoute", e);
      }
    }

    return null;
  };

  const token = getPathToken();

  // Special handling for landing page - always allow (AFTER all hooks)
  if (path === "/") {
    return children;
  }

  // BYPASS for call routes - those components handle their own loading and data fetching
  const isCallPath =
    (path.includes(ROUTES.STUDENT.BOOK_FREE_TRIAL.split("/")[1]) ||
      path.includes(ROUTES.COMMON.VIDEO_CALL.split("/")[1])) &&
    path.endsWith("/call");
  if (isCallPath) {
    return children;
  }

  // Show loading while state is being fetched
  if (pathRole === ROLES.STUDENT && studentLoading && !studentProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" color="teal" text="Verifying your session..." />
      </div>
    );
  }

  if (pathRole === ROLES.ADMIN && adminState.loading && !adminState.admin) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" color="teal" text="Loading admin console..." />
      </div>
    );
  }

  // Validate role consistency for this tab
  if (!authContext.validateRoleForPath(path)) {
    console.warn(
      `🚫 Role switching detected in same tab. Current role: ${authContext.getCurrentRole()}, Path role: ${pathRole}`,
    );

    // Redirect to current role's dashboard
    const currentRole = authContext.getCurrentRole();
    if (currentRole === ROLES.ADMIN) {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    if (currentRole === ROLES.STUDENT) {
      return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
    }
    if (currentRole === ROLES.MENTOR) {
      return <Navigate to={ROUTES.MENTOR.DASHBOARD} replace />;
    }
  }

  // Debug logging - REDUCED to avoid noise
  if (process.env.NODE_ENV === "development") {
    // Removed noisy debug logging
  }

  // If no token for this specific path, redirect to appropriate login
  if (!token) {
    if (path.includes("/trial-class/")) {
      // If it's a call link and we have NO tokens at all, then redirect
      if (
        !localStorage.getItem("student_accessToken") &&
        !localStorage.getItem("mentor_accessToken")
      ) {
        console.log(`❌ No tokens found for shared path ${path}`);
        return (
          <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />
        );
      }
    } else {
      console.log(`❌ No ${pathRole} token found for ${path}`);

      if (pathRole === ROLES.ADMIN) {
        return (
          <Navigate
            to={ROUTES.ADMIN.LOGIN}
            replace
            state={{ from: location }}
          />
        );
      }
      return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
    }
  }

  // Check if path role is allowed
  if (pathRole && !allowedRoles.includes(pathRole)) {
    console.log(`🚫 Role mismatch: ${pathRole} not in ${allowedRoles}`);

    // Redirect based on detected role
    if (pathRole === ROLES.ADMIN) {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    if (pathRole === ROLES.STUDENT) {
      return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
    }
    if (pathRole === ROLES.MENTOR) {
      return <Navigate to={ROUTES.MENTOR.DASHBOARD} replace />;
    }

    return <Navigate to={ROUTES.HOME} replace />;
  }

  // Get user from appropriate Redux state
  const user = pathRole === ROLES.ADMIN ? adminState.admin : authState.user;

  // Verify Redux state matches path role
  // Supress warning if:
  // 1. We are currently loading (rehydrating)
  // 2. We are on a shared route (trial-class call) where profile fetching is bypassed
  const isHydrating =
    pathRole === ROLES.ADMIN ? adminState.loading : authState.loading;
  const isBypassRoute =
    path.includes("/trial-class/") && path.endsWith("/call");

  if (
    pathRole === ROLES.ADMIN &&
    !adminState.admin &&
    !isHydrating &&
    !isBypassRoute
  ) {
    console.warn("⚠️ Admin path but no admin in Redux state");
  } else if (
    pathRole === ROLES.STUDENT &&
    !authState.user &&
    !isHydrating &&
    !isBypassRoute
  ) {
    console.warn("⚠️ Student path but no user in Redux state");
  } else if (
    pathRole === ROLES.MENTOR &&
    !authState.user &&
    !isHydrating &&
    !isBypassRoute
  ) {
    console.warn("⚠️ Mentor path but no user in Redux state");
  }

  if (pathRole === ROLES.STUDENT && !authState.user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader size="lg" color="teal" text="Loading session..." />
      </div>
    );
  }

  // Centralized Student Onboarding Guard
  if (pathRole === ROLES.STUDENT && user) {
    // Merge fresh profile data if available to prevent stale token redirects
    const effectiveUser = studentProfile
      ? ({
          ...user,
          ...studentProfile,
          // Ensure compatibility if types differ slightly
          isProfileComplete:
            studentProfile.isProfileCompleted ??
            (user as User).isProfileComplete,
          // Explicitly use onboardingStatus from profile if present
          onboardingStatus:
            studentProfile.onboardingStatus ?? (user as User).onboardingStatus,
        } as User)
      : (user as User);

    const isTrialRoute = path.startsWith("/trial-class/");
    const redirect = isTrialRoute ? null : getStudentRedirect(effectiveUser);

    if (redirect && redirect !== path) {
      console.log(
        `🛡️ Onboarding Guard: Redirecting from ${path} to ${redirect}`,
        {
          status: effectiveUser.onboardingStatus,
        },
      );
      return <Navigate to={redirect} replace />;
    }
  }

  // Mentor-specific flow logic
  if (pathRole === ROLES.MENTOR && user) {
    const approvalStatus = (user as { approvalStatus?: string })
      ?.approvalStatus;

    if (path.includes(ROUTES.MENTOR.DASHBOARD)) {
      if (approvalStatus !== "approved") {
        return <Navigate to={ROUTES.MENTOR.PROFILE_SETUP} replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
