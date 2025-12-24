import React from 'react';
import { Bell, Video, Menu, X, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

interface TopbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  title?: string;
}

const Topbar: React.FC<TopbarProps> = ({ sidebarOpen, setSidebarOpen, title = 'Dashboard' }) => {
  // Use auth user as fallback if student profile is partial, but prefer student profile for image
  const { user } = useSelector((state: RootState) => state.auth);
  const studentProfile = useSelector((state: RootState) => state.student.profile);
  
  // Logic to determine display name and image
  const displayName = studentProfile?.fullName || user?.fullName || 'Student';
  // Use profileImageUrl if available, otherwise check nested data, otherwise generic dicebear
  const profileImage = studentProfile?.profileImageUrl 
    || user?.profileImageUrl 
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">{title}</h1>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          {/* Search Bar - Hidden on small mobile */}
          <div className="hidden md:block relative w-64 lg:w-80">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
             <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                <Video className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <img 
                src={profileImage} 
                alt="Profile" 
                className="w-9 h-9 rounded-full object-cover border border-gray-200" 
            />
            <div className="hidden lg:block leading-tight">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'Student'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
