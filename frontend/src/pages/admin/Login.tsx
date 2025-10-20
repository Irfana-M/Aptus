import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import loginImage from "../../assets/images/register_banner.jpeg";

import type { AppDispatch } from "../../app/store";
import { adminLoginThunk } from "../../features/admin/adminThunk";
import {
  selectAdminLoading,
  selectAdminError,
} from "../../features/admin/adminSelectors";

import { Eye, EyeOff, BookOpen } from "lucide-react";

export default function AdminLoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const loading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
        await dispatch(adminLoginThunk({ email, password })).unwrap();

        toast.success("Admin logged in successfully!");
        navigate("/admin/dashboard");
      
    } catch (err: any) {
      toast.error(err.message || "Login failed!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        
        <div className="absolute inset-0 bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/30 to-cyan-600/30"></div>
        </div>

        
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          
          <div className="absolute top-2 left-8">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#49BBBD" }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Mentora</span>
            </div>
          </div>

          
          <img
            src={loginImage}
            alt="Login Banner"
            className="max-w-md w-full object-contain"
          />
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#49BBBD" }}
              >
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800">Mentora</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-500 mb-6">
              Welcome back! Please login to your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Login Button */}
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
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 Mentora. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
