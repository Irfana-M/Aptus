import * as React from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import forgotImage from "../../assets/images/register_banner.jpeg"; // same login side image

type ForgotPasswordFormValues = {
  email: string;
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const [role, setRole] = React.useState<"student" | "mentor">("student");

  React.useEffect(() => {
    const savedRole = localStorage.getItem("forgotPasswordRole") as
      | "student"
      | "mentor"
      | null;
    if (savedRole) setRole(savedRole);
  }, []);

  const { register, handleSubmit, formState: { errors }, watch } =
    useForm<ForgotPasswordFormValues>();
  const email = watch("email");

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, role }),
        }
      );
      const result = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success("OTP sent to your email!");
        localStorage.setItem("resetPasswordEmail", data.email);
        localStorage.setItem("resetPasswordRole", role);
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          <div className="hidden lg:block">
            <img
              src={forgotImage}
              alt="Forgot Password"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a password reset OTP to <strong>{email}</strong>
              </p>
              <Button
                onClick={() => navigate("/reset-password")}
                className="w-full"
              >
                Enter Reset Code
              </Button>
              <button
                onClick={() => setEmailSent(false)}
                className="mt-4 text-blue-600 hover:underline"
              >
                Try different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <div className="hidden lg:block">
          <img
            src={forgotImage}
            alt="Forgot Password"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Reset Your Password
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            Enter your email address and we'll send you an OTP to reset your
            password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Enter your email address"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending OTP..." : "Send Reset OTP"}
            </Button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
