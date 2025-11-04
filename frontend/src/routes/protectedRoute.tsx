import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROLES } from "../constants/roles";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const location = useLocation();

  const adminState = useSelector((state: any) => state.admin);
  const authState = useSelector((state: any) => state.auth);

  const user = adminState.admin || authState.user;
  const token = adminState.accessToken || authState.accessToken;
  const role = user?.role;

  console.log("ProtectedRoute Check:", {
    pathname: location.pathname,
    hasAdmin: !!adminState.admin,
    hasAuthUser: !!authState.user,
    user,
    token,
    role,
    allowedRoles,
  });

  if (!token) {
    if (allowedRoles.includes(ROLES.ADMIN)) {
      return <Navigate to="/admin/login" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  if (!allowedRoles.includes(role)) {
    if (role === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === ROLES.MENTOR) {
      return <Navigate to="/mentor/profile-setup" replace />;
    } else if (role === ROLES.STUDENT) {
      return <Navigate to="/student/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
