// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { ROLES } from "../constants/roles";

// interface ProtectedRouteProps {
//   children: JSX.Element;
//   allowedRoles: string[];
// }

// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
//   children,
//   allowedRoles,
// }) => {
//   const location = useLocation();

//   const adminState = useSelector((state: any) => state.admin);
//   const authState = useSelector((state: any) => state.auth);

//   const user = adminState.admin || authState.user;
  
//   // Check Redux state first, then fall back to localStorage
//   const reduxToken = adminState.accessToken || authState.accessToken;
//   const localStorageToken = localStorage.getItem('accessToken') || localStorage.getItem('adminToken') || localStorage.getItem('userToken');
//   const token = reduxToken || localStorageToken;
  
//   const role = user?.role;

//   console.log("ProtectedRoute Check:", {
//     pathname: location.pathname,
//     hasAdmin: !!adminState.admin,
//     hasAuthUser: !!authState.user,
//     user,
//     reduxToken: !!reduxToken,
//     localStorageToken: !!localStorageToken,
//     token: !!token,
//     role,
//     allowedRoles,
//   });

//   // DEBUG: Show alert before redirect
//   if (!token) {
//     alert(`NO TOKEN FOUND!\nAdmin token: ${adminState.accessToken}\nAuth token: ${authState.accessToken}\nUser: ${JSON.stringify(user)}`);
    
//     if (allowedRoles.includes(ROLES.ADMIN)) {
//       return <Navigate to="/admin/login" replace />;
//     } else {
//       return <Navigate to="/login" replace />;
//     }
//   }

//   if (!allowedRoles.includes(role)) {
//     alert(`ROLE NOT ALLOWED!\nUser role: ${role}\nAllowed roles: ${allowedRoles.join(', ')}`);
    
//     if (role === ROLES.ADMIN) {
//       return <Navigate to="/admin/dashboard" replace />;
//     } else if (role === ROLES.MENTOR) {
//       return <Navigate to="/mentor/profile-setup" replace />;
//     } else if (role === ROLES.STUDENT) {
//       return <Navigate to="/student/dashboard" replace />;
//     } else {
//       return <Navigate to="/" replace />;
//     }
//   }

//   return children;
// };

// export default ProtectedRoute;

// src/components/ProtectedRoute.tsx — FINAL CLEAN VERSION
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
  const token = adminState.accessToken || authState.accessToken || localStorage.getItem('accessToken');

  // NO ALERTS — EVER
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = user?.role;

  if (role && !allowedRoles.includes(role)) {
    // Redirect silently based on role
    if (role === ROLES.ADMIN) return <Navigate to="/admin/dashboard" replace />;
    if (role === ROLES.MENTOR) return <Navigate to="/mentor/dashboard" replace />;
    if (role === ROLES.STUDENT) return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // Force profile completion for students who finished a trial
  if (role === ROLES.STUDENT) {
    const isTrialCompleted = user?.isTrialCompleted;
    const isProfileComplete = user?.isProfileComplete;

    if (isTrialCompleted && !isProfileComplete) {
      if (location.pathname !== "/student/profile-setup") {
        return <Navigate to="/student/profile-setup" replace />;
      }
    }
  }

  // Force profile completion for mentors
  if (role === ROLES.MENTOR) {
    // If approvalStatus is not available in user object, we might default to allowing
    // but ProfileSetup will fetch the true status.
    // However, to protect Dashboard, we should check what we have.
    // Assuming user object from login/redux has approvalStatus.
    // If not, we rely on the Profilepage to redirect or show restricted view.
    
    // Better strategy: If on Dashboard and NOT approved, redirect.
    const approvalStatus = (user as any)?.approvalStatus;
    
    if (location.pathname.includes("/mentor/dashboard")) {
       if (approvalStatus !== "approved") {
          return <Navigate to="/mentor/profile-setup" replace />;
       }
    }
  }

  // Force profile completion for students who finished a trial

  // If no role in Redux but token exists → allow (Socket.IO will handle auth)
  return children;
};

export default ProtectedRoute;
