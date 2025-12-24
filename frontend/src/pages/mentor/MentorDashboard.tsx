import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, FileText, ChevronLeft, ChevronRight, MessageSquare, Video, Clock, Home, User, BookOpen, ClipboardList, Bell } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import type { NavItem } from '../../components/layout/DashboardSidebar';
import { Table, type TableColumn } from '../../components/mentor/Table';
import { fetchMentorTrialClasses, fetchMentorProfile, updateTrialClassStatus } from "../../features/mentor/mentorThunk";
import { logoutUser } from "../../features/auth/authThunks";
import type { AppDispatch, RootState } from "../../app/store";
import { isClassOverdue } from '../../utils/timeUtils';
import { toast } from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  time: string;
  color: string;
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

// Main Dashboard Component
const MentorDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { trialClasses, loading, profile } = useSelector((state: RootState) => state.mentor);
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [currentDate] = useState(new Date());
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);

  useEffect(() => {
    dispatch(fetchMentorTrialClasses());
    if (!profile) {
        dispatch(fetchMentorProfile());
    }
  }, [dispatch, profile]);

  useEffect(() => {
    console.log("DEBUG MentorDashboard: All Trial Classes:", trialClasses);
    if (trialClasses && trialClasses.length > 0) {
        trialClasses.forEach((cls, idx) => {
            console.log(`Class ${idx}: ID=${cls.id}, Status=${cls.status}, Student=${cls.student?.fullName}`);
        });
    }
  }, [trialClasses]);

  useEffect(() => {
    if (profile) {
        console.log("DEBUG MentorDashboard: profile:", profile);
    }
  }, [profile]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const mentorNavItems: NavItem[] = [
    { icon: <Home size={20} />, label: 'Dashboard', path: '/mentor/dashboard' },
    { icon: <User size={20} />, label: 'Profile', path: '/mentor/profile' },
    { icon: <Users size={20} />, label: 'Students/Batches', path: '/mentor/students' },
    { icon: <Calendar size={20} />, label: 'Attendance', path: '/mentor/attendance' },
    { icon: <BookOpen size={20} />, label: 'Classroom', path: '/mentor/classroom' },
    { icon: <FileText size={20} />, label: 'Study Materials', path: '/mentor/materials' },
    { icon: <ClipboardList size={20} />, label: 'Assignments', path: '/mentor/assignments' },
    { icon: <ClipboardList size={20} />, label: 'Completed Classes', path: '/mentor/completed-trial-classes' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/mentor/notifications' },
    { icon: <Clock size={20} />, label: 'Availability', path: '/mentor/availability' },
    { icon: <MessageSquare size={20} />, label: 'Chats', path: '/mentor/chats' },
  ];

  const dashboardUser = {
      name: profile?.fullName || user?.fullName || "Mentor",
      email: user?.email || "",
      avatar: profile?.profileImageUrl || (user?.profilePicture?.startsWith('http') ? user.profilePicture : undefined),
      role: "mentor"
  };

  // Filter for assigned classes only
  const assignedClasses = (trialClasses || []).filter(cls => cls.status === 'assigned');

  // Map trial classes to Student format for display
  const students: Student[] = assignedClasses.map(cls => ({
    id: cls.id || cls._id || '',
    name: cls.student?.fullName || "Student",
    time: cls.preferredTime,
    color: 'bg-green-100', // You can make this dynamic if needed
    meetLink: cls.meetLink,
    status: cls.status
  }));

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

  return (
    <DashboardLayout
      navItems={mentorNavItems}
      user={dashboardUser}
      title="Mentor Dashboard"
      onLogout={handleLogout}
      appTitle="Aptus"
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
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        </div>
                    ) : students.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No assigned students yet.</p>
                    ) : (
                        students.map((student) => (
                        <div key={student.id} className={`${student.color} rounded-lg p-4 flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                                alt={student.name}
                                className="w-10 h-10 rounded-full"
                            />
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

                {/* Today's Sessions */}
                <div className="bg-white rounded-lg p-6 shadow-sm min-h-[300px] flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Today's Upcoming Sessions</h3>
                  
                  {loading ? (
                      <div className="flex justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      </div>
                  ) : assignedClasses.length > 0 ? (
                    // Filter for today's classes
                    (() => {
                      const todaysClasses = assignedClasses.filter(cls => {
                        const classDateStr = cls.preferredDate || cls.scheduledDateTime;
                        if (!classDateStr) return false;
                        const classDate = new Date(classDateStr);
                        const today = new Date();
                        return (
                          classDate.getDate() === today.getDate() &&
                          classDate.getMonth() === today.getMonth() &&
                          classDate.getFullYear() === today.getFullYear()
                        );
                      });

                      return todaysClasses.length > 0 ? (
                        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {todaysClasses.map((cls) => (
                              <div key={cls.id || cls._id} className="relative pl-6">
                                {/* Purple indicator line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-full"></div>
                                
                                <div className="space-y-2">
                                  {/* Time */}
                                  <p className="text-indigo-600 font-medium text-sm">
                                    {cls.preferredTime}
                                  </p>
                                  
                                  {/* Student Name */}
                                  <h4 className="text-lg font-bold text-gray-900">
                                    Student: {cls.student?.fullName || 'N/A'}
                                  </h4>
                                  
                                  {/* Subject */}
                                  <p className="text-slate-500 text-sm font-medium">
                                    Subject: {cls.subject?.subjectName || 'N/A'}
                                  </p>
                                  
                                  {/* Join Button */}
                                  <div className="pt-2">
                                    <button 
                                      onClick={() => handleStartClass(cls.id || cls._id || '')}
                                      className="px-6 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-sm font-semibold rounded-lg transition-colors duration-200"
                                    >
                                      Join Now
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                          No upcoming sessions scheduled for today
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                      No assigned students yet
                    </div>
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
                  {['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'].map((day, i) => (
                    <div key={day}>
                      <div className="text-xs text-gray-500 mb-1">{day}</div>
                      <div className="text-sm py-1">{i + 3}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Schedule</h3>
                  <button className="text-sm text-blue-600">See all</button>
                </div>
                
                <div className="space-y-4">
                  {/* Dynamic schedule based on assignments/classes */}
                  {students.slice(0, 3).map((student, idx) => (
                      <div key={student.id || idx}>
                        <h4 className="font-semibold text-sm mb-3">{idx === 0 ? "Today" : "Upcoming"}</h4>
                        <div className="space-y-3">
                        <div className="flex gap-3">
                            <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div>
                            <p className="text-sm font-medium">Session with {student.name}</p>
                            <p className="text-xs text-gray-500">{student.time}</p>
                            </div>
                        </div>
                        </div>
                    </div>
                  ))}
                  {students.length === 0 && (
                      <p className="text-sm text-gray-500">No upcoming schedule.</p>
                  )}
                </div>
              </div>

              {/* Requests */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Requests</h3>
                <p className="text-sm text-gray-600 mb-4">You have any request to admin</p>
                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Request to admin
                </button>
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
