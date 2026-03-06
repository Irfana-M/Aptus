import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAppSelector } from "../../app/hooks";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  activeItem?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title,
  activeItem: propActiveItem 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(propActiveItem || "Dashboard");
  const { admin } = useAppSelector((state) => state.admin);

  const adminUser = admin ? {
    name: "Admin User",
    email: admin.email || "admin@mentora.com",
    avatar: "",
  } : undefined;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        activeItem={activeNav}
        onItemClick={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={title || "Admin Console"}
          user={adminUser}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
