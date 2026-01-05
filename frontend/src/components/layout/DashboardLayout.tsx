import React, { useState } from 'react';
import { DashboardSidebar, type NavItem } from './DashboardSidebar';
import { DashboardTopbar, type UserProfile } from './DashboardTopbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  user?: UserProfile;
  title?: string;
  onLogout: () => void;
  logoSrc?: string;
  appTitle?: string;
  extraContent?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
    children, 
    navItems, 
    user, 
    title,
    onLogout,
    logoSrc,
    appTitle,
    extraContent
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans">
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        navItems={navItems}
        onLogout={onLogout}
        logoSrc={logoSrc}
        title={appTitle}
        extraContent={extraContent}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <DashboardTopbar 
            onMenuToggle={() => setSidebarOpen(true)} 
            title={title} 
            user={user}
        />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
