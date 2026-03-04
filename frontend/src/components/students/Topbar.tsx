import React from 'react';
import { Bell, Video, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { BaseTopbar } from '../base/BaseTopbar';

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

  const search = (
    <div className="relative w-64 lg:w-80">
      <input
        type="text"
        placeholder="Search..."
        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
      />
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
    </div>
  );

  const actions = (
    <div className="flex items-center gap-3">
       <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
       </button>
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
          <Video className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );

  const profile = (
    <div className="flex items-center gap-3 pl-3">
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
  );

  return (
    <BaseTopbar
      onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      title={title}
      search={search}
      actions={actions}
      profile={profile}
      className="bg-white border-b border-gray-200"
    />
  );
};

export default Topbar;
