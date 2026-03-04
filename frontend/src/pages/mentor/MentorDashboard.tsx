import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import { Users, Calendar, FileText, ChevronLeft, ChevronRight, MessageSquare, Video, Clock, Home, User, BookOpen, ClipboardList } from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import type { NavItem } from '../../types/layout.types';
import { Table, type TableColumn } from '../../components/mentor/Table';
import { fetchMentorTrialClasses, fetchMentorProfile, updateTrialClassStatus, fetchMentorCourses } from "../../features/mentor/mentorThunk";
import { logoutUser } from "../../features/auth/authThunks";
import type { AppDispatch, RootState } from "../../app/store";
import { isClassOverdue } from '../../utils/timeUtils';
import { toast } from 'react-hot-toast';
import { MentorSidebarProfile } from './MentorSidebarProfile';

interface Student {
  id: string;
  name: string;
  time: string;
  color: string;
  avatar?: string | null;
  meetLink?: string;
  status: string;
}

interface Assignment {
  subject: string;
  class: string;
  task: string;
  page: string;
  date: string;
  status: 'Pending' | 'Completed';
}

interface Activity {
  id: string;
  type: 'session' | 'upload' | 'schedule';
  text: string;
  time: string;
}

// Helper function definitions
const renderAssignmentStatus = (item: Assignment) => {
    const statusColor = item.status === 'Completed' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-orange-100 text-orange-700';
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
        {item.status}
      </span>
    );
};

import { mentorApi } from '../../features/mentor/mentorApi';
import type { Session } from '../../types/schedulingTypes';
import { sessionApi } from '../../features/session/sessionApi';
import socketService from '../../services/socketService';

// ... (existing imports)

// Main Dashboard Component
const MentorDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  // ... existing hooks
  
  // Modal State
  const { trialClasses, courses, loading, profile } = useSelector((state: RootState) => state.mentor);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [currentDate] = useState(new Date());
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const refreshSessions = async () => {
    setSessionsLoading(true);
    try {
        // Fetch sessions for today using the generic daily endpoint
        const sessions = await mentorApi.getDailySessions(new Date().toISOString());
        
        // Map to Session interface
        const mappedSessions: Session[] = sessions.map((s: Record<string, unknown>) => ({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            status: s.status,
            meetingLink: s.meetLink,
            studentId: {
                fullName: s.studentName,
                profileImage: s.studentImage
            },
            subjectId: {
                subjectName: s.subject
            },
            type: s.type
        }));

        setTodaySessions(mappedSessions);
    } catch (error) {
        console.error("Failed to fetch daily sessions", error);
        toast.error("Failed to load today's sessions");
    } finally {
        setSessionsLoading(false);
    }
  };

  useEffect(() => {
    dispatch(fetchMentorTrialClasses());
    dispatch(fetchMentorCourses()); // Fetch Premium Courses
    if (!profile) {
        dispatch(fetchMentorProfile());
    }
    
    refreshSessions();
    
    // Listen for real-time updates via socket
    const socket = socketService.connect('mentor');
    if (socket) {
        socket.on('notification', (data) => {
            console.log('🔔 Notification received in Dashboard:', data);
            // Refresh on any scheduling-related notification
            if (['session_rescheduled', 'session_cancelled', 'student_absence', 'session_booked'].includes(data.type) || 
                (data.title && (data.title.includes('Rescheduled') || data.title.includes('Cancelled') || data.title.includes('Booked')))) {
                 refreshSessions();
            }
        });
    }

    return () => {
        if (socket) {
            socket.off('notification');
        }
    };
  }, [dispatch, profile]);

  // Debugging logs
  useEffect(() => {
    console.log("DEBUG MentorDashboard: Trial Classes:", trialClasses);
    console.log("DEBUG MentorDashboard: Courses:", courses);
  }, [trialClasses, courses]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate(ROUTES.LOGIN);
  };

  const mentorNavItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/mentor/dashboard' },
    { icon: <User size={20} />, label: 'Profile', path: '/mentor/profile-setup' },
    { icon: <Users size={20} />, label: 'Students/Batches', path: '/mentor/students' },
    { icon: <Calendar size={20} />, label: 'Attendance', path: '/mentor/attendance' },
    { icon: <BookOpen size={20} />, label: 'Classroom', path: '/mentor/classroom' },
    { icon: <FileText size={20} />, label: 'Exams', path: '/mentor/exams' },
    // { icon: <FileText size={20} />, label: 'Study Materials', path: '/mentor/materials' },
    // { icon: <ClipboardList size={20} />, label: 'Assignments', path: '/mentor/assignments' },
    { icon: <ClipboardList size={20} />, label: 'Class History', path: '/mentor/class-history' },
    // { icon: <Bell size={20} />, label: 'Notifications', path: '/mentor/notifications' },
    { icon: <Clock size={20} />, label: 'Availability', path: '/mentor/availability' },
    // { icon: <MessageSquare size={20} />, label: 'Chats', path: '/mentor/chats' },
  ];

  const dashboardUser = {
      name: profile?.fullName || user?.fullName || "Mentor",
      email: user?.email || "",
      avatar: profile?.profileImageUrl || (user?.profilePicture?.startsWith('http') ? user.profilePicture : undefined),
      role: "mentor"
  };

  // 1. Filter Approved Trial Classes
  const approvedTrialClasses = (trialClasses || []).filter(cls => cls.status === 'approved');
  
  // 2. Map Trial Classes to Student format
  const trialStudents: Student[] = approvedTrialClasses.map(cls => ({
    id: cls.id || cls._id || '',
    name: cls.student?.fullName || "Student (Trial)",
    time: cls.preferredTime, // Trial has preferredTime
    color: 'bg-green-100',
    meetLink: cls.meetLink,
    status: cls.status
  }));

  // 3. Map Premium Courses to Student format
  const premiumStudents: Student[] = (courses || []).map((course) => ({
    id: course._id || '',
    name: course.student?.fullName || "Premium Student",
    time: course.schedule ? `${course.schedule.timeSlot} (${course.schedule.days?.join(', ')})` : "Scheduled",
    color: 'bg-indigo-100',
    avatar: course.student?.profileImageUrl || course.student?.profilePicture || null,
    meetLink: undefined,
    status: course.status
  }));

  // 4. Combine Lists
  const students: Student[] = [...trialStudents, ...premiumStudents];

  // For the "Today's Sessions/Upcoming Classes" view (assignedClasses), we might want to blend them too
  // The original code used 'assignedClasses' for the main list. 
  // We can treat 'courses' as classes too or keep them separate.
  // Given the UI layout, blending them into 'students' list handles the "Assigned Students" sidebar and main list.
  // But the "Trial Class Notification" block (assignedClasses.map...) is specific to Trial Classes notifications.
  // We'll keep 'assignedClasses' as just trial classes for the notification block to avoid breaking that UI logic.
  const assignedClasses = approvedTrialClasses; 

  const assignments: Assignment[] = [];

  const assignmentColumns: TableColumn<Assignment>[] = [
    { header: 'Subject', accessor: (item) => <div><div className="font-semibold">{item.subject}</div><div className="text-sm text-gray-500">{item.class}</div></div> },
    { header: 'Task', accessor: (item) => <div><div className="font-medium">{item.task}</div><div className="text-sm text-gray-500">{item.page}</div></div> },
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Status', 
      accessor: renderAssignmentStatus
    },
  ];

  const activities: Activity[] = [];

  const handleStartClass = (id: string) => {
    if (id) {
         navigate(`/trial-class/${id}/call`);
    }
  };

  const handleMarkAsComplete = async (trialId: string) => {
    try {
        await dispatch(updateTrialClassStatus({ id: trialId, status: 'completed' })).unwrap();
        toast.success("Trial class marked as completed!");
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update status";
        toast.error(message);
    }
  };

  const AssignedStudentsSidebar = (
    <div className="px-4 py-2">
      <h3 className="text-xs font-semibold text-cyan-200/60 uppercase tracking-wider mb-3 px-2">
        Assigned Students
      </h3>
      <div className="space-y-1">
        {students.length === 0 ? (
          <p className="text-xs text-cyan-100/40 px-2 italic">No students assigned</p>
        ) : (
          students.slice(0, 5).map((student) => (
            <div 
              key={student.id} 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
              onClick={() => navigate(`/mentor/students`)}
            >
              <div className="relative flex-shrink-0">
                {student.avatar ? (
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-8 h-8 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-white/10 bg-teal-800 flex items-center justify-center text-[10px] font-bold text-teal-100 uppercase">
                    {student.name.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-teal-700 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-cyan-50 truncate group-hover:text-white transition-colors">
                  {student.name}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-cyan-200/60 truncate">
                  <Clock size={10} />
                  {student.time}
                </div>
              </div>
            </div>
          ))
        )}
        {students.length > 5 && (
            <button 
                onClick={() => navigate(ROUTES.MENTOR.STUDENTS)}
                className="text-[10px] text-cyan-300 hover:text-white px-2 mt-1 transition-colors"
            >
                View all students...
            </button>
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <>
      <MentorSidebarProfile 
        profile={profile ? {
          fullName: profile.fullName,
          email: profile.email,
          profileImageUrl: profile.profileImageUrl as string,
          bio: profile.bio
        } : null} 
      />
      {AssignedStudentsSidebar}
    </>
  );

  // ...
  
  const handleJoinSession = (session: Session) => {
      if (session.meetingLink && (session.meetingLink.startsWith('http') || session.meetingLink.startsWith('https'))) {
          window.open(session.meetingLink, '_blank');
          // Navigate to internal classroom
          const sessionId = session.id || (session as unknown as { _id: string })._id;
          window.open(`/session/${sessionId}/call`, '_blank');
      }
  };

  return (
    <DashboardLayout
      navItems={mentorNavItems}
      user={dashboardUser}
      title="Mentor Dashboard"
      onLogout={handleLogout}
      appTitle="Aptus"
      extraContent={sidebarContent}
    >
      <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trial Class Notification */}
              {assignedClasses.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Video className="w-24 h-24 text-indigo-600" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                          <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                          </span>
                          Trial Class Assigned!
                        </h2>
                        <p className="text-indigo-700 mt-1">
                          You have {assignedClasses.length} upcoming trial class{assignedClasses.length > 1 ? 'es' : ''}.
                        </p>
                      </div>
                    </div>

                    {assignedClasses.map((cls) => (
                      <div key={cls.id || cls._id} className="bg-white/60 rounded-lg p-4 mb-3 last:mb-0 backdrop-blur-sm border border-indigo-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-indigo-900">{cls.subject?.subjectName} with {cls.student?.fullName || 'Student'}</p>
                            <div className="flex items-center gap-4 text-sm text-indigo-700 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(cls.preferredDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {cls.preferredTime}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setShowNotificationDetails(!showNotificationDetails)}
                              className="px-4 py-2 text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg text-sm font-medium border border-indigo-200 transition-colors"
                            >
                              {showNotificationDetails ? 'Hide Details' : 'View Details'}
                            </button>
                            
                            {/* Mark Complete Button for Overdue */}
                            {isClassOverdue(cls.preferredDate, cls.preferredTime) && (
                                <button 
                                    onClick={() => handleMarkAsComplete(cls.id || cls._id || '')}
                                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 border border-green-200 transition-colors"
                                >
                                    Mark Complete
                                </button>
                            )}

                            <button 
                              onClick={() => handleStartClass(cls.id || cls._id || '')}
                              className={`px-4 py-2 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors ${isClassOverdue(cls.preferredDate, cls.preferredTime) ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                              <Video className="w-4 h-4" />
                              {isClassOverdue(cls.preferredDate, cls.preferredTime) ? 'Overdue - Join' : 'Join Class'}
                            </button>
                          </div>
                        </div>

                        {showNotificationDetails && (
                          <div className="mt-4 pt-4 border-t border-indigo-100 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 mb-1">Student Details</p>
                                <p className="font-medium text-gray-900">{cls.student?.fullName || 'N/A'}</p>
                                <p className="text-gray-600">{cls.student?.email || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Class Details</p>
                                <p className="font-medium text-gray-900">{cls.subject?.subjectName} - {cls.subject?.syllabus || 'N/A'}</p>
                                <p className="text-gray-600">Grade {cls.subject?.grade || 'N/A'}</p>
                              </div>
                              {cls.notes && (
                                <div className="md:col-span-2">
                                  <p className="text-gray-500 mb-1">Notes</p>
                                  <p className="text-gray-700 bg-white p-3 rounded-md border border-indigo-100">
                                    {cls.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcement */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-2">Announcement</h2>
                <p className="text-sm text-gray-700">
                  You're doing great! Keep up the fantastic work with your students. Your dedication is truly making a difference in their learning journey.
                </p>
              </div>

              {/* Assigned Students and Sessions */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Assigned Students */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Assigned Students</h3>
                  <div className="space-y-3">
                    {loading ? (
                        <Loader size="md" text="Loading students..." />
                    ) : students.length === 0 ? (
                        <EmptyState 
                          icon={Users} 
                          title="No assigned students" 
                          description="Your assigned students will appear here." 
                        />
                    ) : (
                        students.map((student) => (
                        <div key={student.id} className={`${student.color} rounded-lg p-4 flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                            {student.avatar ? (
                              <img
                                  src={student.avatar}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold uppercase">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            <div>
                                <p className="font-semibold text-sm">{student.name}</p>
                                <p className="text-xs text-gray-600">{student.time}</p>
                            </div>
                            </div>
                            <MessageSquare className="w-5 h-5 text-gray-600 cursor-pointer" />
                        </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Today & Upcoming Sessions */}
                <div className="bg-white rounded-lg p-6 shadow-sm min-h-[300px] flex flex-col border border-indigo-50">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                    <span>Today's Live Sessions</span>
                    {todaySessions.length > 0 && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase tracking-wider">Active</span>
                    )}
                  </h3>
                  
                  {sessionsLoading ? (
                      <Loader size="md" text="Loading today's sessions..." />
                  ) : todaySessions.length > 0 ? (
                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {todaySessions.map((session) => (
                              <div key={session.id || (session as unknown as { _id: string })._id} className="relative pl-6 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                {/* Purple indicator line */}
                                <div className="absolute left-0 top-0 bottom-6 w-1 bg-indigo-500 rounded-full"></div>
                                
                                <div className="space-y-2">
                                  {/* Date & Time */}
                                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                    <Clock size={14} />
                                    <span>
                                      Today @ {" "}
                                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  
                                  {/* Student Name */}
                                  <h4 className="text-lg font-bold text-gray-900">
                                    Student: {session.studentId && typeof session.studentId === 'object' ? (session.studentId as { fullName?: string }).fullName || 'Student' : 'Student'}
                                  </h4>
                                  
                                  {/* Subject & Type */}
                                  <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                                    <span>Subject: {session.subjectId && typeof session.subjectId === 'object' ? (session.subjectId as { subjectName?: string; name?: string }).subjectName || (session.subjectId as { subjectName?: string; name?: string }).name : 'Subject'}</span>
                                    {(session as { type?: string }).type === 'trial' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-600 uppercase tracking-wider">
                                            Trial
                                        </span>
                                    )}
                                  </p>
                                  
                                  {/* Action Buttons */}
                                  <div className="pt-2 flex items-center">
                                    <button 
                                      disabled={session.status === 'cancelled'}
                                      onClick={() => handleJoinSession(session)}
                                      className={`px-10 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 shadow-lg ${
                                        session.status === 'cancelled' 
                                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                      }`}
                                    >
                                      {session.status === 'cancelled' ? 'Cancelled' : 'Enter Classroom'}
                                      {session.status !== 'cancelled' && <Video size={14} className="inline ml-2" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                  ) : (
                    <EmptyState 
                      icon={Calendar} 
                      title="No sessions scheduled" 
                      description="Your upcoming sessions will appear here." 
                    />
                  )}
                </div>
              </div>

              {/* Assignments Table */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Assignments</h3>
                <Table data={assignments} columns={assignmentColumns} />
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Calendar */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'].map((day, i) => (
                    <div key={day}>
                      <div className="text-xs text-gray-500 mb-1">{day}</div>
                      <div className="text-sm py-1 font-bold">{i + 3}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Schedule</h3>
                  <button onClick={() => navigate('/mentor/classroom')} className="text-sm text-blue-600 hover:underline">See all</button>
                </div>
                
                <div className="space-y-4">
                  {todaySessions.slice(0, 5).map((session, idx) => (
                      <div key={session.id || idx}>
                        <div className="space-y-3">
                        <div className="flex gap-3">
                            <Video className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                            <div>
                            <p className="text-sm font-medium">
                                {session.studentId && typeof session.studentId === 'object' ? (session.studentId as { fullName?: string }).fullName || 'Student' : 'Student'}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase">
                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            </div>
                        </div>
                        </div>
                    </div>
                  ))}
                  {todaySessions.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No sessions for today.</p>
                  )}
                </div>
              </div>


              {/* Recent Activities */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'session' && <Calendar className="w-5 h-5 text-gray-400" />}
                        {activity.type === 'upload' && <FileText className="w-5 h-5 text-gray-400" />}
                        {activity.type === 'schedule' && <Calendar className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div>
                        <p className="text-sm">{activity.text}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default MentorDashboard;
