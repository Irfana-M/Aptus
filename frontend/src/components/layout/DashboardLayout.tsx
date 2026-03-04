import React from 'react';
import { DashboardSidebar, type NavItem } from './DashboardSidebar';
import { DashboardTopbar, type UserProfile } from './DashboardTopbar';
import { BaseDashboardLayout } from '../base/BaseDashboardLayout';

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
  return (
    <BaseDashboardLayout
      sidebar={
        <DashboardSidebar 
          isOpen={false} // Managed by BaseDashboardLayout
          onClose={() => {}} // Managed by BaseDashboardLayout
          navItems={navItems}
          onLogout={onLogout}
          logoSrc={logoSrc}
          title={appTitle}
          extraContent={extraContent}
        />
      }
      topbar={(onMenuToggle) => (
        <DashboardTopbar 
          onMenuToggle={onMenuToggle} 
          title={title} 
          user={user}
        />
      )}
    >
      {children}
    </BaseDashboardLayout>
  );
};
