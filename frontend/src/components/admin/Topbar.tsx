import React from "react";
import { Search, ChevronDown } from "lucide-react";
import { NotificationBell } from "../shared/NotificationBell";
import { BaseTopbar } from "../base/BaseTopbar";

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
  const subtitle = `Welcome back, ${user.name}`;

  const search = (
    <div className="relative group">
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-cyan-500 transition-colors"
        size={20}
      />
      <input
        type="text"
        placeholder="Search here..."
        className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 w-64"
      />
    </div>
  );

  const actions = (
    <>
      <NotificationBell />
      <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
       
        
      </button>
    </>
  );

  const profile = (
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
  );

  return (
    <BaseTopbar
      onMenuToggle={onMenuToggle}
      title={title}
      subtitle={subtitle}
      search={search}
      actions={actions}
      profile={profile}
      sticky={false}
    />
  );
};
