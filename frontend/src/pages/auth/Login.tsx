// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-hot-toast";

// import type { AppDispatch } from "../../app/store";
// import { loginUser } from "../../features/auth/authThunks";
// import {
//   selectAuthLoading,
//   selectAuthError,
// } from "../../features/auth/authSelector";

// import { Input } from "../../components/ui/Input";
// import { Button } from "../../components/ui/Button";
// import { AuthLayout } from "../../components/layout/AuthLayout";

// import loginImage from "../../assets/images/register_banner.jpeg";
// import googleIcon from "../../assets/images/googleIcon.png";

// type LoginFormValues = {
//   email: string;
//   password: string;
// };

// export default function Login() {
//   const navigate = useNavigate();
//   const dispatch = useDispatch<AppDispatch>();
//   const loading = useSelector(selectAuthLoading);
//   const error = useSelector(selectAuthError);

//   const [role, setRole] = useState<"student" | "mentor">("student");
//   const [showPassword, setShowPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<LoginFormValues>();

//   const getRedirectPath = (
//     userRole: "student" | "mentor",
//     profileComplete?: boolean,
//     //paid?: boolean,
//     approvalStatus?: string,
//     isTrialCompleted?: boolean
//   ) => {
//     if (userRole === "mentor") {
//       switch (approvalStatus) {
//         case "pending":
//           return "/mentor/profile-setup";
//         case "rejected":
//           return "/mentor/rejected";
//         case "approved":
//           return profileComplete
//             ? "/mentor/dashboard"
//             : "/mentor/profile-setup";
//         default:
//           return "/mentor/pending-approval";
//       }
//     }

//     if (userRole === "student") {
//       // 1. If trial is NOT completed -> Trial Booking Page (First time or returning incomplete)
//       if (!isTrialCompleted) {
//         return "/student/book-free-trial";
//       }

//       // 2. If trial completed BUT profile incomplete -> Profile Setup
//       if (!profileComplete) {
//         return "/student/profile-setup";
//       }

//       // 3. If everything completed -> Student Time Selection
//       return "/student/time-slots";
//     }

//     return "/";
//   };

//   const onSubmit = async (data: LoginFormValues) => {
//     try {
//       console.log('🔑 LOGIN ATTEMPT:', {
//       email: data.email,
//       attemptedRole: role,  // This is the UI toggle value
//       timestamp: new Date().toISOString()
//     });
//       const resultAction = await dispatch(loginUser({ ...data, role }));

//       if (loginUser.fulfilled.match(resultAction)) {
//         const { user, accessToken } = resultAction.payload;
// console.log('✅ LOGIN RESPONSE:', {
//         emailFromServer: user.email,
//         roleFromServer: user.role,
//         attemptedRole: role,
//         match: user.role === role ? '✅ MATCH' : '❌ MISMATCH'
//       });

//   // THESE 3 LINES ARE THE SOURCE OF TRUTH — MUST BE HERE
//   localStorage.setItem("accessToken", accessToken);
//   localStorage.setItem("userRole", user.role);      // ← CRITICAL
//   localStorage.setItem("userId", user._id); // ← Also save ID

//   console.log("LOGIN SUCCESS → SAVED TO LOCALSTORAGE:", {
//     role: user.role,
//     userId: user._id,
//     token: accessToken.substring(0, 20) + "..."
//   });
  
//   if (user.role === 'student' && !user.isProfileComplete) {
//       toast.error("Your profile setup is not complete, setup your profile to continue");
//   } else {
//       toast.success("Login successful!");
//   }
  
//   navigate(getRedirectPath(user.role, user.isProfileComplete, user.isPaid, user.approvalStatus, user.isTrialCompleted), { replace: true });

//         // const {
//         //   role: userRole,
//         //   isProfileComplete,
//         //   isPaid,
//         //   approvalStatus,
//         // } = userData;

//   //       const redirectPath = getRedirectPath(
//   //         userRole,
//   //         isProfileComplete,
//   //         isPaid,
//   //         approvalStatus
//   //       );

//   //       toast.success("Login successful!");
//   //       navigate(redirectPath, { replace: true });
//       } else {
//         const errorMessage = resultAction.payload as string;
//         toast.error(errorMessage);
//       }
//     } catch (err) {
//       toast.error("Login failed!");
//     }
//   };

  

//   const handleGoogleAuth = () => {
//     const API_URL = import.meta.env.VITE_API_URL;
//     window.location.href = `${API_URL}/auth/google?role=${role}`;
//   };

//   const handleForgotPassword = () => {
//     localStorage.setItem("forgotPasswordRole", role);
//     navigate("/forgot-password");
//   };

//   return (
//     <AuthLayout
//       imageSrc={loginImage}
//       title="Welcome Back!"
//       subtitle="Login to your account to continue."
//     >
//       {/* Role toggle */}
//       <div className="flex mx-auto mb-6 rounded-full border border-teal-500 overflow-hidden w-fit">
//         <button
//           type="button"
//           className={`px-6 py-2 font-medium ${
//             role === "student"
//               ? "bg-teal-500 text-white"
//               : "bg-white text-teal-600"
//           }`}
//           onClick={() => setRole("student")}
//         >
//           Student
//         </button>
//         <button
//           type="button"
//           className={`px-6 py-2 font-medium ${
//             role === "mentor"
//               ? "bg-teal-500 text-white"
//               : "bg-white text-teal-600"
//           }`}
//           onClick={() => setRole("mentor")}
//         >
//           Mentor
//         </button>
//       </div>

//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//         <Input
//           type="email"
//           placeholder="Enter your Email Address"
//           {...register("email", {
//             required: "Email is required",
//             pattern: {
//               value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//               message: "Invalid email address",
//             },
//           })}
//         />
//         {errors.email && (
//           <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
//         )}

//         <div className="relative">
//           <Input
//             type={showPassword ? "text" : "password"}
//             placeholder="Enter your Password"
//             {...register("password", { required: "Password is required" })}
//           />
//           <button
//             type="button"
//             onClick={() => setShowPassword(!showPassword)}
//             className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//           >
//             {showPassword ? "Hide" : "Show"}
//           </button>
//         </div>

//         <Button type="submit" className="w-full" disabled={loading}>
//           {loading ? "Logging in..." : "Login"}
//         </Button>
//       </form>

//       {/* Google login */}
//       <Button
//         variant="secondary"
//         className="w-full flex items-center gap-2 mt-4"
//         type="button"
//         onClick={handleGoogleAuth}
//       >
//         <img src={googleIcon} alt="Google" className="w-5 h-5" />
//         Sign in with Google
//       </Button>

//       {/* Forgot password */}
//       <p className="text-sm text-gray-600 mt-4 text-center">
//         <button
//           type="button"
//           onClick={handleForgotPassword}
//           className="text-blue-600 font-medium hover:underline"
//         >
//           Forgot Password?
//         </button>
//       </p>

//       {/* Sign up link */}
//       <p className="text-sm text-gray-600 mt-4 text-center">
//         Don't have an account?{" "}
//         <a
//           href="/register"
//           className="text-blue-600 font-medium hover:underline"
//         >
//           Sign up
//         </a>
//       </p>

//       {error && <p className="text-red-500 text-center mt-2">{error}</p>}
//     </AuthLayout>
//   );
// }

// src/pages/auth/Login.tsx

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import type { AppDispatch } from "../../app/store";
import { loginUser } from "../../features/auth/authThunks";
import { selectAuthLoading, selectAuthError } from "../../features/auth/authSelector";

import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { AuthLayout } from "../../components/layout/AuthLayout";

import loginImage from "../../assets/images/register_banner.jpeg";
import googleIcon from "../../assets/images/googleIcon.png";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [role, setRole] = useState<"student" | "mentor">("student");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const userRole = localStorage.getItem("userRole");
    // Only auto-redirect if the stored role is Student or Mentor. 
    // If Admin is logged in, we stay on this page to allow Student login (multi-session).
    if (userRole === 'admin') return;

    const token = userRole ? localStorage.getItem(`${userRole}_accessToken`) : localStorage.getItem("accessToken");
    
    if (token && userRole) {
        if (userRole === "mentor") {
            navigate("/mentor/dashboard", { replace: true });
        } else if (userRole === "student") {
             // Logic: multi-stage student flow
             const hasPaid = localStorage.getItem("hasPaid") === "true";
             const isTrialCompleted = localStorage.getItem("isTrialCompleted") === "true";
             const isProfileComplete = localStorage.getItem("isProfileComplete") === "true";
             
             if (hasPaid) {
                 navigate("/student/dashboard", { replace: true });
             } else if (!isTrialCompleted) {
                 navigate("/student/book-free-trial", { replace: true });
             } else if (!isProfileComplete) {
                 navigate("/student/profile-setup", { replace: true });
             } else {
                 navigate("/student/dashboard", { replace: true });
             }
        }
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const getRedirectPath = (
    userRole: "student" | "mentor",
    profileComplete?: boolean,
    approvalStatus?: string,
    isTrialCompleted?: boolean,
    hasPaid?: boolean,
    subscription?: unknown
  ) => {
    if (userRole === "mentor") {
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
      const sub = subscription as { status?: string; endDate?: string } | null;
      if (sub && (sub.status === 'expired' || (sub.endDate && new Date(sub.endDate) < new Date()))) {
          return "/student/subscription-plans";
      }
        
      if (hasPaid) return "/student/dashboard";
      if (!isTrialCompleted) return "/student/book-free-trial";
      if (!profileComplete) return "/student/profile-setup";
      return "/student/dashboard";
    }

    return "/";
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const resultAction = await dispatch(loginUser({ ...data, role }));

      if (loginUser.fulfilled.match(resultAction)) {
        const { user, accessToken, isProfileComplete, hasPaid, isTrialCompleted } = resultAction.payload;

        // ... existing storage logic ...
        localStorage.setItem(`${user.role}_accessToken`, accessToken);
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userId", user._id);
        
        localStorage.setItem("hasPaid", String(!!hasPaid));
        localStorage.setItem("isTrialCompleted", String(!!isTrialCompleted));
        localStorage.setItem("isProfileComplete", String(!!isProfileComplete));

        const redirectPath = getRedirectPath(
            user.role,
            isProfileComplete,
            user.approvalStatus,        
            isTrialCompleted,
            hasPaid,
            user.subscription
          );
        console.log("Generated Redirect Path:", redirectPath);

        if (redirectPath === "/student/subscription-plans") {
             toast.error("Your monthly subscription has expired. Please renew to continue.");
        } else if (user.role === "student" && !user.isTrialCompleted) {
             toast.success("Login successful! Please book your free trial class.");
        } else {
             toast.success("Login successful!");
        }

        navigate(redirectPath, { replace: true });
      } else {
        const errorMessage = resultAction.payload as string;
        toast.error(errorMessage || "Login failed");
      }
    } catch {
      toast.error("Login failed!");
    }
  };

  const handleGoogleAuth = () => {
    const API_URL = import.meta.env.VITE_API_URL;
    window.location.href = `${API_URL}/auth/google?role=${role}`;
  };

  const handleForgotPassword = () => {
    localStorage.setItem("forgotPasswordRole", role);
    navigate("/forgot-password");
  };

  return (
    <AuthLayout imageSrc={loginImage} title="Welcome Back!" subtitle="Login to your account to continue.">
      <div className="flex mx-auto mb-6 rounded-full border border-teal-500 overflow-hidden w-fit">
        <button
          type="button"
          className={`px-6 py-2 font-medium ${role === "student" ? "bg-teal-500 text-white" : "bg-white text-teal-600"}`}
          onClick={() => setRole("student")}
        >
          Student
        </button>
        <button
          type="button"
          className={`px-6 py-2 font-medium ${role === "mentor" ? "bg-teal-500 text-white" : "bg-white text-teal-600"}`}
          onClick={() => setRole("mentor")}
        >
          Mentor
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          type="email"
          placeholder="Enter your Email Address"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          })}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your Password"
            {...register("password", { required: "Password is required" })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <Button variant="secondary" className="w-full flex items-center gap-2 mt-4" type="button" onClick={handleGoogleAuth}>
        <img src={googleIcon} alt="Google" className="w-5 h-5" />
        Sign in with Google
      </Button>

      <p className="text-sm text-gray-600 mt-4 text-center">
        <button type="button" onClick={handleForgotPassword} className="text-blue-600 font-medium hover:underline">
          Forgot Password?
        </button>
      </p>

      <p className="text-sm text-gray-600 mt-4 text-center">
        Don't have an account?{" "}
        <a href="/register" className="text-blue-600 font-medium hover:underline">
          Sign up
        </a>
      </p>

      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </AuthLayout>
  );
}
