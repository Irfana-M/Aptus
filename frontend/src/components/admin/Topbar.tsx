import React from "react";
import { Menu, Search, MessageSquare, ChevronDown } from "lucide-react";
import { NotificationBell } from "../common/NotificationBell";

interface TopbarProps {
  onMenuToggle: () => void;
  title?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export const Topbar: React.FC<TopbarProps> = ({
  onMenuToggle,
  title = "Dashboard",
  user = {
    name: "Admin User",
    email: "admin@mentora.com",
    avatar: "",
  },
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <Menu size={24} className="text-gray-600" />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search here..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 w-64"
          />
        </div>

        <NotificationBell />

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
          <MessageSquare
            size={20}
            className="text-gray-600 group-hover:text-cyan-600"
          />
          <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer group">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>

          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          <ChevronDown
            size={16}
            className="text-gray-400 group-hover:text-gray-600"
          />
        </div>
      </div>
    </header>
  );
};
