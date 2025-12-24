import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../app/store";
import { logoutAdmin } from "../features/admin/adminSlice";
import { logout } from "../features/auth/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const adminAuth = useSelector((state: RootState) => state.admin);
  const userAuth = useSelector((state: RootState) => state.auth);

  const isAdminAuthenticated = !!adminAuth.accessToken;
  const isUserAuthenticated = !!userAuth?.accessToken;

  const adminLogout = (redirectPath: string = "/admin/login") => {
    dispatch(logoutAdmin());
    localStorage.removeItem("admin_accessToken");
    localStorage.removeItem("adminAccessToken");
    sessionStorage.removeItem("active_role"); 
    navigate(redirectPath, { replace: true });
  };

  const userLogout = (redirectPath: string = "/login") => {
    dispatch(logout());
    const userRole = localStorage.getItem("userRole");
    if (userRole) {
      localStorage.removeItem(`${userRole}_accessToken`);
    }
    const sharedKeys = [
        "accessToken",
        "userRole",
        "userId",
        "isTrialCompleted",
        "isProfileComplete",
        "hasPaid"
    ];
    sharedKeys.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    navigate(redirectPath, { replace: true });
  };

  const getCurrentToken = (): string | null => {
    return adminAuth.accessToken || userAuth?.accessToken || null;
  };

  const getCurrentUser = () => {
    return adminAuth.admin || userAuth?.user || null;
  };

  return {
    isAdminAuthenticated,
    admin: adminAuth.admin,
    adminToken: adminAuth.accessToken,

    isUserAuthenticated,
    user: userAuth?.user,
    userToken: userAuth?.accessToken,

    isAuthenticated: isAdminAuthenticated || isUserAuthenticated,

    adminLogout,
    userLogout,
    getCurrentToken,
    getCurrentUser,
  };
};
