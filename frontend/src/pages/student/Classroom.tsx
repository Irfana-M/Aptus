import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import { BookOpen, Video, Clock, Calendar, ExternalLink, X } from 'lucide-react';
import { sessionApi } from '../../features/session/sessionApi';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { fetchStudentTrialClasses } from '../../features/trial/student/studentTrialThunk';
import { fetchUpcomingSessions, studentApi, type DayAvailability } from "../../features/student/studentApi";
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';
import { ReportAbsenceModal } from '../../components/common/ReportAbsenceModal';

interface Session {
    _id: string;
    subjectId: {
        _id: string;
        subjectName: string;
    };
    mentorId: {
        _id: string;
        fullName: string;
    };
    startTime: string;
    endTime: string;
    status: string;
}

interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: Session;
    onResolved: () => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, session, onResolved }) => {
    const [availability, setAvailability] = useState<DayAvailability[]>([]);
    const [loading, setLoading] = useState(false);
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        if (isOpen && session.mentorId._id) {
            const loadAvailability = async () => {
                try {
                    setLoading(true);
                    const response = await studentApi.getMentorAvailableSlots(session.mentorId._id);
                    setAvailability(response.data || []);
                } catch {
                    toast.error("Failed to load mentor availability");
                } finally {
                    setLoading(false);
                }
            };
            loadAvailability();
        }
    }, [isOpen, session.mentorId._id]);

    const handleConfirm = async (newTimeSlotId?: string, slotDetails?: { date: string, startTime: string, endTime: string }) => {
        try {
            setResolving(true);
            await sessionApi.resolveRescheduling(session._id, newTimeSlotId, slotDetails);
            toast.success("Session rescheduled!");
            onResolved();
            onClose();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Action failed";
            toast.error(errorMessage);
        } finally {
            setResolving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Reschedule Needed</h2>
                        <p className="text-slate-500 text-sm mt-1">Your mentor reported absence for {session.subjectId?.subjectName}.</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Choose a new time slot from your mentor's schedule</p>
                    
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-3" />
                            <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">Checking mentor slots...</p>
                        </div>
                    ) : availability.some(d => d.slots?.some(s => s.remainingCapacity > 0)) ? (
                        <div className="space-y-6">
                            {availability.map((day) => (
                                <div key={day.day}>
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 ml-1">{day.day}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {day.slots.map((slot, idx: number) => (
                                            <button 
                                                key={idx}
                                                onClick={() => handleConfirm(slot._id, !slot._id ? { date: day.date, startTime: slot.startTime, endTime: slot.endTime } : undefined)}
                                                disabled={resolving}
                                                className={`p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group`}
                                            >
                                                <Clock size={12} className="text-slate-400 group-hover:text-indigo-600" />
                                                {slot.startTime} - {slot.endTime}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-rose-50 rounded-2xl border border-rose-100 italic">
                            <p className="text-rose-600 font-bold text-sm">No other slots available for this mentor currently.</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-bold text-slate-900">Cant find a suitable time?</p>
                        <p className="text-[11px] text-slate-500">You can opt for a full refund instead.</p>
                    </div>
                    <Button 
                        variant="ghost" 
                        disabled={resolving}
                        onClick={() => handleConfirm()}
                        className="bg-rose-100 hover:bg-rose-200 text-rose-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-rose-200"
                    >
                        Request Instant Refund
                    </Button>
                </div>
            </div>
        </div>
    );
};

const StudentClassroom: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRescheduleSession, setSelectedRescheduleSession] = useState<Session | null>(null);

  // Modal State
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSubmittingAbsence, setIsSubmittingAbsence] = useState(false);

  const { trialClasses } = useSelector((state: RootState) => state.studentTrial);

  const loadSessions = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchUpcomingSessions();
      console.log("Upcoming Sessions Response:", response); // DEBUG LOG
      setSessions(response.data || []);
      // Refresh trial classes too
      dispatch(fetchStudentTrialClasses());
    } catch {
      console.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleReportAbsenceClick = (sessionId: string) => {
      setSelectedSessionId(sessionId);
      setIsAbsenceModalOpen(true);
  };

  const handleSubmitAbsence = async (reason: string) => {
    if (!selectedSessionId) return;
    
    try {
        setIsSubmittingAbsence(true);
        await sessionApi.reportAbsence(selectedSessionId, reason);
        toast.success("Absence reported successfully");
        setIsAbsenceModalOpen(false);
        loadSessions(); // Refresh list
    } catch {
        toast.error("Failed to report absence");
    } finally {
        setIsSubmittingAbsence(false);
    }
  };


  const isJoinable = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffInMinutes = (start.getTime() - now.getTime()) / (1000 * 60);
    // Relaxed: Joinable if it starts in 60 mins or already started
    return diffInMinutes <= 60 && diffInMinutes >= -120;
  };

  return (
    <StudentLayout title="Classroom">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">Your Virtual Classroom</h1>
            <p className="text-indigo-100 max-w-lg">Access your live classes, recordings, and interactive whiteboard sessions here.</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
            <BookOpen size={200} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 font-black tracking-tight uppercase">Upcoming Live Classes</h2>
             
             {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)}
                </div>
             ) : sessions.length > 0 ? (
                <div className="space-y-4">
                  {[
                    ...sessions.map(s => ({ ...s, type: 'regular' as const })),
                    ...trialClasses
                      .filter(t => t.status === 'assigned' || t.status === 'requested')
                      .map(t => {
                        // Better startTime construction
                        let startTimeStr = '';
                        if (t.preferredDate) {
                          const datePart = t.preferredDate.split('T')[0];
                          if (t.preferredTime) {
                            startTimeStr = `${datePart}T${t.preferredTime}:00`;
                          } else {
                            startTimeStr = `${datePart}T00:00:00`;
                          }
                        }

                        return {
                          _id: t.id,
                          subjectId: t.subject,
                          mentorId: t.mentor ? { ...t.mentor, fullName: t.mentor.name } : null,
                          startTime: startTimeStr,
                          preferredTime: t.preferredTime,
                          endTime: '',
                          status: t.status,
                          type: 'trial' as const
                        };
                      })
                  ]
                  .filter(item => item.startTime) // Ensure we have a date
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map(item => (
                    <div 
                      key={item._id} 
                      className={`p-5 rounded-2xl border flex items-center justify-between hover:border-indigo-200 transition-colors ${
                        item.status === 'rescheduling' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                          item.status === 'rescheduling' ? 'bg-amber-100 text-amber-600' : 'bg-white text-indigo-600'
                        }`}>
                          <Video size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">
                                {item.type === 'trial' ? 'Trial: ' : ''}
                                {(item.subjectId as unknown as { subjectName: string })?.subjectName || String(item.subjectId) || 'Class'}
                             </h3>
                             {item.status === 'rescheduling' && (
                                <span className="bg-amber-200 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">Reschedule Requested</span>
                             )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Clock size={12} /> 
                                {item.type === 'trial' ? (item as unknown as { preferredTime: string }).preferredTime : new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={12} /> 
                                {new Date(item.startTime).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase tracking-wider">
                            {item.status === 'requested' ? '⏳ Pending Mentor Assignment' : `Mentor: ${(item.mentorId as unknown as { fullName: string })?.fullName || 'Assigned'}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {item.status === 'rescheduling' ? (
                            <Button 
                              onClick={() => setSelectedRescheduleSession(item as unknown as Session)}
                              className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200"
                            >
                                Resolve Now
                            </Button>
                        ) : (
                            <Button 
                              disabled={!isJoinable(item.startTime) || item.status === 'cancelled' || item.status === 'requested'}
                              onClick={() => window.open(item.type === 'trial' ? `/trial-class/${item._id}/call` : `/session/${item._id}/call`, '_blank')}
                              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${isJoinable(item.startTime) && item.status !== 'cancelled' && item.status !== 'requested' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}
                            >
                                {item.status === 'cancelled' ? 'Cancelled' : item.status === 'requested' ? 'Waiting...' : isJoinable(item.startTime) ? 'Join Now' : 'Join Soon'}
                                {isJoinable(item.startTime) && item.status !== 'cancelled' && item.status !== 'requested' && <ExternalLink size={14} className="ml-1" />}
                            </Button>
                        )}
                        
                        {item.type === 'regular' && item.status !== 'cancelled' && item.status !== 'rescheduling' && (
                          <button 
                            onClick={() => handleReportAbsenceClick(item._id)}
                            className="text-[11px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-wider transition-colors bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 mt-1 self-end"
                          >
                            Report Absence
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                        <Video size={32} />
                    </div>
                    <p className="text-slate-900 font-bold text-lg">No classes scheduled</p>
                    <p className="text-slate-500 mt-1">Your upcoming classes will appear here.</p>
                </div>
             )}
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
             <h2 className="text-xl font-bold text-slate-800 mb-6 font-black tracking-tight uppercase">Past Classes & Recordings</h2>
             <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">No recordings available yet.</p>
            </div>
        </div>
      </div>

      {selectedRescheduleSession && (
        <RescheduleModal 
            isOpen={!!selectedRescheduleSession} 
            onClose={() => setSelectedRescheduleSession(null)} 
            session={selectedRescheduleSession}
            onResolved={loadSessions}
        />
      )}
      <ReportAbsenceModal 
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        onSubmit={handleSubmitAbsence}
        isLoading={isSubmittingAbsence}
        title="Report Absence"
        description="Please check if you can reschedule instead. If not, providing a reason helps your mentor plan ahead."
      />
    </StudentLayout>
  );
};

export default StudentClassroom;
