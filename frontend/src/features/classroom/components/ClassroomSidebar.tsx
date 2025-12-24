import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  MessageSquare, 
  Bell, 
  Video, 
  FileText, 
  BookOpen, 
  Puzzle, 
  Calendar, 
  GraduationCap, 
  CreditCard, 
  MessageCircle,
  LogOut
} from 'lucide-react';

const navItems = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { icon: <User size={20} />, label: 'Profile' },
  { icon: <MessageSquare size={20} />, label: 'Chats', badge: 5 },
  { icon: <Bell size={20} />, label: 'Notifications' },
  { icon: <Video size={20} />, label: 'Classroom', active: true },
  { icon: <FileText size={20} />, label: 'Assignments' },
  { icon: <BookOpen size={20} />, label: 'Study Materials' },
  { icon: <Puzzle size={20} />, label: 'Integrations' },
  { icon: <Calendar size={20} />, label: 'Attendance' },
  { icon: <GraduationCap size={20} />, label: 'Exams' },
  { icon: <CreditCard size={20} />, label: 'Payments' },
  { icon: <MessageCircle size={20} />, label: 'Feedback' },
];

export const ClassroomSidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <div className="flex flex-col h-full py-6">
      {/* Brand */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="p-2">
            <GraduationCap size={32} className="text-[#3CB4B4]" />
        </div>
        <span className="text-2xl font-bold text-[#3CB4B4]">Aptus</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group ${
              item.active 
                ? 'bg-[#F0F9F9] text-[#3CB4B4]' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className={`${item.active ? 'text-[#3CB4B4]' : 'text-gray-400 group-hover:text-gray-600'}`}>
              {item.icon}
            </span>
            <span className="font-medium text-sm">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-[#3CB4B4]/10 text-[#3CB4B4] text-[10px] font-bold px-1.5 py-0.5 rounded">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 mt-auto">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};
