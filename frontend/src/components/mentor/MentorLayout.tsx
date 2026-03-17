import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes.constants';
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
    navigate(ROUTES.LOGIN);
  };

  const mentorNavItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Dashboard', path: ROUTES.MENTOR.DASHBOARD },
    { icon: <User size={20} />, label: 'Profile', path: ROUTES.MENTOR.PROFILE_SETUP },
    { icon: <Users size={20} />, label: 'Students/Batches', path: ROUTES.MENTOR.STUDENTS },
    { icon: <Calendar size={20} />, label: 'Attendance', path: ROUTES.MENTOR.ATTENDANCE },
    { icon: <BookOpen size={20} />, label: 'Classroom', path: ROUTES.MENTOR.CLASSROOM },
    { icon: <FileText size={20} />, label: 'Study & Assignments', path: ROUTES.MENTOR.STUDY_MATERIALS },
    { icon: <ClipboardList size={20} />, label: 'Class History', path: ROUTES.MENTOR.CLASS_HISTORY },
    {
  icon: <ClipboardList size={20} />,
  label: 'Exams',
  path: ROUTES.MENTOR.EXAMS
},
    { icon: <Clock size={20} />, label: 'Availability', path: ROUTES.MENTOR.AVAILABILITY },
    { icon: <Calendar size={20} />, label: 'Leaves', path: ROUTES.MENTOR.LEAVES },
    { icon: <Bell size={20} />, label: 'Notifications', path: ROUTES.COMMON.NOTIFICATIONS },
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
