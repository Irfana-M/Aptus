import React from "react";
import aptusLogo from "../../assets/images/aptusLogo.jpeg";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  HelpCircle,
  Bell,
  LogOut,
  LayoutDashboard,
  FileText,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  activeItem: string;
  onItemClick: (item: string) => void;
  onClose: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
    path: "/admin/dashboard",
  },
  { icon: <Users size={20} />, label: "Students", path: "/admin/students" },
  { icon: <Users size={20} />, label: "Mentors", path: "/admin/mentors" },
  { icon: <BookOpen size={20} />, label: "Courses", path: "/admin/courses" },
  { icon: <DollarSign size={20} />, label: "Finance", path: "/admin/finance" },
  {
    icon: <Calendar size={20} />,
    label: "Statistics",
    path: "/admin/statistics",
  },
  { icon: <FileText size={20} />, label: "Reports", path: "/admin/reports" },
  { icon: <HelpCircle size={20} />, label: "Support", path: "/admin/support" },
  {
    icon: <Bell size={20} />,
    label: "Notifications",
    path: "/admin/notifications",
    badge: 3,
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
  const { adminLogout } = useAuth(); // Use hook INSIDE the component

  const getCurrentActiveItem = (): string => {
    const currentPath = location.pathname;

    const foundActiveItem = navItems.find((item) => {
      if (item.path === "/admin" && currentPath === "/admin") {
        return true;
      }
      if (item.path !== "/admin" && currentPath.startsWith(item.path)) {
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
    console.log("Logging out...");
    adminLogout(); // Use adminLogout from the hook

    if (window.innerWidth < 1024) {
      onClose();
    }
  }; // Added missing closing brace and semicolon

  const currentActiveItem = getCurrentActiveItem();

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
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out bg-gradient-to-b from-cyan-600 to-teal-700`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between p-6 border-b border-cyan-500">
            <div
              className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-white transition-colors duration-200"
              onClick={() => handleNavigation("/admin", "Dashboard")}
            >
              <img 
                src={aptusLogo} 
                alt="Aptus" 
                className="h-8 w-auto object-contain rounded-md"
              />
              <span className="text-xl font-bold text-gray-800">Aptus</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-8 px-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path, item.label)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 text-white group relative ${
                  currentActiveItem === item.label
                    ? "bg-teal-800 shadow-lg"
                    : "hover:bg-cyan-500 hover:shadow-md"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`transition-transform duration-200 ${
                      currentActiveItem === item.label
                        ? "scale-110"
                        : "group-hover:scale-105"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>

                {/* Badge */}
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}

                {/* Active indicator */}
                {currentActiveItem === item.label && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Footer Section */}
          <div className="p-4 border-t border-cyan-500">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-white hover:bg-cyan-500 transition-colors duration-200"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}; // Added missing closing brace for the component
