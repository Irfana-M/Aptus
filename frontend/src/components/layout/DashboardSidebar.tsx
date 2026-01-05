import React from "react";
import aptusLogo from "../../assets/images/aptusLogo.jpeg"; 
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  disabled?: boolean;
}

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

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out bg-gradient-to-b from-cyan-600 to-teal-700 flex flex-col h-full shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-6 border-b border-cyan-500/30">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors duration-200 w-full">
              <img 
                src={logoSrc} 
                alt={title} 
                className="h-8 w-auto object-contain rounded-md"
              />
              <span className="text-xl font-bold text-gray-800">{title}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
                const isActive = currentActiveItem === item.label;
                return (
                  <button
                    key={item.label}
                    onClick={() => !item.disabled && handleNavigation(item.path)}
                    disabled={item.disabled}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isActive
                        ? "bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/10"
                        : item.disabled
                          ? "text-cyan-200/40 cursor-not-allowed"
                          : "text-cyan-50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-300 rounded-full" />
                    )}
                    
                    {item.disabled && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-200/30">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        </div>
                    )}

                    <div className="flex items-center space-x-3 z-10">
                      <div
                        className={`transition-transform duration-300 ${
                          isActive
                            ? "scale-110 text-cyan-200"
                            : item.disabled
                              ? "opacity-40"
                              : "group-hover:scale-110 group-hover:text-cyan-200"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className={`font-medium tracking-wide ${isActive ? "font-semibold" : ""} ${item.disabled ? "opacity-60" : ""}`}>
                          {item.label}
                      </span>
                    </div>

                    {item.badge && !item.disabled && (
                      <span className="bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md z-10">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
            })}
            
            {extraContent && (
              <div className="pt-4 border-t border-cyan-500/20">
                {extraContent}
              </div>
            )}
          </nav>

          {/* Footer Section */}
          <div className="p-4 border-t border-cyan-500/30 bg-cyan-800/20">
            <button
              onClick={onLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-cyan-100 hover:bg-red-500/10 hover:text-red-200 hover:border hover:border-red-500/20 transition-all duration-200 group"
            >
              <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
