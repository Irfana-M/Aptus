import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import type { NavItem } from '../layout/DashboardSidebar';
import { Home, User, Bell, Users, FileText, BookOpen, CreditCard } from 'lucide-react';
import type { RootState, AppDispatch } from '../../app/store';
import { logoutUser } from '../../features/auth/authThunks';
import { fetchStudentProfile } from '../../features/student/studentThunk';
// Logo import
// import aptusLogo from "../../assets/images/aptusLogo.jpeg"; 

interface StudentLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, title }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile } = useSelector((state: RootState) => state.student);
  
  React.useEffect(() => {
    // Always fetch fresh profile data to ensure hasPaid is current
    dispatch(fetchStudentProfile());
  }, [dispatch]);

  // Prioritize profile data as it's refreshed more often than auth user
  const hasPaid = profile?.hasPaid ?? user?.hasPaid;
  const isTrialCompleted = profile?.isTrialCompleted ?? user?.isTrialCompleted;
  
  const isLocked = !!(!hasPaid && isTrialCompleted);
  

  
  const studentNavItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/student/dashboard' },
    { icon: <BookOpen size={20} />, label: 'My Courses', path: '/student/my-courses' },
    { icon: <User size={20} />, label: 'Profile', path: '/student/profile' },
    { icon: <Users size={20} />, label: 'Classroom', path: '/student/classroom' },
    { icon: <FileText size={20} />, label: 'Study & Assignments', path: '/student/study-materials' },
    { icon: <FileText size={20} />, label: 'Attendance', path: '/student/attendance' },
    { icon: <BookOpen size={20} />, label: 'Exams', path: '/student/exams' },
    { icon: <CreditCard size={20} />, label: 'Payments', path: '/student/payments' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/notifications' },
  ].map(item => ({
    ...item,
    disabled: isLocked && item.path !== '/student/dashboard' && item.path !== '/student/payments' && item.path !== '/student/my-courses' && item.path !== '/student/profile'
  }));

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const dashboardUser = {
      name: profile?.fullName || user?.fullName || "Student",
      email: user?.email || "",
      avatar: profile?.profileImageUrl || (user as { profileImageUrl?: string })?.profileImageUrl,
      role: "student"
  };

  return (
    <DashboardLayout
      navItems={studentNavItems}
      user={dashboardUser}
      title={title || "Student Dashboard"}
      onLogout={handleLogout}
      appTitle="Aptus"
    >
      {children}
    </DashboardLayout>
  );
};

export default StudentLayout;
