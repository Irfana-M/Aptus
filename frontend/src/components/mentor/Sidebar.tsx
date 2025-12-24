import React, { useState } from 'react';
import aptusLogo from '../../assets/images/aptusLogo.jpeg';
import { Home, User, Users, Calendar, BookOpen, FileText, ClipboardList, Bell, MessageSquare, LogOut, X, Clock } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authThunks';
import type { AppDispatch } from '../../app/store';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Dashboard');

  const handleLogout = async () => {
      await dispatch(logoutUser());
      navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/mentor/dashboard' },
    { icon: User, label: 'Profile', path: '/mentor/profile-setup' },
    { icon: Users, label: 'Students/Batches', path: '/mentor/students' },
    { icon: Calendar, label: 'Attendance', path: '/mentor/attendance' },
    { icon: BookOpen, label: 'Classroom', path: '/mentor/classroom' },
    { icon: FileText, label: 'Study Materials', path: '/mentor/materials' },
    { icon: ClipboardList, label: 'Assignments', path: '/mentor/assignments' },
    { icon: ClipboardList, label: 'Completed Classes', path: '/mentor/completed-trial-classes' },
    { icon: Bell, label: 'Notifications', path: '/mentor/notifications' },
    { icon: Clock, label: 'Availability', path: '/mentor/availability' },
    { icon: MessageSquare, label: 'Chats', path: '/mentor/chats' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img 
                src={aptusLogo} 
                alt="Aptus" 
                className="h-10 w-auto object-contain rounded-lg"
              />
              <span className="text-xl font-semibold text-teal-500">Aptus</span>
            </div>
            <button onClick={onClose} className="lg:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || activeItem === item.label;
              return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setActiveItem(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )})}
          </nav>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-8 py-4 text-gray-700 hover:bg-gray-50 border-t border-gray-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
