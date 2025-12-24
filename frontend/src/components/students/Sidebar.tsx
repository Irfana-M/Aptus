import React from 'react';
import { Home, User, MessageSquare, Bell, Users, FileText, BookOpen, CreditCard, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
// import { useDispatch } from 'react-redux';
// import { logoutUser } from '../../features/auth/authThunks'; // Uncomment when ready

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // const dispatch = useDispatch();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/student/dashboard' },
    { icon: User, label: 'Profile', path: '/student/profile' },
    { icon: MessageSquare, label: 'Chats', path: '/student/chats' },
    { icon: Bell, label: 'Notifications', path: '/student/notifications' },
    { icon: Users, label: 'Classroom', path: '/student/classroom' }, // Placeholder
    { icon: FileText, label: 'Assignments', path: '/student/assignments' },
    { icon: BookOpen, label: 'Study Materials', path: '/student/materials' },
    { icon: Users, label: 'Integrations', path: '/student/integrations' }, // Placeholder
    { icon: FileText, label: 'Attendance', path: '/student/attendance' }, // Placeholder
    { icon: BookOpen, label: 'Exams', path: '/student/exams' }, // Placeholder
    { icon: CreditCard, label: 'Payments', path: '/student/payments' },
    { icon: MessageSquare, label: 'Feedback', path: '/student/feedback' }, // Placeholder
  ];

  const handleLogout = () => {
     // dispatch(logoutUser() as any);
     // navigate('/login');
     console.log('Logout clicked');
  };

  return (
    <>
      <aside className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b border-gray-200">
            {/* <img src="/aptusLogo.jpeg" alt="Aptus" className="w-8 h-8 rounded-full" /> */}
             <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <span className="text-2xl font-bold text-teal-600">Aptus</span>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => {
                      navigate(item.path);
                      if(window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
                    isActive ? 'bg-teal-50 text-teal-600 border-r-4 border-teal-500' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-gray-500'}`} />
                  <span className={`font-medium ${isActive ? 'text-teal-900' : 'text-gray-600'}`}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-4 text-gray-600 hover:bg-red-50 hover:text-red-600 border-t border-gray-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
