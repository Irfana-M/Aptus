import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import loginImage from "../../assets/images/register_banner.jpeg"; 
import googleIcon from "../../assets/images/googleIcon.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authThunks"; 
import {
  selectAuthLoading,
  selectAuthError,
} from "../../features/auth/authSelector";
import type { AppDispatch } from "../../app/store";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [role, setRole] = React.useState<"student" | "mentor">("student");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const resultAction = await dispatch(loginUser({ ...data, role }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success("Login successful!");
        navigate("/dashboard"); 
      } else {
        toast.error(resultAction.payload as string);
      }
    } catch (err) {
      toast.error("Login failed!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <div className="hidden lg:block">
          <img
            src={loginImage}
            alt="Login Banner"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Welcome Back!
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
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Input
                type="password"
                placeholder="Enter your Password"
                {...register("password", {
                  required: "Password is required",
                })}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Button
              variant="secondary"
              className="w-full flex items-center gap-2"
              type="button"
            >
              <img src={googleIcon} alt="Google" className="w-5 h-5" />
              Sign in with Google
            </Button>

            {error && <p className="text-red-500 text-center">{error}</p>}
          </form>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign up
            </a>
          </p>

          <p className="text-sm text-gray-600 mt-2 text-center">
            <a href="/forgot-password" className="text-blue-600 font-medium hover:underline">
              Forgot Password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
