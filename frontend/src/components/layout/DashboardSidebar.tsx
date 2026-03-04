import React from "react";
import aptusLogo from "../../assets/images/aptusLogo.jpeg"; 
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { BaseSidebar } from "../base/BaseSidebar";
import { BaseSidebarItem } from "../base/BaseSidebarItem";
import { type NavItem } from "../../types/layout.types";
export type { NavItem };

interface DashboardSidebarProps {
  isOpen: boolean;
  navItems: NavItem[];
  onClose: () => void;
  onLogout: () => void;
  logoSrc?: string;
  title?: string;
  extraContent?: React.ReactNode;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isOpen,
  navItems,
  onClose,
  onLogout,
  logoSrc = aptusLogo,
  title = "Aptus",
  extraContent,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentActiveItem = (): string => {
    const currentPath = location.pathname;
    const sortedItems = [...navItems].sort((a, b) => b.path.length - a.path.length);

    const foundActiveItem = sortedItems.find((item) => {
        if (item.path === currentPath) return true;
        if (currentPath.startsWith(item.path + '/') || currentPath === item.path) {
            return true;
        }
        return false;
    });

    return foundActiveItem?.label || "";
  };

  const currentActiveItem = getCurrentActiveItem();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const header = (
    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors duration-200 w-full">
      <img 
        src={logoSrc} 
        alt={title} 
        className="h-8 w-auto object-contain rounded-md"
      />
      <span className="text-xl font-bold text-gray-800">{title}</span>
    </div>
  );

  const footer = (
    <button
      onClick={onLogout}
      className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-cyan-100 hover:bg-red-500/10 hover:text-red-200 hover:border hover:border-red-500/20 transition-all duration-200 group"
    >
      <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
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
          onClick={() => handleNavigation(item.path)}
          badge={item.badge}
          disabled={item.disabled}
        />
      ))}
      
      {extraContent && (
        <div className="pt-4 border-t border-white/10">
          {extraContent}
        </div>
      )}
    </BaseSidebar>
  );
};
