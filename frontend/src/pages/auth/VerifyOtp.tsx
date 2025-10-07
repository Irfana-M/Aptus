import React, { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import otpImage from "../../assets/images/register_banner.jpeg"; 
import { useDispatch, useSelector } from "react-redux";
import { verifyOtp, resendOtp } from "../../features/auth/authThunks";
import { selectAuthLoading, selectAuthError } from "../../features/auth/authSelector";
import type { AppDispatch } from "../../app/store";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const navigate = useNavigate();

  const email = localStorage.getItem("signupEmail") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (!email) return toast.error("Email not found");

    try {
      const resultAction = await dispatch(verifyOtp({ email, otp: otpCode }));
      if (verifyOtp.fulfilled.match(resultAction)) {
        toast.success("OTP verified successfully!");
        navigate("/login");
      } else {
        toast.error(resultAction.payload as string);
      }
    } catch {
      toast.error("OTP verification failed");
    }
  };

  const handleResend = async () => {
    setTimeLeft(60);
    if (!email) return toast.error("Email not found");

    try {
      const resultAction = await dispatch(resendOtp(email));
      if (resendOtp.fulfilled.match(resultAction)) {
        toast.success("OTP resent successfully!");
      } else {
        toast.error(resultAction.payload as string);
      }
    } catch {
      toast.error("Resend OTP failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <div className="hidden lg:flex items-center justify-center bg-gray-100 p-6">
          <img src={otpImage} alt="Students" className="rounded-lg object-cover shadow-md" />
        </div>

        <div className="flex flex-col justify-center p-8 lg:p-12">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">OTP Verification</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Code has been sent to your email
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-3 justify-center mb-4">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-12 h-12 text-center text-xl border rounded-md focus:ring-2 focus:ring-teal-400 focus:border-teal-500 outline-none"
                />
              ))}
            </div>

            <p className="text-sm text-gray-500 text-center mb-4">
              {timeLeft > 0 ? (
                <>Resend Code in <span className="text-teal-600 font-medium">{timeLeft}s</span></>
              ) : (
                <button type="button" onClick={handleResend} className="text-teal-600 font-medium underline">
                  Resend Code
                </button>
              )}
            </p>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </Button>

            {error && <p className="text-red-500 text-center">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
