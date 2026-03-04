import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import type { NavItem } from '../layout/DashboardSidebar';
import { Home, User, Bell, Users, FileText, BookOpen, CreditCard } from 'lucide-react';
import type { RootState, AppDispatch } from '../../app/store';
import { logoutUser } from '../../features/auth/authThunks';
import { fetchStudentProfile } from '../../features/student/studentThunk';
import { ROUTES } from '../../constants/routes.constants';
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
    { icon: <Home size={20} />, label: 'Dashboard', path: ROUTES.STUDENT.DASHBOARD },
    { icon: <BookOpen size={20} />, label: 'My Courses', path: ROUTES.STUDENT.MY_COURSES },
    { icon: <User size={20} />, label: 'Profile', path: ROUTES.STUDENT.PROFILE },
    { icon: <Users size={20} />, label: 'Classroom', path: ROUTES.STUDENT.CLASSROOM },
    { icon: <FileText size={20} />, label: 'Study & Assignments', path: ROUTES.STUDENT.STUDY_MATERIALS },
    { icon: <FileText size={20} />, label: 'Attendance', path: ROUTES.STUDENT.ATTENDANCE },
    { icon: <BookOpen size={20} />, label: 'Exams', path: ROUTES.STUDENT.EXAMS },
    { icon: <CreditCard size={20} />, label: 'Payments', path: ROUTES.STUDENT.PAYMENTS },
    { icon: <Bell size={20} />, label: 'Notifications', path: ROUTES.COMMON.NOTIFICATIONS },
  ].map(item => ({
    ...item,
    disabled: isLocked && item.path !== ROUTES.STUDENT.DASHBOARD && item.path !== ROUTES.STUDENT.PAYMENTS && item.path !== ROUTES.STUDENT.MY_COURSES && item.path !== ROUTES.STUDENT.PROFILE
  }));

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate(ROUTES.LOGIN);
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
