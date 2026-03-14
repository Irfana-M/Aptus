import { Navigate, useLocation } from "react-router-dom";
import { TokenManager, type UserRole } from "../utils/tokenManager";
import { ROUTES } from "../constants/routes.constants";
import * as Sentry from "@sentry/react";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();

  const role = TokenManager.getRole();
  const token = TokenManager.getToken();

  Sentry.addBreadcrumb({
    category: "routing",
    message: `ProtectedRoute: ${!!token ? "ALLOWED" : "BLOCKED — no token"}`,
    level: !!token ? "info" : "error",
    data: {
      path: location.pathname,
      tokenExists: !!token,
      roleFromStorage: role,
      allowedRoles,
      isRoleAllowed: !!(role && allowedRoles.includes(role)),
      studentToken: !!localStorage.getItem("student_accessToken"),
      mentorToken: !!localStorage.getItem("mentor_accessToken"),
      userRole: localStorage.getItem("userRole"),
    },
  });
  console.log(`[ProtectedRoute] ${!!token ? "✅ ALLOWED" : "❌ BLOCKED"} → ${location.pathname}`, {
    tokenExists: !!token,
    role,
    allowedRoles,
    studentToken: !!localStorage.getItem("student_accessToken"),
    mentorToken: !!localStorage.getItem("mentor_accessToken"),
    userRole: localStorage.getItem("userRole"),
  });

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (!role || !allowedRoles.includes(role)) {
    Sentry.addBreadcrumb({ category: "routing", message: `ProtectedRoute: ROLE MISMATCH — role=${role}, allowed=${allowedRoles}`, level: "error" });
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}
