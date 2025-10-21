import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import registerImage from "../../assets/images/register_banner.jpeg";
import googleIcon from "../../assets/images/googleIcon.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { clearError } from "../../features/auth/authSlice";

import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../features/auth/authThunks";
import {
  selectAuthLoading,
  selectAuthError,
} from "../../features/auth/authSelector";
import type { AppDispatch } from "../../app/store";

type FormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
};

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [role, setRole] = React.useState<"student" | "mentor">("student");

  React.useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const password = watch("password");

  const onSubmit = async (data: FormValues) => {
    console.log(data);
    const fullData = { ...data, role };

    try {
      const resultAction = await dispatch(registerUser(fullData));
      if (registerUser.fulfilled.match(resultAction)) {
        localStorage.setItem("signupEmail", data.email);
        toast.success("Signup successful! Check your email for OTP.");
        navigate("/verify-otp");
      } else {
        toast.error(resultAction.payload as string);
      }
    } catch (err) {
      toast.error("Registration failed!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <div className="hidden lg:block">
          <img
            src={registerImage}
            alt="Happy Students"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Welcome to Mentora!
          </h2>

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
            <div>
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
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Input
                type="text"
                placeholder="Enter your User Name"
                {...register("fullName", {
                  required: "Full name is required",
                  minLength: {
                    value: 2,
                    message: "Full name must be at least 2 characters",
                  },
                })}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <Input
                type="password"
                placeholder="Enter your Password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div>
              <Input
                type="tel"
                placeholder="Enter your Mobile Number"
                {...register("phoneNumber", {
                  required: "Mobile number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Invalid mobile number (10 digits required)",
                  },
                })}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>

            <Button
              variant="secondary"
              className="w-full flex items-center gap-2"
              type="button"
              onClick={() => {
                window.location.href = `ttp://localhost:5000/api/auth/google`;
              }}
            >
              <img src={googleIcon} alt="Google" className="w-5 h-5" />
              Sign in with Google
            </Button>

            {error && <p className="text-red-500 text-center">{error}</p>}
          </form>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
