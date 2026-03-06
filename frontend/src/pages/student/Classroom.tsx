import React, { useEffect, useState } from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import { BookOpen, Video, Clock, Calendar, ExternalLink, X } from 'lucide-react';
import { sessionApi } from '../../features/session/sessionApi';
import { Button } from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { fetchStudentTrialClasses } from '../../features/trial/student/studentTrialThunk';
import { studentApi } from '../../features/student/studentApi';
import type { DayAvailability } from '../../types/dto/student.dto';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { ReportAbsenceModal } from '../../components/shared/ReportAbsenceModal';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  sessionType?: 'group' | 'one-to-one';
  cancelledBy?: 'student' | 'mentor' | 'admin';
  participants?: { userId: string; role: string; status?: string }[];
}

interface SessionEligibility {
  id: string;
  session: Session;
  canRequestLeave: boolean;
  canRequestSlotChange: boolean;
}

interface LeaveEligibilityResponse {
  sessions: SessionEligibility[];
  leaveWindowOpen: boolean;
  slotChangeWindowOpen: boolean;
}

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onResolved: () => void;
}

// ─── RescheduleModal ───────────────────────────────────────────────────────────

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, session, onResolved }) => {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (isOpen && session?.mentorId?._id) {
      const loadAvailability = async () => {
        try {
          setLoading(true);
          const response = await studentApi.getMentorAvailableSlots(session.mentorId._id);
          setAvailability(response.data || []);
        } catch {
          toast.error('Failed to load mentor availability');
        } finally {
          setLoading(false);
        }
      };
      loadAvailability();
    }
  }, [isOpen, session?.mentorId?._id]);

  const handleConfirm = async (
    newTimeSlotId?: string,
    slotDetails?: { date: string; startTime: string; endTime: string }
  ) => {
    try {
      setResolving(true);
      await sessionApi.resolveRescheduling(session._id, newTimeSlotId, slotDetails);
      toast.success('Session rescheduled!');
      onResolved();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      toast.error(errorMessage);
    } finally {
      setResolving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Reschedule Needed</h2>
            <p className="text-slate-500 text-sm mt-1">
              Your mentor reported absence for {session.subjectId?.subjectName}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            Choose a new time slot from your mentor&apos;s schedule
          </p>

          {loading ? (
            <Loader size="md" text="Checking mentor slots..." />
          ) : availability.some((d) => d.slots?.some((s: { remainingCapacity: number }) => s.remainingCapacity > 0)) ? (
            <div className="space-y-6">
              {availability.map((day) => (
                <div key={day.day}>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 ml-1">{day.day}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {day.slots.map((slot: { _id?: string; startTime: string; endTime: string; remainingCapacity: number }, idx: number) => (
                      <button
                        key={idx}
                        onClick={() =>
                          handleConfirm(
                            slot._id,
                            !slot._id
                              ? { date: day.date, startTime: slot.startTime, endTime: slot.endTime }
                              : undefined
                          )
                        }
                        disabled={resolving}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
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
              <p className="text-rose-600 font-bold text-sm">
                No other slots available for this mentor currently.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── StudentClassroom ──────────────────────────────────────────────────────────

const StudentClassroom: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [eligibilityData, setEligibilityData] = useState<LeaveEligibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRescheduleSession, setSelectedRescheduleSession] = useState<Session | null>(null);

  // Modal State
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSubmittingAbsence, setIsSubmittingAbsence] = useState(false);

  const loadSessions = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await studentApi.getUpcomingSessions();
      setEligibilityData(data);
      dispatch(fetchStudentTrialClasses());
    } catch {
      console.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleApplyLeave = () => {
    const eligibleSession = eligibilityData?.sessions.find((s) => s.canRequestLeave);
    if (eligibleSession) {
      setSelectedSessionId(eligibleSession.id);
      setIsAbsenceModalOpen(true);
    } else {
      toast.error('No eligible sessions for leave request.');
    }
  };

  const handleRequestSlotChange = () => {
    toast.error('Slot change request functionality is being updated. Please contact support.');
  };

  const handleSubmitAbsence = async (reason: string) => {
    if (!selectedSessionId) return;
    try {
      setIsSubmittingAbsence(true);
      await sessionApi.reportAbsence(selectedSessionId, reason);
      toast.success('Absence reported successfully');
      setIsAbsenceModalOpen(false);
      loadSessions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to report absence');
    } finally {
      setIsSubmittingAbsence(false);
    }
  };

  const isJoinable = (startTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffInMinutes = (start.getTime() - now.getTime()) / (1000 * 60);
    return diffInMinutes <= 60 && diffInMinutes >= -120;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySessions =
    eligibilityData?.sessions.filter((s) => {
      const d = new Date(s.session.startTime);
      return d >= today && d < tomorrow;
    }) || [];

  const weeklySessions =
    eligibilityData?.sessions.filter((s) => {
      const d = new Date(s.session.startTime);
      return d >= tomorrow;
    }) || [];

  return (
    <StudentLayout title="Classroom">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Your Virtual Classroom</h1>
          <p className="text-indigo-100 max-w-lg">
            Access your live classes, recordings, and interactive whiteboard sessions here.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
          <BookOpen size={200} />
        </div>
      </div>

      <div className="space-y-12">
        {/* TODAY'S SESSIONS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Today&apos;s Sessions
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Live interactive classes scheduled for today
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader size="lg" />
            </div>
          ) : todaySessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todaySessions.map(({ session, id }) => (
                <div
                  key={id}
                  className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                      <Video size={24} />
                    </div>
                    {session.sessionType === 'group' && session.participants?.find(p => p.userId === currentUser?._id)?.status === 'absent' ? (
                      <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                        ABSENT
                      </div>
                    ) : (
                      <div
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          session.status === 'rescheduling'
                            ? 'bg-amber-100 text-amber-700'
                          : session.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {session.status}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight">
                    {session.subjectId?.subjectName}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mb-6 flex items-center gap-1.5 uppercase tracking-wide">
                    <Clock size={12} className="text-indigo-500" />
                    {new Date(session.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  <div className="flex items-center gap-3 mb-8 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-indigo-600 text-sm">
                      {session.mentorId?.fullName?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                        Mentor
                      </p>
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {session.mentorId?.fullName}
                      </p>
                    </div>
                  </div>

                  {session.sessionType === 'group' && session.participants?.find(p => p.userId === currentUser?._id)?.status === 'absent' ? (
                    <div className="w-full bg-slate-50 text-slate-500 h-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest border border-slate-200">
                      Absent from Session
                    </div>
                  ) : session.status === 'cancelled' ? (
                    session.cancelledBy === 'mentor' ? (
                      <Button
                        onClick={() => setSelectedRescheduleSession(session)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                      >
                        Rebook Session
                      </Button>
                    ) : (
                      <div className="w-full bg-rose-50 text-rose-600 h-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-widest border border-rose-100">
                        Session Cancelled
                      </div>
                    )
                  ) : session.status === 'rescheduling' ? (
                    <Button
                      onClick={() => setSelectedRescheduleSession(session)}
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 rounded-2xl font-black text-xs uppercase tracking-widest"
                    >
                      Resolve Rescheduling
                    </Button>
                  ) : (
                    <Button
                      disabled={!isJoinable(session.startTime)}
                      onClick={() => window.open(`/session/${session._id}/call`, '_blank')}
                      className={`w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        isJoinable(session.startTime)
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isJoinable(session.startTime) ? (
                        <span className="flex items-center justify-center gap-2">
                          Join Session <ExternalLink size={14} />
                        </span>
                      ) : (
                        'Joining Soon'
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No classes today"
              description="Take a break! You have no live classes scheduled for today."
            />
          )}
        </section>

        {/* THIS WEEK UPCOMING SESSIONS */}
        <section>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                This Week Upcoming Sessions
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                Prepare for your upcoming learning journey
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Request Leave */}
              <div className="relative group/tooltip">
                <Button
                  disabled={!eligibilityData?.leaveWindowOpen}
                  onClick={handleApplyLeave}
                  className={`px-6 h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    eligibilityData?.leaveWindowOpen
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                      : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'
                  }`}
                >
                  Request Leave
                </Button>
                {!eligibilityData?.leaveWindowOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none text-center shadow-xl z-50">
                    Leave can only be requested at least 12 hours before session start.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                  </div>
                )}
              </div>

              {/* Request Slot Change */}
              <div className="relative group/tooltip">
                <Button
                  disabled={!eligibilityData?.slotChangeWindowOpen}
                  onClick={handleRequestSlotChange}
                  className={`px-6 h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    eligibilityData?.slotChangeWindowOpen
                      ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                      : 'bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed'
                  }`}
                >
                  Request Slot Change
                </Button>
                {!eligibilityData?.slotChangeWindowOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none text-center shadow-xl z-50">
                    Slot changes can only be requested at least 12 hours before session start.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader size="lg" />
            </div>
          ) : weeklySessions.length > 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Class
                      </th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Schedule
                      </th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Mentor
                      </th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {weeklySessions.map(({ session, id }) => (
                      <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <BookOpen size={18} />
                            </div>
                            <span className="font-bold text-slate-900">
                              {session.subjectId?.subjectName}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">
                              {new Date(session.startTime).toLocaleDateString(undefined, {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {new Date(session.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-indigo-600 text-[10px]">
                              {session.mentorId?.fullName?.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-600">
                              {session.mentorId?.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {session.sessionType === 'group' && session.participants?.find(p => p.userId === currentUser?._id)?.status === 'absent' ? (
                            <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                              ABSENT
                            </span>
                          ) : (
                            <span
                              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                session.status === 'rescheduling'
                                  ? 'bg-amber-100 text-amber-700'
                                : session.status === 'cancelled'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {session.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No other upcoming sessions"
              description="Enjoy your week! All your scheduled classes have been displayed."
            />
          )}
        </section>

        {/* PAST CLASSES */}
        <section className="bg-slate-50 rounded-[3rem] p-12 text-center border border-dashed border-slate-200">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-400">
              <Video size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
              Past Classes &amp; Recordings
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Access your previous class recordings and whiteboard snapshots once they are available.
            </p>
          </div>
        </section>
      </div>

      {/* Modals */}
      <RescheduleModal
        isOpen={!!selectedRescheduleSession}
        onClose={() => setSelectedRescheduleSession(null)}
        session={selectedRescheduleSession!}
        onResolved={loadSessions}
      />

      <ReportAbsenceModal
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        onSubmit={handleSubmitAbsence}
        isLoading={isSubmittingAbsence}
        title="Request Student Leave"
        description="Please provide a valid reason for your leave request. Your mentor will be notified immediately."
      />
    </StudentLayout>
  );
};

export default StudentClassroom;
