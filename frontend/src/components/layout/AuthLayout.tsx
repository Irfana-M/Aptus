import React from "react";
import { BookOpen } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  imageSrc: string;
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  imageSrc,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left banner */}
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
            src={imageSrc}
            alt="Auth Banner"
            className="max-w-md w-full object-contain"
          />
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo on mobile */}
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

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
            {title && (
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
            )}
            {subtitle && (
              <p className="text-gray-500 mb-6 text-sm">{subtitle}</p>
            )}

            {children}
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 Mentora. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
