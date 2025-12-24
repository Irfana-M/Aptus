import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { ROLES } from "../constants/roles";
import { AuthContext } from "../utils/authContext";
import { fetchStudentProfile } from "../features/student/studentThunk";

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
  const studentProfile = useSelector((state: RootState) => state.student?.profile);
  const studentLoading = useSelector((state: RootState) => state.student?.loading);
  const authContext = AuthContext.getInstance();
  
  const path = location.pathname;
  
  // Get role from path (NOT from localStorage.userRole!)
  const getPathRole = (): string | null => {
    if (path.startsWith('/admin')) return ROLES.ADMIN;
    if (path.startsWith('/student')) return ROLES.STUDENT;
    if (path.startsWith('/mentor')) return ROLES.MENTOR;
    
    // Shared routes like /trial-class/
    if (path.startsWith('/trial-class/')) {
        // If we are in a tab that already has a role locked, follow that
        const currentTabRole = authContext.getCurrentRole();
        if (currentTabRole) return currentTabRole;

        // Fallback to highest priority available token
        if (localStorage.getItem('student_accessToken')) return ROLES.STUDENT;
        if (localStorage.getItem('mentor_accessToken')) return ROLES.MENTOR;
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
  
  // Fetch student profile to get accurate hasPaid status when accessing student paths
  useEffect(() => {
    const studentToken = localStorage.getItem('student_accessToken');
    const hasPaidInfo = studentProfile?.hasPaid ?? authState.user?.hasPaid;
    
    // SKIP profile fetch if on a call route - those components handle their own data
    const isCallRoute = path.includes('/trial-class/') && path.endsWith('/call');
    
    if (pathRole === ROLES.STUDENT && studentToken && hasPaidInfo === undefined && !studentLoading && !isCallRoute) {
      console.log('📥 Fetching student profile for hasPaid check...');
      dispatch(fetchStudentProfile());
    }
  }, [pathRole, studentProfile, studentLoading, authState.user, dispatch, path]);

  // Clean up contaminated localStorage.userRole
  useEffect(() => {
    const storedUserRole = localStorage.getItem('userRole');
    
    if (path.startsWith('/student') && storedUserRole === 'admin') {
      console.log('🧹 Clearing admin userRole for student path');
      localStorage.removeItem('userRole');
    } else if (path.startsWith('/admin') && storedUserRole && storedUserRole !== 'admin') {
      console.log(`🧹 Clearing ${storedUserRole} userRole for admin path`);
      localStorage.removeItem('userRole');
    } else if (path.startsWith('/mentor') && storedUserRole === 'admin') {
      console.log('🧹 Clearing admin userRole for mentor path');
      localStorage.removeItem('userRole');
    }
  }, [path]);
  
  // Get token specifically for this path
  const getPathToken = (): string | null => {
    if (!pathRole) return null;
    
    // Convert role to lowercase for localStorage key
    const roleKey = pathRole.toLowerCase();
    const specificToken = localStorage.getItem(`${roleKey}_accessToken`);
    
    if (specificToken) return specificToken;

    // SMART FALLBACK: If specific token is missing, check the generic one
    const genericToken = localStorage.getItem('accessToken');
    if (genericToken) {
        try {
            const payload = JSON.parse(atob(genericToken.split('.')[1]));
            if (payload.role === roleKey || (roleKey === 'admin' && payload.role === 'admin')) {
                console.log(`🩹 Found matching generic token for ${roleKey}, using it.`);
                return genericToken;
            }
        } catch (e) {
            console.error('Failed to decode generic token in ProtectedRoute', e);
        }
    }

    return null;
  };
  
  const token = getPathToken();
  
  // Special handling for landing page - always allow (AFTER all hooks)
  if (path === '/') {
    return children;
  }
  
  // BYPASS for trial-class calls - those components handle their own loading
  if (path.includes('/trial-class/') && path.endsWith('/call')) {
    return children;
  }
  
  // Show loading while profile is being fetched for student paths
  if (pathRole === ROLES.STUDENT && studentLoading && !studentProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }
  
  // Validate role consistency for this tab
  if (!authContext.validateRoleForPath(path)) {
    console.warn(`🚫 Role switching detected in same tab. Current role: ${authContext.getCurrentRole()}, Path role: ${pathRole}`);
    
    // Redirect to current role's dashboard
    const currentRole = authContext.getCurrentRole();
    if (currentRole === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentRole === ROLES.STUDENT) {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (currentRole === ROLES.MENTOR) {
      return <Navigate to="/mentor/dashboard" replace />;
    }
  }
  
  // Debug logging - REDUCED to avoid noise
  if (process.env.NODE_ENV === 'development') {
      // Removed noisy debug logging
  }
  
  // If no token for this specific path, redirect to appropriate login
  if (!token) {
    if (path.includes('/trial-class/')) {
        // If it's a call link and we have NO tokens at all, then redirect
        if (!localStorage.getItem('student_accessToken') && !localStorage.getItem('mentor_accessToken')) {
            console.log(`❌ No tokens found for shared path ${path}`);
            return <Navigate to="/login" replace state={{ from: location }} />;
        }
    } else {
        console.log(`❌ No ${pathRole} token found for ${path}`);
        
        if (pathRole === ROLES.ADMIN) {
          return <Navigate to="/admin/login" replace state={{ from: location }} />;
        }
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
  }
  
  // Check if path role is allowed
  if (pathRole && !allowedRoles.includes(pathRole)) {
    console.log(`🚫 Role mismatch: ${pathRole} not in ${allowedRoles}`);
    
    // Redirect based on detected role
    if (pathRole === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (pathRole === ROLES.STUDENT) {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (pathRole === ROLES.MENTOR) {
      return <Navigate to="/mentor/dashboard" replace />;
    }
    
    return <Navigate to="/" replace />;
  }
  
  // Get user from appropriate Redux state
  const user = pathRole === ROLES.ADMIN ? adminState.admin : authState.user;
  
  // Verify Redux state matches path role
  if (pathRole === ROLES.ADMIN && !adminState.admin) {
    console.warn('⚠️ Admin path but no admin in Redux state');
  } else if (pathRole === ROLES.STUDENT && !authState.user) {
    console.warn('⚠️ Student path but no user in Redux state');
  } else if (pathRole === ROLES.MENTOR && !authState.user) {
    console.warn('⚠️ Mentor path but no user in Redux state');
  }
  
  // Student-specific flow logic
  if (pathRole === ROLES.STUDENT && user) {
    // Allow trial class routes
    if (path.startsWith("/trial-class/")) {
      return children;
    }

    const studentUser = user as { 
      isTrialCompleted?: boolean; 
      isProfileComplete?: boolean; 
      hasPaid?: boolean;
      academicDetails?: { institutionName?: string; grade?: string };
      contactInfo?: { parentInfo?: { name?: string } };
      age?: number;
      gender?: string;
    };
    
    // Check hasPaid from BOTH auth.user AND student profile (profile is more current)
    const profileHasPaid = studentProfile?.hasPaid;
    const userHasPaid = studentUser?.hasPaid;
    const hasPaid = profileHasPaid ?? userHasPaid;
    
    const isTrialCompleted = studentProfile?.isTrialCompleted ?? studentUser?.isTrialCompleted;
    
    // Check if profile is actually complete (more reliable than flag)
    const profileData = studentProfile || studentUser;
    const hasCompleteProfile = !!(
      profileData?.academicDetails?.institutionName &&
      profileData?.academicDetails?.grade &&
      profileData?.contactInfo?.parentInfo?.name &&
      profileData?.age &&
      profileData?.gender
    );

    console.log('🔍 Student access check:', { profileHasPaid, userHasPaid, hasPaid, isTrialCompleted, hasCompleteProfile });

    // If user has paid, allow full access regardless of profile completion flag
    if (hasPaid) {
      console.log('✅ Paid user - full dashboard access granted');
      return children;
    }

    // For unpaid users, enforce the flow
    if (!hasPaid) {
      if (isTrialCompleted) {
        // Check actual profile data, not just the flag
        if (!hasCompleteProfile) {
          const allowed = ["/student/profile-setup"];
          if (!allowed.some(p => path.startsWith(p))) {
            console.log('⚠️ Profile incomplete, redirecting to profile-setup');
            return <Navigate to="/student/profile-setup" replace />;
          }
        } else {
          // Trial completed, profile complete, but not paid
          const allowed = [
            "/student/dashboard", 
            "/student/subscription-plans", 
            "/student/payment",
            "/student/my-courses",
            "/student/profile",
            "/student/profile-setup",
            "/trial-class/"
          ];
          if (!allowed.some(p => path.startsWith(p))) {
            console.log('⚠️ Not paid yet, limiting access');
            return <Navigate to="/student/dashboard" replace />;
          }
        }
      } else {
        // Trial not completed
        const allowedPathsDuringFlow = ["/student/book-free-trial", "/trial-class/"];
        const isCurrentlyInFlow = allowedPathsDuringFlow.some(p => path.startsWith(p));
        
        if (!isCurrentlyInFlow) {
          console.log(`🛡️ Student trial not completed, redirecting from ${path} to book-free-trial`);
          return <Navigate to="/student/book-free-trial" replace />;
        }
      }
    }
  }

  // Mentor-specific flow logic
  if (pathRole === ROLES.MENTOR && user) {
    const approvalStatus = (user as { approvalStatus?: string })?.approvalStatus;
    
    if (path.includes("/mentor/dashboard")) {
      if (approvalStatus !== "approved") {
        return <Navigate to="/mentor/profile-setup" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
