import { Navigate, useLocation } from "react-router-dom";
import { TokenManager, type UserRole } from "../utils/tokenManager";
import { ROUTES } from "../constants/routes.constants";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: UserRole[]
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation();

  const role = TokenManager.getRole();
const token = role ? TokenManager.getToken(role) : null;

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}