import React from "react";
import aptusLogo from "../../assets/images/aptusLogo.jpeg";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes.constants";
import {
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Bell,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { BaseSidebar } from "../base/BaseSidebar";
import { BaseSidebarItem } from "../base/BaseSidebarItem";
import type { NavItem } from "../../types/layout.types";

interface SidebarProps {
  isOpen: boolean;
  activeItem: string;
  onItemClick: (item: string) => void;
  onClose: () => void;
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
    path: ROUTES.ADMIN.DASHBOARD,
  },
  { icon: <Users size={20} />, label: "Students", path: ROUTES.ADMIN.STUDENTS },
  { icon: <Users size={20} />, label: "Mentors", path: ROUTES.ADMIN.MENTORS },
  { icon: <Users size={20} />, label: "Mentor Requests", path: ROUTES.ADMIN.MENTOR_REQUESTS },
  { icon: <BookOpen size={20} />, label: "Courses", path: ROUTES.ADMIN.COURSES },
  { icon: <DollarSign size={20} />, label: "Finance", path: ROUTES.ADMIN.FINANCE },
  { icon: <Calendar size={20} />, label: "Attendance", path: ROUTES.ADMIN.ATTENDANCE },
  { icon: <Calendar size={20} />, label: "Leave Management", path: ROUTES.ADMIN.LEAVES },
  {
    icon: <Bell size={20} />,
    label: "Notifications",
    path: ROUTES.COMMON.NOTIFICATIONS,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeItem: propActiveItem,
  onItemClick,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogout } = useAuth();

  const getCurrentActiveItem = (): string => {
    const currentPath = location.pathname;

    const foundActiveItem = navItems.find((item) => {
      if (item.path === ROUTES.ADMIN.DASHBOARD && currentPath === ROUTES.ADMIN.DASHBOARD) {
        return true;
      }
      if (item.path !== ROUTES.ADMIN.DASHBOARD && currentPath.startsWith(item.path)) {
        return true;
      }
      return false;
    });

    return foundActiveItem?.label || propActiveItem || "Dashboard";
  };

  const handleNavigation = (path: string, label: string) => {
    onItemClick(label);
    navigate(path);

    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogout = () => {
    adminLogout();

    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const currentActiveItem = getCurrentActiveItem();

  const header = (
    <div
      className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors duration-200 w-full"
      onClick={() => handleNavigation(ROUTES.ADMIN.DASHBOARD, "Dashboard")}
    >
      <img 
        src={aptusLogo} 
        alt="Aptus" 
        className="h-8 w-auto object-contain rounded-md"
      />
      <span className="text-xl font-bold text-gray-800">Aptus</span>
    </div>
  );

  const footer = (
    <button
      onClick={handleLogout}
      className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-white hover:bg-cyan-500 transition-colors duration-200"
    >
      <LogOut size={20} />
      <span className="font-medium">Logout</span>
    </button>
  );

  return (
    <BaseSidebar
      isOpen={isOpen}
      onClose={onClose}
      header={header}
      footer={footer}
    >
      {navItems.map((item) => (
        <BaseSidebarItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          isActive={currentActiveItem === item.label}
          onClick={() => handleNavigation(item.path, item.label)}
          badge={item.badge}
          activeClassName="bg-teal-800 shadow-lg"
          inactiveClassName="hover:bg-cyan-500 hover:shadow-md"
        />
      ))}
    </BaseSidebar>
  );
};
