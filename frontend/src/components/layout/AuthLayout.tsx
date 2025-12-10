import React from "react";
import aptusLogo from "../../assets/images/aptusLogo.jpeg";
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
              <img 
                src={aptusLogo} 
                alt="Aptus Logo" 
                className="h-10 w-auto object-contain rounded-md" 
              />
              <span className="text-xl font-bold text-gray-800">Aptus</span>
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
              <img 
                src={aptusLogo} 
                alt="Aptus Logo" 
                className="h-12 w-auto object-contain rounded-md" 
              />
              <span className="text-2xl font-bold text-gray-800">Aptus</span>
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
            <p>© 2025 Aptus. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
