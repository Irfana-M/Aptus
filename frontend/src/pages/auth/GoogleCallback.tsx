import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants/routes.constants";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../features/auth/authSlice";
import { store } from "../../app/store";
import { AuthContext } from "../../utils/authContext";
import { StudentOnboardingStatus } from "../../utils/StudentOnboardingGuard";

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
    isTrialCompleted?: boolean,
  ) => {
    console.log(
      `🔍 Redirect logic: role=${userRole}, profileComplete=${profileComplete}, approvalStatus=${approvalStatus}`,
    );

    if (userRole === "mentor") {
      if (!profileComplete) {
        console.log("🚀 Redirecting mentor to profile setup");
        return ROUTES.MENTOR.PROFILE_SETUP;
      }

      switch (approvalStatus) {
        case "pending":
          return ROUTES.MENTOR.PROFILE_SETUP;
        case "rejected":
          return ROUTES.MENTOR.REJECTED;
        case "approved":
          return profileComplete
            ? ROUTES.MENTOR.DASHBOARD
            : ROUTES.MENTOR.PROFILE_SETUP;
        default:
          return ROUTES.MENTOR.PROFILE_SETUP;
      }
    }

    if (userRole === "student") {
      if (paid) {
        return ROUTES.STUDENT.DASHBOARD;
      }
      if (isTrialCompleted && !profileComplete) {
        return ROUTES.STUDENT.PROFILE;
      }
      return ROUTES.STUDENT.BOOK_FREE_TRIAL;
    }

    return ROUTES.HOME;
  };

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const params = new URLSearchParams(location.search);
      console.log("🔍 ALL URL PARAMETERS RECEIVED:");
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
      const id = params.get("id");
      const error = params.get("error");

      console.log("🔍 PARSED PARAMETERS:");
      console.log("  token:", token);
      console.log("  email:", email);
      console.log("  role:", role);
      console.log("  isProfileComplete:", isProfileComplete);
      console.log("  isTrialCompleted:", isTrialCompleted);
      console.log("  approvalStatus:", approvalStatus);
      console.log("  isPaid:", isPaid);
      console.log("  id:", id);
      console.log("  error:", error);

      if (error) {
        toast.error(`Google authentication failed: ${error}`);
        navigate(ROUTES.LOGIN);
        return;
      }

      if (token && email && role) {
        try {
          // Calculate onboarding status for students
          let onboardingStatus: string | undefined = undefined;
          if (role === "student") {
            onboardingStatus = StudentOnboardingStatus.REGISTERED;
            if (isProfileComplete) {
              onboardingStatus = isTrialCompleted
                ? StudentOnboardingStatus.TRIAL_BOOKED
                : StudentOnboardingStatus.PROFILE_COMPLETE;
            }
            if (isPaid) {
              onboardingStatus = StudentOnboardingStatus.SUBSCRIBED;
            }
          }

          const user = {
            email: email, // Assuming 'email' from params is the userEmail
            role: role,
            id: id || "",
            _id: id || "",
            fullName: email.split("@")[0],
            isProfileComplete: isProfileComplete,
            isTrialCompleted: isTrialCompleted,
            hasPaid: isPaid,
            onboardingStatus: onboardingStatus,
            approvalStatus: approvalStatus || "pending", // Keep approvalStatus for mentors
          };

          // 6. Update context and Redux
          AuthContext.getInstance().setRole(role as "student" | "mentor" | "admin");
          
          dispatch(
            setCredentials({ 
              user, 
              accessToken: token,
              isProfileComplete,
              hasPaid: isPaid,
              isTrialCompleted
            })
          );

          // MONKEY PATCH localStorage to catch the culprit
          const originalSetItem = localStorage.setItem.bind(localStorage);
          const originalRemoveItem = localStorage.removeItem.bind(localStorage);
          
          localStorage.setItem = (key, val) => {
            console.log(`📦 localStorage.setItem("${key}", "${val?.substring(0, 10)}...")`);
            return originalSetItem(key, val);
          };
          
          localStorage.removeItem = (key) => {
            console.warn(`🗑️ localStorage.removeItem("${key}")`);
            // Capture stack trace
            console.warn(new Error("Stack Trace for RemoveItem").stack);
            return originalRemoveItem(key);
          };

          console.log(`🔍 DEBUG: Setting localStorage for role "${role}" with value: ${token?.substring(0, 10)}...`);
          localStorage.setItem(`${role}_accessToken`, token as string);
          
          // VERIFY LOOP
          let count = 0;
          const checkInterval = setInterval(() => {
            const currentVal = localStorage.getItem(`${role}_accessToken`);
            if (!currentVal) {
              console.error(`🚨 ALERT: Token was WIPED at check #${count}`);
              clearInterval(checkInterval);
            } else if (count > 20) {
              clearInterval(checkInterval);
            }
            count++;
          }, 10);

          localStorage.setItem("userRole", role as string);
          localStorage.setItem("userId", id || "");
          
          console.log(`✅ Google Auth state committed. Role: ${role}, Status: ${onboardingStatus}`);
          localStorage.setItem("hasPaid", String(!!isPaid));
          localStorage.setItem("isTrialCompleted", String(!!isTrialCompleted));
          localStorage.setItem(
            "isProfileComplete",
            String(!!isProfileComplete),
          );

          console.log("Tokens and user info saved to localStorage");
          console.log("FINAL localStorage CHECK BEFORE REDIRECT:");
          console.log(`  student_accessToken: ${localStorage.getItem("student_accessToken")?.substring(0, 10)}...`);
          console.log(`  mentor_accessToken: ${localStorage.getItem("mentor_accessToken")?.substring(0, 10)}...`);
          console.log(`  userRole: ${localStorage.getItem("userRole")}`);

          console.log("Google OAuth successful:", { user, token: token?.substring(0, 10) + "..." });
          console.log(
            "Token stored in Redux:",
            store.getState().auth.accessToken?.substring(0, 10) + "...",
          );
          console.log(
            "Token stored in localStorage (via role):",
            localStorage.getItem(`${role}_accessToken`)?.substring(0, 10) + "...",
          );

          const redirectPath = getRedirectPath(
            role,
            isProfileComplete,
            isPaid,
            approvalStatus || "pending",
            isTrialCompleted,
          );

          console.log(`🎯 Redirecting to: ${redirectPath}`);
          toast.success(`Google ${role} login successful!`);
          setTimeout(() => {
            navigate(redirectPath, { replace: true });
          }, 150);
        } catch (error) {
          console.error("Google auth processing error:", error);
          toast.error("Failed to process Google login");
          navigate(ROUTES.LOGIN);
        }
      } else {
        console.error("Incomplete Google auth data:", { token, email, role });
        toast.error("Google authentication failed - incomplete data received");
        navigate(ROUTES.REGISTER);
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
