import React from "react";
import { Menu, Search, MessageSquare, ChevronDown } from "lucide-react";
import { NotificationBell } from "../common/NotificationBell";

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

interface DashboardTopbarProps {
  onMenuToggle: () => void;
  title?: string;
  user?: UserProfile;
}

export const DashboardTopbar: React.FC<DashboardTopbarProps> = ({
  onMenuToggle,
  title = "Dashboard",
  user = {
    name: "User",
    email: "user@aptus.com",
    role: "student"
  },
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-200">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors duration-200"
        >
          <Menu size={24} />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
             Welcome back, {user.name}
             {user.role && (
                <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 text-xs font-semibold uppercase tracking-wider border border-cyan-100">
                    {user.role}
                </span>
             )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-5">
        {/* Search - Hidden on mobile */}
        <div className="hidden md:block relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200 w-64"
          />
        </div>

        <div className="flex items-center space-x-2 border-l border-gray-200 pl-2 md:pl-5">
            <NotificationBell />

            <button className="relative p-2.5 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-cyan-600 transition-all duration-200 group">
            <MessageSquare size={20} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-teal-500 rounded-full border-2 border-white"></span>
            </button>
        </div>

        {/* Profile Dropdown Trigger */}
        <div className="flex items-center gap-3 pl-2 cursor-pointer group p-1.5 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="relative">
            {user.avatar ? (
                <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm group-hover:border-cyan-100 transition-all"
                />
            ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-all">
                {user.name.charAt(0).toUpperCase()}
                </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          <div className="hidden md:block text-right">
            <p className="text-sm font-semibold text-gray-800 leading-none group-hover:text-cyan-700 transition-colors">{user.name}</p>
            <p className="text-xs text-gray-500 mt-1 truncate max-w-[120px]">{user.email}</p>
          </div>

          <ChevronDown size={16} className="text-gray-400 group-hover:text-cyan-600 transition-colors hidden md:block" />
        </div>
      </div>
    </header>
  );
};
