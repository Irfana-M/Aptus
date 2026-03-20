import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Calendar, CheckCircle, ArrowLeft } from "lucide-react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../app/store";
import { resolveRescheduling } from "../../features/session/sessionThunk";
import { sessionApi } from "../../features/session/sessionApi";
import StudentLayout from "../../components/students/StudentLayout";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { ROUTES } from "../../constants/routes.constants";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface AvailableSlot {
  startTime: string;
  endTime: string;
  mentorCount: number;
  timeSlotId?: string;
}

const RescheduleSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch session details
  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        setLoadingSession(true);
        const res = await sessionApi.getSessionById(sessionId);
        // Guard: Allow rescheduling only when status is 'rescheduling'
        // or if it was 'cancelled' by mentor and hasn't yet been rescheduled
        const isValid = 
          res.data?.status === "rescheduling" || 
          (res.data?.status === "cancelled" && res.data?.cancelledBy === "mentor" && !res.data?.rescheduledTo);
        
        if (!isValid) {
          toast.error("This session is not available for rescheduling.");
          navigate(ROUTES.STUDENT.DASHBOARD);
          return;
        }
        setSession(res.data);
      } catch {
        toast.error("Failed to load session details.");
        navigate(ROUTES.STUDENT.DASHBOARD);
      } finally {
        setLoadingSession(false);
      }
    };
    load();
  }, [sessionId, navigate]);

  // Fetch available slots whenever date changes
  useEffect(() => {
    if (!selectedDate || !session?.subjectId || !session?.mentorId) return;
    const subjectId =
      typeof session.subjectId === "object"
        ? session.subjectId._id
        : session.subjectId;
        
    const mentorId =
      typeof session.mentorId === "object"
        ? session.mentorId._id
        : session.mentorId;

    const load = async () => {
      try {
        setLoadingSlots(true);
        const res = await sessionApi.getAvailableSlotsForReschedule(mentorId, subjectId, selectedDate);
        if (res.success && res.data?.slots?.length > 0) {
          setAvailableSlots(res.data.slots);
        } else {
          setAvailableSlots([]);
        }
      } catch {
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    load();
  }, [selectedDate, session]);

  const handleConfirm = async (slot: AvailableSlot) => {
    if (!sessionId) return;
    try {
      setSubmitting(true);
      await dispatch(
        resolveRescheduling({
          sessionId,
          slotDetails: {
            date: selectedDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        })
      ).unwrap();
      setSuccess(true);
    } catch {
      // error toast already shown in thunk
    } finally {
      setSubmitting(false);
    }
  };

  // Tomorrow as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  if (loadingSession) {
    return (
      <StudentLayout title="Reschedule Session">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader size="lg" text="Loading session details…" />
        </div>
      </StudentLayout>
    );
  }

  if (success) {
    return (
      <StudentLayout title="Rescheduled">
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="w-full max-w-lg text-center">
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-12">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">
                Session Rescheduled!
              </h2>
              <p className="text-slate-500 mb-8">
                Your mentor will receive a notification about the new schedule.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate(ROUTES.STUDENT.DASHBOARD)}
                className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-800"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const subjectName =
    typeof session?.subjectId === "object"
      ? session.subjectId.subjectName
      : "Your Subject";
  const originalTime = session?.startTime
    ? format(new Date(session.startTime), "MMM do, yyyy 'at' p")
    : "";

  return (
    <StudentLayout title="Reschedule Session">
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
            Reschedule <span className="text-indigo-500">Session</span>
          </h1>
          <p className="text-slate-500 text-base max-w-md mx-auto">
            Your mentor cancelled the session for{" "}
            <strong className="text-slate-700">{subjectName}</strong> originally
            scheduled on{" "}
            <strong className="text-slate-700">{originalTime}</strong>. Please
            pick a new time.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-12 space-y-10">
            {/* Date Picker */}
            <section>
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">
                  1
                </span>
                Pick a New Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAvailableSlots([]);
                  }}
                  className="w-full h-14 pl-5 pr-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-slate-700 transition-all cursor-pointer"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Calendar size={20} />
                </div>
              </div>
            </section>

            {/* Available Slots */}
            <section
              className={`transition-all duration-500 ${
                selectedDate
                  ? "opacity-100 translate-y-0"
                  : "opacity-40 pointer-events-none"
              }`}
            >
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">
                  2
                </span>
                Select a Time Slot
              </label>

              {loadingSlots ? (
                <div className="py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                  <Loader size="sm" text="Checking mentor availability…" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleConfirm(slot)}
                      disabled={submitting}
                      className="group flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock
                        size={20}
                        className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors"
                      />
                      <span className="text-lg font-black text-slate-700 group-hover:text-indigo-700">
                        {slot.startTime}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 mt-0.5">
                        {slot.mentorCount} mentor
                        {slot.mentorCount !== 1 ? "s" : ""} free
                      </span>
                    </button>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-slate-400 font-bold text-sm">
                    No slots available on this date.
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Try selecting a different day.
                  </p>
                </div>
              ) : null}
            </section>
          </div>

          {/* Bottom bar */}
          <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center gap-3 text-sm text-slate-500">
            <Clock size={18} className="text-indigo-400 shrink-0" />
            <span>
              Selecting a slot will confirm the reschedule and notify your
              mentor immediately.
            </span>
          </div>
        </div>
      </main>
    </StudentLayout>
  );
};

export default RescheduleSession;
