import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import type { AppDispatch } from "../../app/store";
import { loginUser } from "../../features/auth/authThunks";
import {
  selectAuthLoading,
  selectAuthError,
} from "../../features/auth/authSelector";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const getRedirectPath = (
    userRole: "student" | "mentor",
    profileComplete?: boolean,
    paid?: boolean,
    approvalStatus?: string
  ) => {
    if (userRole === "mentor") {
      switch (approvalStatus) {
        case "pending":
          return "/mentor/profile-setup";
        case "rejected":
          return "/mentor/rejected";
        case "approved":
          return profileComplete
            ? "/mentor/dashboard"
            : "/mentor/profile-setup";
        default:
          return "/mentor/pending-approval";
      }
    }

    if (userRole === "student") {
      return paid ? "/student/dashboard" : "/book-free-trial";
    }

    return "/";
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const resultAction = await dispatch(loginUser({ ...data, role }));

      if (loginUser.fulfilled.match(resultAction)) {
        const userData = resultAction.payload.user;

        const {
          role: userRole,
          isProfileComplete,
          isPaid,
          approvalStatus,
        } = userData;

        const redirectPath = getRedirectPath(
          userRole,
          isProfileComplete,
          isPaid,
          approvalStatus
        );

        toast.success("Login successful!");
        navigate(redirectPath, { replace: true });
      } else {
        const errorMessage = resultAction.payload as string;
        toast.error(errorMessage);
      }
    } catch (err) {
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
    <AuthLayout
      imageSrc={loginImage}
      title="Welcome Back!"
      subtitle="Login to your account to continue."
    >
      {/* Role toggle */}
      <div className="flex mx-auto mb-6 rounded-full border border-teal-500 overflow-hidden w-fit">
        <button
          type="button"
          className={`px-6 py-2 font-medium ${
            role === "student"
              ? "bg-teal-500 text-white"
              : "bg-white text-teal-600"
          }`}
          onClick={() => setRole("student")}
        >
          Student
        </button>
        <button
          type="button"
          className={`px-6 py-2 font-medium ${
            role === "mentor"
              ? "bg-teal-500 text-white"
              : "bg-white text-teal-600"
          }`}
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
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}

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

      {/* Google login */}
      <Button
        variant="secondary"
        className="w-full flex items-center gap-2 mt-4"
        type="button"
        onClick={handleGoogleAuth}
      >
        <img src={googleIcon} alt="Google" className="w-5 h-5" />
        Sign in with Google
      </Button>

      {/* Forgot password */}
      <p className="text-sm text-gray-600 mt-4 text-center">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-blue-600 font-medium hover:underline"
        >
          Forgot Password?
        </button>
      </p>

      {/* Sign up link */}
      <p className="text-sm text-gray-600 mt-4 text-center">
        Don't have an account?{" "}
        <a
          href="/register"
          className="text-blue-600 font-medium hover:underline"
        >
          Sign up
        </a>
      </p>

      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </AuthLayout>
  );
}
