import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../features/auth/authSlice"; 
import { store } from "../../app/store";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const hasProcessed = useRef(false);

  const getRedirectPath = (
    userRole: "student" | "mentor",
    profileComplete?: boolean,
    paid?: boolean,
    approvalStatus?: string,
    isTrialCompleted?: boolean
  ) => {
    console.log(`🔍 Redirect logic: role=${userRole}, profileComplete=${profileComplete}, approvalStatus=${approvalStatus}`);
    
    if (userRole === "mentor") {
      
      if (!profileComplete) {
        console.log('🚀 Redirecting mentor to profile setup');
        return "/mentor/profile-setup";
      }
      
     
      switch (approvalStatus) {
        case "pending":
          return "/mentor/profile-setup";
        case "rejected":
          return "/mentor/rejected";
        case "approved":
          return profileComplete ? "/mentor/dashboard" : "/mentor/profile-setup";
        default:
          return "/mentor/profile-setup";
      }
    }

    if (userRole === "student") {
      if (isTrialCompleted && !profileComplete) {
        return "/student/profile-setup";
      }
      return paid ? "/student/dashboard" : "/student/book-free-trial";
    }

    return "/";
  };

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const params = new URLSearchParams(location.search);
      console.log('🔍 ALL URL PARAMETERS RECEIVED:');
    for (const [key, value] of params.entries()) {
      console.log(`  ${key}: ${value}`);
    }
      const token = params.get("token");
      const email = params.get("email");
      const role = params.get("role") as "student" | "mentor" | null;
      const isProfileComplete = params.get("isProfileComplete") === "true";
      const isTrialCompleted = params.get("isTrialCompleted") === "true";
      const approvalStatus = params.get("approvalStatus");
      const isPaid = params.get("isPaid") === "true";
      const error = params.get("error");

      console.log('🔍 PARSED PARAMETERS:');
    console.log('  token:', token);
    console.log('  email:', email);
    console.log('  role:', role);
    console.log('  isProfileComplete:', isProfileComplete);
    console.log('  isTrialCompleted:', isTrialCompleted);
    console.log('  approvalStatus:', approvalStatus);
    console.log('  isPaid:', isPaid);
    console.log('  error:', error);

      if (error) {
        toast.error(`Google authentication failed: ${error}`);
        navigate("/login");
        return;
      }

      if (token && email && role) {
        try {

          const user = {
            email,
            role,
            isProfileComplete,
            approvalStatus: approvalStatus || "pending",
            isPaid: isPaid || false,
            isTrialCompleted,
          };

          dispatch(
            setCredentials({
              user,
              accessToken: token,
            })
          );

          localStorage.setItem('accessToken', token);   // ← THIS IS CRITICAL

console.log("Token saved to localStorage:", token.substring(0, 20) + '...');

          console.log("Google OAuth successful:", { user, token });
          console.log("Token stored in Redux:", store.getState().auth.accessToken);
          console.log("Token stored in localStorage:", localStorage.getItem("accessToken"));

          
          const redirectPath = getRedirectPath(
            role,
            isProfileComplete,
            isPaid,
            approvalStatus || "pending",
            isTrialCompleted
          );

          console.log(`🎯 Redirecting to: ${redirectPath}`);
          toast.success(`Google ${role} login successful!`);
          navigate(redirectPath, { replace: true });

        } catch (error) {
          console.error("Google auth processing error:", error);
          toast.error("Failed to process Google login");
          navigate("/login");
        }
      } else {
        console.error("Incomplete Google auth data:", { token, email, role });
        toast.error("Google authentication failed - incomplete data received");
        navigate("/signup");
      }
    };

    processAuth();
  }, [navigate, dispatch, location]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">Processing Google login...</p>
        <div className="mt-4">Please wait</div>
      </div>
    </div>
  );
}