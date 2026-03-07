import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import googleIcon from "../../assets/images/googleIcon.png";

import type { AppDispatch } from "../../app/store";
import { registerUser } from "../../features/auth/authThunks";
import { clearError } from "../../features/auth/authSlice";
import { selectAuthLoading, selectAuthError } from "../../features/auth/authSelector";
import { ROUTES } from "../../constants/routes.constants";

import { AuthLayout } from "../../components/layout/AuthLayout";
import registerImage from "../../assets/images/register_banner.jpeg";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

type FormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  referralCode?: string;
};

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [role, setRole] = useState<"student" | "mentor">("student");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    
    // Check if already authenticated
    const userRole = localStorage.getItem("userRole");
    const token = userRole ? localStorage.getItem(`${userRole}_accessToken`) : localStorage.getItem("accessToken");
    
    if (token && userRole) {
        // Redirect to dashboard/profile setup based on role
        const path = userRole === "mentor" ? ROUTES.MENTOR.DASHBOARD : ROUTES.STUDENT.DASHBOARD;
        navigate(path, { replace: true });
    }
  }, [dispatch, navigate]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();


  const onSubmit = async (data: FormValues) => {
    const fullData = { ...data, role };
    try {
      const resultAction = await dispatch(registerUser(fullData));
      if (registerUser.fulfilled.match(resultAction)) {
        localStorage.setItem("signupEmail", data.email);
        toast.success("Signup successful! Check your email for OTP.");
        navigate(ROUTES.VERIFY_OTP);
      } else {
        toast.error(resultAction.payload as string);
      }
    } catch {
      toast.error("Registration failed!");
    }
  };

  const handleGoogleAuth = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const CALLBACK_URL = import.meta.env.VITE_GOOGLE_CALLBACK_URL;

  // Pass callback URL to backend as query param
  window.location.href = `${API_URL}/auth/google?role=${role}&callbackUrl=${encodeURIComponent(CALLBACK_URL)}`;
};

  return (
    <AuthLayout
  imageSrc={registerImage}
  title="Welcome to Aptus!"
  subtitle="Create a new account to join Aptus."
>
  {/* Role toggle */}
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
    <Input type="text" placeholder="Full Name" {...register("fullName", { required: "Full name is required" })} />
    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}

    <Input type="email" placeholder="Email Address" {...register("email", { required: "Email is required" })} />
    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}

    <div className="relative">
      <Input type={showPassword ? "text" : "password"} placeholder="Password" {...register("password", { required: "Password is required" })} />
      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {showPassword ? "Hide" : "Show"}
      </button>
    </div>

    <Input type="password" placeholder="Confirm Password" {...register("confirmPassword", { required: "Confirm password", validate: (val) => val === watch("password") || "Passwords do not match" })} />
    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}

    <Input type="tel" placeholder="Mobile Number" {...register("phoneNumber", { required: "Mobile number required" })} />
    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>}
    
    {role === 'student' && (
      <Input type="text" placeholder="Referral Code (Optional)" {...register("referralCode")} />
    )}

    <Button type="submit" className="w-full" disabled={loading}>
      {loading ? "Registering..." : "Register"}
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

  {/* Sign in link */}
  <p className="text-sm text-gray-600 mt-4 text-center">
    Already have an account?{" "}
    <a href={ROUTES.LOGIN} className="text-blue-600 font-medium hover:underline">
      Sign in
    </a>
  </p>

  {error && <p className="text-red-500 text-center mt-2">{error}</p>}
</AuthLayout>

  );
}

