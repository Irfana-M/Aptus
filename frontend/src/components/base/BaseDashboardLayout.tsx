import React, { useState } from 'react';

interface BaseDashboardLayoutProps {
  sidebar: React.ReactNode;
  topbar: (onMenuToggle: () => void) => React.ReactNode;
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  sidebar,
  topbar,
  children,
  className = "bg-gray-50/50",
  mainClassName = "p-4 lg:p-8",
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${className}`}>
      {/* This renders the sidebar, which handles its own open state internally if needed, 
          but usually we pass isOpen to it. Since the layout manages the state, 
          we need to clone or pass props if we wanted to be generic, 
          but here we assume the passed sidebar ReactNode is already configured with props 
          or we use a pattern where sidebar is a component.
          To keep it simple, we'll assume the sidebar prop is the Sidebar component already
          receiving isOpen and onClose.
      */}
      {React.isValidElement(sidebar) 
        ? React.cloneElement(sidebar as React.ReactElement<any>, { 
            isOpen: sidebarOpen, 
            onClose: () => setSidebarOpen(false) 
          }) 
        : sidebar}
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {topbar(() => setSidebarOpen(true))}
        
        <main className={`flex-1 overflow-y-auto scroll-smooth custom-scrollbar ${mainClassName}`}>
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
