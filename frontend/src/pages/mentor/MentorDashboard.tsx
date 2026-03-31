import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import { Users, Calendar, FileText, ChevronRight, Video, Clock } from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { MentorLayout } from '../../components/mentor/MentorLayout';
import { Table, type TableColumn } from '../../components/mentor/Table';
import { fetchMentorTrialClasses, fetchMentorProfile, updateTrialClassStatus, fetchMentorCourses, fetchMentorAssignments, fetchMentorDashboardData } from "../../features/mentor/mentorThunk";
import { fetchMentorUpcomingSessions, cancelSession } from "../../features/session/sessionThunk";
import type { AppDispatch, RootState } from "../../app/store";
import { isClassOverdue } from '../../utils/timeUtils';
import { toast } from 'react-hot-toast';
import { format, addHours, isAfter } from 'date-fns';
import { ReportAbsenceModal } from '../../components/shared/ReportAbsenceModal';
import { isSessionJoinable } from '../../utils/timeUtils';
import { useState } from 'react';

interface Assignment {
  _id: string;
  title: string;
  subjectName?: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'reviewed';
  studentName?: string;
}

// Helper function definitions
const renderAssignmentStatus = (item: Assignment) => {
    const statusColor = item.status === 'reviewed' 
      ? 'bg-green-100 text-green-700' 
      : item.status === 'submitted'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-orange-100 text-orange-700';

    return (
        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${statusColor}`}>
          {item.status}
        </span>
    );
};

const MentorDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { trialClasses, courses, assignments, loading, profile } = useSelector((state: RootState) => state.mentor);
  const { sessions, loading: sessionLoading } = useSelector((state: RootState) => state.session);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedCancelSessionId, setSelectedCancelSessionId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchMentorDashboardData());
    dispatch(fetchMentorTrialClasses());
    dispatch(fetchMentorCourses());
    dispatch(fetchMentorAssignments());
    dispatch(fetchMentorUpcomingSessions());
    if (!profile) {
      dispatch(fetchMentorProfile());
    }
  }, [dispatch, profile]);

  const dashboardStats = useSelector((state: RootState) => state.mentor.dashboardData?.stats);
  const activities = useSelector((state: RootState) => state.mentor.dashboardData?.recentActivities || []);
  const dashboardLoading = useSelector((state: RootState) => state.mentor.dashboardLoading);

  const stats = [
    { label: 'Regular Students', value: (dashboardStats?.assignedStudents ?? courses.length).toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Trials', value: (dashboardStats?.upcomingToday ?? trialClasses.filter(tc => tc.status === 'assigned').length).toString(), icon: Video, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Assignments', value: (dashboardStats?.pendingAssignments ?? assignments.length).toString(), icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed Trials', value: (dashboardStats?.completed ?? trialClasses.filter(tc => tc.status === 'completed').length).toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const handleUpdateTrialStatus = async (id: string, status: string) => {
    try {
        await dispatch(updateTrialClassStatus({ id, status })).unwrap();
        toast.success(`Class marked as ${status}`);
    } catch (error) {
        toast.error('Failed to update status');
    }
  };

  const handleJoinTrial = (meetLink: string) => {
     if (meetLink) {
         window.open(meetLink, '_blank');
     } else {
         toast.error('No meeting link available');
     }
  };
  const handleCancelSession = (sessionId: string) => {
    if (sessionId) {
        setSelectedCancelSessionId(sessionId);
        setIsCancelModalOpen(true);
    }
  };

  const onCancelSubmit = async (reason: string) => {
    if (selectedCancelSessionId) {
        try {
            await dispatch(cancelSession({ sessionId: selectedCancelSessionId, reason })).unwrap();
            setIsCancelModalOpen(false);
            setSelectedCancelSessionId(null);
            toast.success('Session cancelled successfully');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to cancel session');
        }
    }
  };

  const upcomingTrials = trialClasses
    .filter(tc => tc.status === 'assigned')
    .sort((a, b) => new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime());


  const assignmentColumns: TableColumn<Assignment>[] = [
    { header: 'Title', accessor: 'title' },
    { header: 'Student', accessor: 'studentName' },
    { 
      header: 'Due Date', 
      accessor: (item) => new Date(item.dueDate).toLocaleDateString() 
    },
    { 
      header: 'Status', 
      accessor: (item) => renderAssignmentStatus(item) 
    }
  ];

  return (
    <MentorLayout title="Mentor Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:scale-[1.02] transition-all duration-300"
            >
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Today's Trial Classes */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Pending Trials</h2>
                  <p className="text-slate-500 text-sm mt-1">Review and manage trial sessions</p>
                </div>
              </div>
              
              <div className="p-2">
                {loading ? (
                  <div className="py-12"><Loader size="md" /></div>
                ) : upcomingTrials.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                    {upcomingTrials.map((trial) => {
                      const isOverdue = isClassOverdue(trial.preferredDate, trial.preferredTime);
                      const studentName = trial.student?.fullName || 'Student';
                      return (
                        <div key={trial._id} className="group bg-slate-50 rounded-2xl p-6 border-2 border-transparent hover:border-teal-500 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-black">
                                {studentName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900">{studentName}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded uppercase">
                                        {trial.subject?.subjectName}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {trial.subject?.grade}
                                    </span>
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-green-50 text-green-600'}`}>
                              {isOverdue ? 'Overdue' : 'Upcoming'}
                            </span>
                          </div>

                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar size={16} className="text-slate-400" />
                              <span className="text-sm font-bold">{new Date(trial.preferredDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock size={16} className="text-slate-400" />
                              <span className="text-sm font-bold">{trial.preferredTime}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button 
                                onClick={() => handleJoinTrial(trial.meetLink || '')}
                                disabled={!trial.meetLink || !isSessionJoinable(new Date(new Date(trial.preferredDate).setHours(parseInt(normalizeTo24h(trial.preferredTime).split(':')[0]), parseInt(normalizeTo24h(trial.preferredTime).split(':')[1]))))}
                                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                <Video size={18} /> {isSessionJoinable(new Date(new Date(trial.preferredDate).setHours(parseInt(normalizeTo24h(trial.preferredTime).split(':')[0]), parseInt(normalizeTo24h(trial.preferredTime).split(':')[1])))) ? 'Join' : 'Waiting'}
                            </button>
                            <button 
                                onClick={() => handleUpdateTrialStatus(trial.id || '', 'completed')}
                                className="flex-1 bg-white border-2 border-slate-100 text-slate-900 py-3 rounded-xl font-bold hover:border-teal-500 hover:text-teal-600 transition-all"
                            >
                                Done
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8">
                    <EmptyState 
                      title="No Trials Assigned" 
                      description="You don't have any pending trial classes at the moment."
                      icon={Video}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Assignments Table */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Recent Assignments</h2>
                  <p className="text-slate-500 text-sm mt-1">Students latest submissions</p>
                </div>
                <button className="text-indigo-600 font-bold hover:underline" onClick={() => navigate(ROUTES.MENTOR.STUDY_MATERIALS)}>
                    View All
                </button>
              </div>
              <div className="p-4">
                  {assignments.length > 0 ? (
                      <Table 
                        data={assignments.slice(0, 5).map(a => ({
                            ...a,
                            studentName: a.studentName || 'Student Name'
                        }))} 
                        columns={assignmentColumns} 
                      />
                  ) : (
                      <div className="p-8">
                        <EmptyState 
                          title="No Assignments" 
                          description="No assignments have been created yet."
                          icon={FileText}
                        />
                      </div>
                  )}
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            
            {/* Upcoming Regular Sessions */}
            <section className="bg-slate-900 text-white rounded-[2.5rem] shadow-xl overflow-hidden p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Calendar className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl">Regular Sessions</h3>
                        <p className="text-slate-400 text-sm font-medium">Your upcoming classes</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {sessionLoading ? (
                        <div className="py-4 flex justify-center"><Loader size="sm" /></div>
                    ) : sessions.length > 0 ? sessions.slice(0, 5).map((session) => {
                        const canCancel = isAfter(new Date(session.startTime), addHours(new Date(), 48)) && session.status === 'scheduled';
                        const isCancelled = session.status === 'cancelled';
                        const studentName = (session.studentId as any)?.fullName || 'Student';

                        return (
                            <div key={session.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-colors ${
                                isCancelled ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                                        isCancelled ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'
                                    }`}>
                                        {studentName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">{studentName}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                            {format(new Date(session.startTime), 'MMM do, p')}
                                        </p>
                                        <p className={`text-[10px] font-bold ${isCancelled ? 'text-red-400' : 'text-slate-500'}`}>
                                            {session.status.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canCancel && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancelSession(session.id || (session as any)._id);
                                            }}
                                            className="text-[10px] font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/10 transition-colors"
                                        >
                                            CANCEL
                                        </button>
                                    )}
                                    <span className="text-indigo-400"><ChevronRight size={18} /></span>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-slate-500 text-sm font-medium py-4 text-center">No regular sessions scheduled.</p>
                    )}
                </div>

                <button 
                    onClick={() => navigate(ROUTES.MENTOR.STUDENTS)}
                    className="w-full mt-8 bg-white text-slate-900 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                >
                    Management Hub <ChevronRight size={18} />
                </button>
            </section>

            {/* Teaching Activity Feed */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-indigo-500" />
                    Activity
                </h3>
                <div className="space-y-6">
                    {dashboardLoading ? (
                        <Loader size="sm" />
                    ) : activities.length > 0 ? (
                        activities.map((activity, idx) => (
                            <div key={idx} className="flex gap-4 group">
                                <div className="relative">
                                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                                        activity.type === 'session' ? 'bg-teal-500' :
                                        activity.type === 'upload' ? 'bg-amber-500' : 'bg-blue-500'
                                    } shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                                    {idx !== activities.length - 1 && (
                                        <div className="absolute top-4 left-[5px] w-[2px] h-full bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{activity.title}</p>
                                    {activity.subtitle && <p className="text-[10px] text-slate-400 font-medium mb-1">{activity.subtitle}</p>}
                                    <p className="text-xs text-slate-400 font-medium">{activity.time}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-sm font-medium">No recent activity.</p>
                    )}
                </div>
            </section>
          </div>
        </div>
      </div>
      <ReportAbsenceModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSubmit={onCancelSubmit}
        title="Cancel Regular Session"
        description="Are you sure you want to cancel this session? This will notify the student and release the slot."
        isLoading={sessionLoading}
      />
    </MentorLayout>
  );
};

export default MentorDashboard;
