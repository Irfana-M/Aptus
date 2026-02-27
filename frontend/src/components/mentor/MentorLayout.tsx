import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, User, Users, Calendar, BookOpen, FileText, ClipboardList, Bell, Clock } from 'lucide-react';
import { DashboardLayout } from '../layout/DashboardLayout';
import type { NavItem } from '../layout/DashboardSidebar';
import { MentorSidebarProfile } from '../../pages/mentor/MentorSidebarProfile';
import { fetchMentorProfile } from '../../features/mentor/mentorThunk';
import { logoutUser } from '../../features/auth/authThunks';
import type { AppDispatch, RootState } from '../../app/store';

interface MentorLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const MentorLayout: React.FC<MentorLayoutProps> = ({ children, title }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { profile } = useSelector((state: RootState) => state.mentor);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!profile) {
      dispatch(fetchMentorProfile());
    }
  }, [dispatch, profile]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const mentorNavItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/mentor/dashboard' },
    { icon: <User size={20} />, label: 'Profile', path: '/mentor/profile-setup' },
    { icon: <Users size={20} />, label: 'Students/Batches', path: '/mentor/students' },
    { icon: <Calendar size={20} />, label: 'Attendance', path: '/mentor/attendance' },
    { icon: <BookOpen size={20} />, label: 'Classroom', path: '/mentor/classroom' },
    { icon: <FileText size={20} />, label: 'Study & Assignments', path: '/mentor/study-materials' },
    { icon: <ClipboardList size={20} />, label: 'Class History', path: '/mentor/class-history' },
    { icon: <Clock size={20} />, label: 'Availability', path: '/mentor/availability' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/notifications' },
  ];

  const dashboardUser = {
      name: profile?.fullName || user?.fullName || "Mentor",
      email: user?.email || "",
      avatar: profile?.profileImageUrl || (user?.profilePicture?.startsWith('http') ? user.profilePicture : undefined),
      role: "mentor"
  };

  // We can inject the sidebar profile widget here
  const sidebarContent = (
    <MentorSidebarProfile 
      profile={profile ? {
        fullName: profile.fullName,
        email: profile.email,
        profileImageUrl: profile.profileImageUrl as string, 
        bio: profile.bio
      } : null} 
    />
  );

  return (
    <DashboardLayout
      navItems={mentorNavItems}
      user={dashboardUser}
      title={title || "Mentor Dashboard"}
      onLogout={handleLogout}
      appTitle="Aptus"
      extraContent={sidebarContent}
    >
      {children}
    </DashboardLayout>
  );
};
