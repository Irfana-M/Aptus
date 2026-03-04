import React from 'react';
import { Home, User, MessageSquare, Bell, Users, FileText, BookOpen, CreditCard, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import { BaseSidebar } from '../base/BaseSidebar';
import { BaseSidebarItem } from '../base/BaseSidebarItem';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Dashboard', path: ROUTES.STUDENT.DASHBOARD },
    { icon: <User className="w-5 h-5" />, label: 'Profile', path: ROUTES.STUDENT.PROFILE },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Chats', path: ROUTES.STUDENT.CHATS },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', path: ROUTES.STUDENT.NOTIFICATIONS },
    { icon: <Users className="w-5 h-5" />, label: 'Classroom', path: ROUTES.STUDENT.CLASSROOM },
    { icon: <FileText className="w-5 h-5" />, label: 'Assignments', path: ROUTES.STUDENT.ASSIGNMENTS },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Study Materials', path: ROUTES.STUDENT.MATERIALS },
    { icon: <Users className="w-5 h-5" />, label: 'Integrations', path: ROUTES.STUDENT.INTEGRATIONS },
    { icon: <FileText className="w-5 h-5" />, label: 'Attendance', path: ROUTES.STUDENT.ATTENDANCE },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Exams', path: ROUTES.STUDENT.EXAMS },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Payments', path: ROUTES.STUDENT.PAYMENTS },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Feedback', path: ROUTES.STUDENT.FEEDBACK },
  ];

  const handleLogout = () => {
     console.log('Logout clicked');
  };

  const header = (
    <div className="flex items-center gap-2">
       <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
        <span className="text-white text-xl font-bold">A</span>
      </div>
      <span className="text-2xl font-bold text-teal-600">Aptus</span>
    </div>
  );

  const footer = (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
    >
      <LogOut className="w-5 h-5" />
      <span>Logout</span>
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
      {menuItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        return (
          <BaseSidebarItem
            key={index}
            icon={item.icon}
            label={item.label}
            isActive={isActive}
            onClick={() => {
                navigate(item.path);
                if(window.innerWidth < 1024) onClose();
            }}
            activeClassName="bg-teal-50 text-teal-600 border-r-4 border-teal-500 rounded-none"
            inactiveClassName="text-gray-600 hover:bg-gray-50"
            showIndicator={false}
          />
        );
      })}
    </BaseSidebar>
  );
};

export default Sidebar;
