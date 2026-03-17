import React, { useState } from 'react';
import aptusLogo from '../../assets/images/aptusLogo.jpeg';
import { Home, User, Users, Calendar, BookOpen, FileText, ClipboardList, Bell, MessageSquare, LogOut, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authThunks';
import type { AppDispatch } from '../../app/store';
import { BaseSidebar } from '../base/BaseSidebar';
import { BaseSidebarItem } from '../base/BaseSidebarItem';

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
      navigate(ROUTES.LOGIN);
  };

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: ROUTES.MENTOR.DASHBOARD },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: ROUTES.MENTOR.PROFILE },
    { icon: <Users className="w-5 h-5" />, label: 'Students/Batches', path: ROUTES.MENTOR.STUDENTS },
    { icon: <Calendar className="w-5 h-5" />, label: 'Attendance', path: ROUTES.MENTOR.ATTENDANCE },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Classroom', path: ROUTES.MENTOR.CLASSROOM },
    { icon: <FileText className="w-5 h-5" />, label: 'Study Materials', path: ROUTES.MENTOR.MATERIALS },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Assignments', path: ROUTES.MENTOR.ASSIGNMENTS },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Class History', path: ROUTES.MENTOR.CLASS_HISTORY },
    {
  icon: <ClipboardList className="w-5 h-5" />,
  label: 'Exams',
  path: ROUTES.MENTOR.EXAMS
},
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', path: ROUTES.MENTOR.NOTIFICATIONS },
    { icon: <Clock className="w-5 h-5" />, label: 'Availability', path: ROUTES.MENTOR.AVAILABILITY },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Chats', path: ROUTES.MENTOR.CHATS },
  ];

  const header = (
    <div className="flex items-center gap-3">
      <img 
        src={aptusLogo} 
        alt="Aptus" 
        className="h-10 w-auto object-contain rounded-lg"
      />
      <span className="text-xl font-semibold text-teal-500">Aptus</span>
    </div>
  );

  const footer = (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors w-full"
    >
      <LogOut className="w-5 h-5" />
      <span className="text-sm font-medium">Logout</span>
    </button>
  );

  return (
    <BaseSidebar
      isOpen={isOpen}
      onClose={onClose}
      header={header}
      footer={footer}
      className="bg-white border-r border-gray-200"
    >
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path || activeItem === item.label;
        return (
          <BaseSidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={isActive}
            onClick={() => {
              setActiveItem(item.label);
              navigate(item.path);
            }}
            activeClassName="bg-purple-50 text-purple-600"
            inactiveClassName="text-gray-700 hover:bg-gray-50"
            showIndicator={false}
          />
        );
      })}
    </BaseSidebar>
  );
};

export default Sidebar;
