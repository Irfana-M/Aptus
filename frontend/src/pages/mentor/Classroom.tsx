import React, { useState, useEffect } from 'react';
import { MentorLayout } from '../../components/mentor/MentorLayout';
import { BookOpen, Video, Clock, Calendar, ExternalLink, XCircle } from 'lucide-react';
import { mentorApi } from '../../features/mentor/mentorApi';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReportAbsenceModal } from '../../components/shared/ReportAbsenceModal';
import { isSessionJoinable } from '../../utils/timeUtils';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { cancelSession } from '../../features/session/sessionThunk';

interface Course {
    _id: string;
    courseType?: 'one-to-one' | 'group';
    batchName?: string;
    student?: {
        fullName: string;
        email?: string;
        profileImageUrl?: string;
    };
    students?: {
        fullName: string;
        email?: string;
        profileImageUrl?: string;
    }[];
    subject?: {
        subjectName: string;
        grade: string;
        syllabus?: string;
    };
    grade?: {
        name: string;
    };
    schedule?: {
        days: string[];
        timeSlot: string;
    };
    startDate: string;
    endDate: string;
    status: string;
}

const CourseDetailsModal: React.FC<{
    course: Course;
    onClose: () => void;
}> = ({ course, onClose }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-2xl text-slate-900">{course.subject?.subjectName || 'Course Details'}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded ${course.courseType === 'group' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {course.courseType === 'group' ? 'Group Batch' : 'One-to-One'}
                                </span>
                                • {course.grade?.name || `Grade ${course.subject?.grade}`}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Schedule Info */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Schedule & Timing</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Days</p>
                                            <p className="font-bold">{course.schedule?.days?.join(', ') || 'TBD'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Time Slot</p>
                                            <p className="font-bold">{course.schedule?.timeSlot || 'TBD'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-700">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Duration</p>
                                            <p className="font-bold">
                                                {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Students Info */}
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                Enrolled Students ({course.students?.length || (course.student ? 1 : 0)})
                            </h4>
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                {course.courseType === 'group' && course.students && course.students.length > 0 ? (
                                    course.students.map((student, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <img 
                                                src={student.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.fullName}`} 
                                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                                alt="" 
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{student.fullName}</p>
                                                <p className="text-[10px] text-slate-500">{student.email}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : course.student ? (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <img 
                                            src={course.student.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.student.fullName}`} 
                                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                            alt="" 
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{course.student.fullName}</p>
                                            <p className="text-[10px] text-slate-500">{course.student.email}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No students enrolled yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                    <Button 
                        onClick={onClose}
                        className="px-8 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs bg-slate-200 hover:bg-slate-300 text-slate-700"
                    >
                        Close Details
                    </Button>
                </div>
            </div>
        </div>
    );
};

interface Session {
    id: string;
    _id?: string;
    type: 'regular' | 'trial';
    subject: string;
    subjectName?: string; // Support for either mapping style
    studentName: string;
    startTime: string;
    endTime: string;
    status: string;
    meetingLink?: string;
    canApplyLeave: boolean;
}

const MentorClassroom: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const dispatch = useDispatch<AppDispatch>();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedCancelSessionId, setSelectedCancelSessionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, sessionsData] = await Promise.all([
        mentorApi.getMentorCourses(),
        mentorApi.getUpcomingSessions()
      ]);
      setCourses(coursesRes || []);
      setSessions(sessionsData?.sessions || []);
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

  const handleApplyLeaveForSession = (sessionId: string) => {
    setSelectedCancelSessionId(sessionId);
    setIsCancelModalOpen(true);
  };

  const onCancelSubmit = async (reason: string) => {
    if (selectedCancelSessionId) {
        try {
            setIsCancelling(true);
            await dispatch(cancelSession({ sessionId: selectedCancelSessionId, reason })).unwrap();
            setIsCancelModalOpen(false);
            setSelectedCancelSessionId(null);
            toast.success('Session cancelled successfully');
            loadData(); // Refresh list after cancellation
        } catch (error: any) {
            toast.error(error?.message || 'Failed to cancel session');
        } finally {
            setIsCancelling(false);
        }
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
             <Loader size="lg" text="Loading your courses..." />
        ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course._id} className="border border-slate-100 bg-slate-50 rounded-2xl p-6 hover:border-indigo-200 transition-all hover:shadow-lg hover:shadow-indigo-50 group">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                        </div>
                        <div className="flex justify-between items-start">
                           <div>
                            <h3 className="font-black text-lg text-slate-900 leading-tight">
                                {course.subject?.subjectName || 'Course'}
                            </h3>
                            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-0.5">
                                {course.courseType === 'group' ? 'Batch' : 'One-to-One'}
                            </p>
                           </div>
                        </div>
                        <p className="text-sm text-slate-500 mt-3 font-bold">
                            Grade {course.subject?.grade || 'N/A'} • Student: {course.student?.fullName || 'Assigned'}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${course.status === 'active' || course.status === 'booked' || course.status === 'ongoing' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                {course.status}
                            </span>
                            <button 
                                onClick={() => setSelectedCourse(course)}
                                className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:text-indigo-800 transition-colors"
                            >
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <EmptyState 
                icon={BookOpen} 
                title="No active courses" 
                description="Classrooms will appear here when you are assigned students." 
            />
        )}
      </div>

      {/* Upcoming Live Sessions */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="mb-8">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Upcoming Live Sessions</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">Next 7 days of scheduled classes</p>
        </div>
        
        {loading ? (
            <Loader size="md" text="Fetching upcoming sessions..." />
        ) : sessions.length > 0 ? (
            <div className="space-y-4">
                {sessions.map(session => (
                    <div key={session._id || (session as any).id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                                <Video size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">
                                    {session.subject}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                    <span className="flex items-center gap-1 font-bold"><Clock size={12} /> {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="flex items-center gap-1 font-bold"><Calendar size={12} /> {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <p className="text-[10px] text-indigo-600 font-black mt-1 uppercase tracking-widest">
                                    Student: {session.studentName}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Per-session Apply Leave button */}
                            <div className="relative group/leave">
                                <Button
                                    onClick={() => session.canApplyLeave && handleApplyLeaveForSession(session.id || session._id!)}
                                    disabled={!session.canApplyLeave}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        session.canApplyLeave
                                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                        : 'bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed'
                                    }`}
                                >
                                    Apply Leave
                                </Button>
                                {!session.canApplyLeave && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/leave:opacity-100 transition-opacity pointer-events-none text-center shadow-xl z-50">
                                        Leave requires at least 24h notice before session start.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
                                    </div>
                                )}
                            </div>

                            <div className="relative group/join">
                                <Button 
                                    onClick={() => handleJoinSession(session)}
                                    disabled={session.status === 'cancelled' || !isSessionJoinable(session.startTime)}
                                    className={`px-10 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        session.status === 'cancelled' 
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : !isSessionJoinable(session.startTime)
                                            ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-70'
                                            : 'bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 shadow-sm active:scale-95'
                                    }`}
                                >
                                    {session.status === 'cancelled' ? 'Cancelled' : 'Join Session'}
                                    {session.status !== 'cancelled' && isSessionJoinable(session.startTime) && <ExternalLink size={14} className="ml-1" />}
                                </Button>
                                
                                {session.status !== 'cancelled' && !isSessionJoinable(session.startTime) && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/join:opacity-100 transition-opacity pointer-events-none text-center shadow-xl z-50">
                                        Join link opens 60 mins before class starts.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <EmptyState 
                icon={Video} 
                title="No live sessions scheduled" 
                description="Your upcoming sessions will appear here." 
            />
        )}
      </div>
      {/* Selected Course Details Modal */}
      {selectedCourse && (
          <CourseDetailsModal 
            course={selectedCourse} 
            onClose={() => setSelectedCourse(null)} 
          />
      )}

      <ReportAbsenceModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSubmit={onCancelSubmit}
        title="Cancel Session"
        description="Provide a reason for cancellation. This will notify your student and release your slot capacity."
        isLoading={isCancelling}
      />
    </MentorLayout>
  );
};

export default MentorClassroom;
