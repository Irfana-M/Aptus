import { useState, useEffect } from "react";
import { Clock, BookOpen, ChevronRight, CheckCircle, Calendar } from "lucide-react";
import { getAvailableTrialSlots, requestTrialClass, fetchSubjectsByGrade } from "../../features/student/studentApi";
import toast from "react-hot-toast";
import Header from "../../components/layout/Header";
import { Button } from "../../components/ui/Button";
import { Loader } from "../../components/ui/Loader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ROUTES } from "../../constants/routes.constants";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";

interface AvailableSlot {
  startTime: string;
  endTime: string;
  mentorCount: number;
}

interface Subject {
    _id: string;
    subjectName: string;
}

// Simple Native Date Picker Component styled
const DatePicker = ({ value, onChange, min }: { value: string, onChange: (date: string) => void, min: string }) => (
    <div className="relative">
        <input
            type="date"
            value={value}
            min={min}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-14 pl-5 pr-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 font-bold text-slate-700 transition-all cursor-pointer"
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Calendar size={20} />
        </div>
    </div>
);

const SuccessComponent = ({ 
    message, 
    onClose 
}: { 
    message: string; 
    onClose: () => void 
}) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center">
            <div className="bg-white border-4 border-teal-500 rounded-2xl p-12 relative shadow-xl">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                    <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">You're Booked!</h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed whitespace-pre-line">{message}</p>
                <Button 
                    variant="primary" 
                    size="lg" 
                    onClick={onClose}
                    className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-800"
                >
                    Back to Dashboard
                </Button>
            </div>
        </div>
    </div>
);

const BookTuitionSessions = () => {
    const [subjectId, setSubjectId] = useState("");
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [noSlotsMessage, setNoSlotsMessage] = useState("");

    const studentProfile = useSelector((state: RootState) => state.student.profile);

    // Fetch Subjects on Mount
    useEffect(() => {
        const loadSubjects = async () => {
            if (!studentProfile?.academicDetails?.grade) return;
            
            try {
                setLoadingSubjects(true);
                const response = await fetchSubjectsByGrade(
                    studentProfile.academicDetails.grade,
                    studentProfile.academicDetails.syllabus
                );
                
                if (response.success) {
                    setSubjects(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch subjects", error);
                toast.error("Could not load subjects for your grade.");
            } finally {
                setLoadingSubjects(false);
            }
        };

        loadSubjects();
    }, [studentProfile]);

    // Get tomorrow's date for min date picker
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    useEffect(() => {
        const loadSlots = async () => {
            if (!subjectId || !selectedDate) {
                setAvailableSlots([]);
                setNoSlotsMessage("");
                return;
            }

            try {
                setLoadingSlots(true);
                setNoSlotsMessage("");
                
                const response = await getAvailableTrialSlots(subjectId, selectedDate);
                
                if (response.success && response.data.slots.length > 0) {
                    setAvailableSlots(response.data.slots);
                } else {
                    setAvailableSlots([]);
                    setNoSlotsMessage(response.message || "No slots available for this date.");
                }
            } catch (error) {
                console.error("Failed to fetch slots", error);
                setAvailableSlots([]);
                setNoSlotsMessage("No mentors available on this date. Please try another day.");
            } finally {
                setLoadingSlots(false);
            }
        };

        loadSlots();
    }, [subjectId, selectedDate]);

    const handleBookSlot = async (slot: AvailableSlot) => {
        try {
            setBookingLoading(true);
            const timeRange = `${slot.startTime}-${slot.endTime}`;
            const subjectName = subjects.find(s => s._id === subjectId)?.subjectName || "Subject";
            
            const response = await requestTrialClass({
                subject: subjectId,
                preferredDate: selectedDate,
                preferredTime: timeRange
            });

            if (response.success) {
                const dateStr = new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                setSuccessMessage(`Trial Class confirmed for ${subjectName}\n${dateStr} at ${slot.startTime}\n\nWe have assigned an expert mentor for you.\nCheck your dashboard for details!`);
                setShowSuccess(true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to book trial class";
            toast.error(errorMessage);
        } finally {
            setBookingLoading(false);
        }
    };

    if (showSuccess) {
        return <SuccessComponent message={successMessage} onClose={() => window.location.href = ROUTES.STUDENT.DASHBOARD} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
            <Header />
            
            <main className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
                        Book Your <span className="text-teal-500">Free Trial</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto">
                        Select a time, and we'll instantly match you with an expert mentor.
                    </p>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                    <div className="p-8 md:p-12 space-y-10">
                        
                        {/* Step 1: Subject */}
                        <section>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">1</span>
                                Choose Subject
                            </label>
                            <div className="relative">
                                <select
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    disabled={loadingSubjects}
                                    className="w-full h-16 pl-6 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 appearance-none font-bold text-lg text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    <option value="">{loadingSubjects ? "Loading subjects..." : "Select subject..."}</option>
                                    {subjects.map(s => (
                                        <option key={s._id} value={s._id}>{s.subjectName}</option>
                                    ))}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ChevronRight className="rotate-90" />
                                </div>
                            </div>
                        </section>

                        {/* Step 2: Date & Time */}
                        <section className={`transition-all duration-500 ${subjectId ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">2</span>
                                Pick a Date
                            </label>
                            
                            <div className="mb-8">
                                <DatePicker 
                                    value={selectedDate} 
                                    onChange={setSelectedDate} 
                                    min={minDate} 
                                />
                            </div>

                            {/* Available Slots Grid */}
                            {selectedDate && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                            Available Times
                                        </label>
                                        {availableSlots.length > 0 && (
                                            <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">
                                                {availableSlots.length} slots found
                                            </span>
                                        )}
                                    </div>

                                    {loadingSlots ? (
                                        <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                            <Loader size="sm" text="Checking availability..." color="teal" />
                                        </div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {availableSlots.map((slot, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleBookSlot(slot)}
                                                    disabled={bookingLoading}
                                                    className="group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="text-lg font-black text-slate-700 group-hover:text-teal-700">{slot.startTime}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-teal-600/70 border-t border-slate-100 group-hover:border-teal-200 mt-1 pt-1 w-full text-center">
                                                        {slot.mentorCount} mentors free
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState 
                                            icon={Clock}
                                            title="No slots available" 
                                            description={noSlotsMessage || "No mentors available on this date. Please try another day."}
                                            actionLabel="Try another date"
                                            onAction={() => setSelectedDate("")}
                                            variant="compact"
                                        />
                                    )}
                                </div>
                            )}
                        </section>

                    </div>
                    
                    {/* Bottom Info Bar */}
                    <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Instant Confirmation</p>
                                <p className="text-xs text-slate-500">Book now, start learning</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Expert Mentors</p>
                                <p className="text-xs text-slate-500">Hand-picked professionals</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BookTuitionSessions;
