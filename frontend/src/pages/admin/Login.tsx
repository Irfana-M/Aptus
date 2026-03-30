import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { ROUTES } from "../../constants/routes.constants";

import type { AppDispatch } from "../../app/store";
import { adminLoginThunk } from "../../features/admin/adminThunk";
import {
  selectAdminLoading,
  selectAdminError,
} from "../../features/admin/adminSelectors";

import { AuthLayout } from "../../components/layout/AuthLayout";
import loginImage from "../../assets/images/register_banner.jpeg";
import { useEffect } from "react";
import {
  selectAccessToken,
  selectAdmin,
} from "../../features/admin/adminSelectors";
import { TokenManager } from "../../utils/tokenManager";
export default function AdminLoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const loading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);

  const accessToken = useSelector(selectAccessToken);

  const admin = useSelector(selectAdmin);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loginAttempted, setLoginAttempted] = useState(false);


  useEffect(() => {
    if (loginAttempted && accessToken && admin && !loading) {
      console.log("✅ Login successful, redirecting to dashboard...");
      navigate(ROUTES.ADMIN.DASHBOARD);
    }
  }, [loginAttempted, accessToken, admin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    if (!email.trim()) errors.push("Email is required");
    if (!password.trim()) errors.push("Password is required");

    if (errors.length > 0) {
      toast.error(errors.join(" • "));
      return;
    }

    try {
      const result = await dispatch(
        adminLoginThunk({ email, password })
      ).unwrap();
      
      if (!result.accessToken || !result.admin) {
        toast.error("Login response incomplete");
        return;
      }

      TokenManager.setToken("admin", result.accessToken);
      
      // Set loginAttempted only AFTER successful login
      setLoginAttempted(true);
      
      toast.success("Admin logged in successfully!");
      navigate(ROUTES.ADMIN.DASHBOARD);
    } catch (err: unknown) {
      const errorMessage = typeof err === "string" ? err : err instanceof Error ? err.message : "Login failed!";
      toast.error(errorMessage);
    }
  };


  return (
    <AuthLayout
      imageSrc={loginImage}
      title="Admin Login"
      subtitle="Welcome back! Please login to your account."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          style={{ backgroundColor: "#49BBBD" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {error && <p className="text-red-500 text-center">{error}</p>}
      </form>
    </AuthLayout>
  );
}
