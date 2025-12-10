import React from 'react';
import { Search, Bell, MessageSquare, Menu } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
  mentorName?: string;
  mentorRole?: string;
  profileImage?: string;
}

const Topbar: React.FC<TopbarProps> = ({ 
  onMenuClick, 
  mentorName = "Mentor", 
  mentorRole = "Subject Mentor",
  profileImage = "https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor"
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onMenuClick} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell className="w-6 h-6 text-gray-600" />
          </button>
          <button className="relative">
            <MessageSquare className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={profileImage}
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">{mentorName}</p>
              <p className="text-xs text-gray-500">{mentorRole}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
