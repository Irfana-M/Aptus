import React, { useState, useEffect } from 'react';
import { MentorLayout } from '../../components/mentor/MentorLayout';
import { BookOpen, Video, Clock, Calendar, ExternalLink, XCircle } from 'lucide-react';
import { mentorApi } from '../../features/mentor/mentorApi';
import { getMentorUpcomingSessions } from '../../api/userApi';
import { sessionApi } from '../../features/session/sessionApi';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';

interface Course {
    _id: string;
    student?: {
        fullName: string;
    };
    subject?: {
        subjectName: string;
        grade: string;
    };
    status: string;
}

interface Session {
    _id: string;
    id?: string;
    studentId: {
        fullName: string;
    } | string;
    subjectId: {
        subjectName: string;
    } | string;
    startTime: string;
    endTime: string;
    status: string;
    meetingLink?: string;
}

const MentorClassroom: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, sessionsRes] = await Promise.all([
        mentorApi.getMentorCourses(),
        getMentorUpcomingSessions()
      ]);
      setCourses(coursesRes || []);
      setSessions(sessionsRes.data || []);
    } catch (error) {
      console.error("Failed to load classroom data", error);
      toast.error("Failed to load your classrooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelSession = async (sessionId: string) => {
    const reason = window.prompt("Reason for cancellation (will be shared with student):");
    if (reason === null) return;

    if (!reason.trim()) {
        toast.error("Please provide a reason for cancellation");
        return;
    }

    try {
        await sessionApi.cancelSession(sessionId, reason);
        toast.success("Session cancelled successfully");
        loadData();
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || "Failed to cancel session");
    }
  };

  const handleJoinSession = (session: Session) => {
    const meetLink = session.meetingLink;
    if (meetLink) {
        window.open(meetLink, '_blank');
    } else {
        // Fallback or internal call
        const id = session.id || session._id;
        window.open(`/session/${id}/call`, '_blank');
    }
  };

  return (
    <MentorLayout title="Classroom">
      {/* Active Courses / Batches */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-8">
        <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">My Active Courses</h2>
        
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-50 rounded-2xl animate-pulse" />)}
             </div>
        ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course._id} className="border border-slate-100 bg-slate-50 rounded-2xl p-6 hover:border-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-50 group">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="font-black text-lg text-slate-900 leading-tight">
                            {course.subject?.subjectName || 'Course'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 font-bold">
                            Grade {course.subject?.grade || 'N/A'} • Student: {course.student?.fullName || 'Assigned'}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${course.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                {course.status}
                            </span>
                            <button className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:text-indigo-800 transition-colors">
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                    <BookOpen size={32} />
                </div>
                <p className="text-slate-900 font-bold text-lg">No active courses</p>
                <p className="text-slate-500 mt-1">Classrooms will appear here when you are assigned students.</p>
            </div>
        )}
      </div>

      {/* Upcoming Live Sessions */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Upcoming Live Sessions</h2>
        
        {loading ? (
            <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)}
            </div>
        ) : sessions.length > 0 ? (
            <div className="space-y-4">
                {sessions.map(session => (
                    <div key={session._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                                <Video size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">
                                    {typeof session.subjectId === 'object' ? session.subjectId.subjectName : 'Session'}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                    <span className="flex items-center gap-1 font-bold"><Clock size={12} /> {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="flex items-center gap-1 font-bold"><Calendar size={12} /> {new Date(session.startTime).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[10px] text-indigo-600 font-black mt-1 uppercase tracking-widest">
                                    Student: {typeof session.studentId === 'object' ? session.studentId.fullName : 'Populated via API'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button 
                                onClick={() => handleJoinSession(session)}
                                disabled={session.status === 'cancelled'}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${session.status !== 'cancelled' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}
                            >
                                {session.status === 'cancelled' ? 'Cancelled' : 'Enter Classroom'}
                                {session.status !== 'cancelled' && <ExternalLink size={14} className="ml-1" />}
                            </Button>
                            
                            {session.status !== 'cancelled' && (
                                <button 
                                    onClick={() => handleCancelSession(session._id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                                    title="Cancel Session"
                                >
                                    <XCircle size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Cancel</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm">
                    <Video size={32} />
                </div>
                <p className="text-slate-900 font-bold text-lg">No live sessions scheduled</p>
                <p className="text-slate-500 mt-1">Your upcoming sessions will appear here.</p>
            </div>
        )}
      </div>
    </MentorLayout>
  );
};

export default MentorClassroom;
