import React, { useState, useEffect } from "react";
import { Menu, X, Bell, User, Clock, BookOpen, ChevronRight, Info } from "lucide-react";
import { createCourseRequest, findMentors } from "../../features/student/studentApi";
import toast from "react-hot-toast";
import Header from "../../components/layout/Header";
import { Button } from "../../components/ui/Button";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import type { MentorProfile } from "../../features/mentor/mentorSlice";

// Success Component
interface SuccessComponentProps {
  title?: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
  onClose?: () => void;
}

interface Slot {
    startTime: string;
    endTime: string;
    isBooked?: boolean;
    day?: string;
}

interface SelectedSlot extends Slot {
    day: string;
}

interface Session {
    subject: string;
    date: string;
    time: string;
    mentorId: string;
    mentorName: string;
}

const SuccessComponent: React.FC<SuccessComponentProps> = ({
  title = "Success!",
  message,
  buttonText = "Continue to Home",
  onButtonClick,
  onClose,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold text-teal-600 mb-4 text-center">{title}</h2>
        <div className="bg-white border-4 border-teal-500 rounded-2xl p-12 text-center relative shadow-xl">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          )}
          
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <p className="text-slate-700 text-xl font-medium mb-8 leading-relaxed">{message}</p>

          <Button
            variant="primary"
            size="lg"
            onClick={onButtonClick}
            className="bg-green-500 hover:bg-green-600 px-8 py-3 text-lg"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

const MentorCard = ({ 
  mentor, 
  onSelect, 
  onDetails 
}: { 
  mentor: MentorProfile; 
  onSelect: (mentor: MentorProfile) => void;
  onDetails: (mentor: MentorProfile) => void;
}) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-500 hover:shadow-md transition-all group flex flex-col sm:flex-row gap-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden border-2 border-white group-hover:border-teal-100 shadow-sm cursor-pointer" onClick={() => onSelect(mentor)}>
        {mentor.profileImageUrl ? (
          <img src={mentor.profileImageUrl} alt={mentor.fullName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50 font-bold text-xl uppercase">
            {mentor.fullName?.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors cursor-pointer" onClick={() => onSelect(mentor)}>
              {mentor.fullName}
            </h3>
            <div className="flex items-center gap-1 text-sm text-yellow-500 mt-1">
              <span className="font-medium text-gray-600 mr-2">{"★".repeat(Math.round(mentor.rating || 5))}</span>
              <span className="text-gray-400 font-bold">({mentor.rating || '5.0'})</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {mentor.bio || "Excellence in teaching through personalized guidance and real-world application."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
           {mentor.subjectProficiency?.map((s: { subject: string }, i: number) => (
             <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
               {s.subject}
             </span>
           ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 justify-center sm:pl-4 sm:border-l border-gray-100">
        <Button variant="outline" className="text-sm whitespace-nowrap bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100" onClick={() => onSelect(mentor)}>
          View Schedule
        </Button>
        <button 
          onClick={() => onDetails(mentor)}
          className="text-[11px] font-bold text-slate-400 hover:text-teal-600 transition-colors uppercase tracking-wider flex items-center justify-center gap-1"
        >
          <Info size={12} /> Details
        </button>
      </div>
    </div>
  );

interface AvailabilityDay {
    day: string;
    slots: Slot[];
}

const AvailabilityGrid = ({ availability, onSlotSelect, selectedSlots, studentAvailability = [] }: { 
    availability?: AvailabilityDay[]; 
    onSlotSelect: (day: string, slot: Slot) => void;
    selectedSlots: Slot[];
    studentAvailability?: Slot[];
}) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-7 gap-2 text-center mb-4">
          {days.map(d => (
            <div key={d} className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              {d.slice(0, 3)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-3">
          {days.map(dayText => {
            const dayData = availability?.find((d) => d.day === dayText);
            return (
              <div key={dayText} className="space-y-2">
                {dayData?.slots?.map((slot: Slot, idx: number) => {
                      const isSelected = selectedSlots.some(s => s.day === dayText && s.startTime === slot.startTime);
                      const isStudentAvailable = studentAvailability.some(s => s.day === dayText && s.startTime === slot.startTime);
                      
                      return (
                        <button
                          key={idx}
                      disabled={slot.isBooked}
                      onClick={() => onSlotSelect(dayText, slot)}
                      className={`w-full py-2.5 px-1 text-[11px] font-bold rounded-lg border transition-all duration-200 h-10 flex items-center justify-center cursor-pointer relative ${
                        slot.isBooked 
                          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-60" 
                          : isSelected
                            ? "bg-teal-500 text-white border-teal-600 shadow-lg shadow-teal-500/30 -translate-y-0.5"
                            : isStudentAvailable
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:border-teal-400 hover:bg-teal-50"
                              : "bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700"
                      }`}
                    >
                      {slot.startTime}
                      {isStudentAvailable && !isSelected && !slot.isBooked && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-white animate-pulse" />
                      )}
                    </button>
                  );
                })}
                {!dayData?.slots?.length && (
                    <div className="h-10 flex items-center justify-center text-[10px] text-slate-300 italic">
                        N/A
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

const StudentAvailabilityGrid = ({ studentAvailability, setStudentAvailability }: {
    studentAvailability: Slot[];
    setStudentAvailability: (slots: Slot[]) => void;
}) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    // Simplified hours for student setup
    const hours = [
        "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00",
        "18:00-19:00", "19:00-20:00", "20:00-21:00"
    ];

    const toggleSlot = (day: string, time: string) => {
        const [start, end] = time.split('-');
        const exists = studentAvailability.find(s => s.day === day && s.startTime === start);
        if (exists) {
            setStudentAvailability(studentAvailability.filter(s => !(s.day === day && s.startTime === start)));
        } else {
            setStudentAvailability([...studentAvailability, { day, startTime: start, endTime: end }]);
        }
    };

    return (
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Clock className="text-teal-400" /> My Free Time
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Select the slots when you are available for classes.</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl text-teal-400 font-bold text-sm">
                    {studentAvailability.length} Slots Selected
                </div>
            </div>

            <div className="grid grid-cols-8 gap-2">
                <div className="pt-8">
                    {hours.map(h => (
                        <div key={h} className="h-10 flex items-center text-[10px] font-black text-slate-500 uppercase">
                            {h.split('-')[0]}
                        </div>
                    ))}
                </div>
                {days.map(day => (
                    <div key={day} className="space-y-2">
                        <div className="text-[10px] font-black text-center text-slate-500 uppercase mb-4 tracking-widest">{day.slice(0, 3)}</div>
                        {hours.map(h => {
                             const isSelected = studentAvailability.some(s => s.day === day && s.startTime === h.split('-')[0]);
                             return (
                                 <button 
                                    key={h}
                                    onClick={() => toggleSlot(day, h)}
                                    className={`w-full h-10 rounded-lg border-2 transition-all cursor-pointer ${
                                        isSelected 
                                        ? "bg-teal-500 border-teal-400 shadow-lg shadow-teal-500/20" 
                                        : "bg-white/5 border-transparent hover:border-white/20"
                                    }`}
                                 />
                             )
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const MentorDetailsModal = ({ mentor, onClose }: { mentor: MentorProfile; onClose: () => void }) => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="relative h-32 bg-teal-500">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all cursor-pointer">
                    <X size={20} />
                </button>
            </div>
            <div className="px-8 pb-8 -mt-16 text-center">
                <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-xl mx-auto mb-4">
                    {mentor.profileImageUrl ? (
                        <img src={mentor.profileImageUrl} alt="" className="w-full h-full object-cover rounded-[1.25rem]" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 font-black text-4xl rounded-[1.25rem]">
                            {mentor.fullName?.charAt(0)}
                        </div>
                    )}
                </div>
                <h2 className="text-2xl font-black text-slate-900">{mentor.fullName}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="flex text-yellow-500">{"★".repeat(5)}</div>
                    <span className="text-slate-400 text-sm font-bold">4.9 (120+ Reviews)</span>
                </div>
                
                <div className="mt-8 text-left space-y-6">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">About Mentor</h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {mentor.bio || "Experienced educator dedicated to unlocking student potential through structured learning and practical application."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Expertise</h4>
                            <p className="text-sm font-bold text-slate-700">{mentor.expertise?.join(', ') || 'General Education'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Location</h4>
                            <p className="text-sm font-bold text-slate-700">{mentor.location || 'Remote'}</p>
                        </div>
                    </div>
                </div>

                <Button className="w-full mt-10 py-5 rounded-2xl bg-slate-900 text-white font-bold tracking-tight" onClick={onClose}>
                    GOT IT
                </Button>
            </div>
        </div>
    </div>
);

const BookTuitionSessions = () => {
    const [mentoringMode, setMentoringMode] = useState<"one-to-one" | "one-to-many">("one-to-one");
    const [subject, setSubject] = useState("");
    const studentProfile = useSelector((state: RootState) => state.student.profile);

    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mentors, setMentors] = useState<MentorProfile[]>([]);
    const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
    const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);

    const [showForm, setShowForm] = useState(false);
    const [viewingMentorDetails, setViewingMentorDetails] = useState<MentorProfile | null>(null);
    const [studentAvailability, setStudentAvailability] = useState<Slot[]>([]);
    const [isDefiningAvailability, setIsDefiningAvailability] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  
    useEffect(() => {
      const loadMentors = async () => {
          if (!subject) {
              setMentors([]);
              return;
          }
          try {
              setLoading(true);
              const response = await findMentors(subject);
              setMentors(response.data.matches || []);
          } catch (error) {
              console.error("Failed to fetch mentors", error);
              toast.error("Failed to load mentors for " + subject);
          } finally {
              setLoading(false);
          }
      };
      loadMentors();
    }, [subject]);
  
    const handleSlotSelect = (day: string, slot: Slot) => {
      const exists = selectedSlots.findIndex((s: SelectedSlot) => s.day === day && s.startTime === slot.startTime);
      if (exists > -1) {
        setSelectedSlots(selectedSlots.filter((_: SelectedSlot, i: number) => i !== exists));
      } else {
        setSelectedSlots([...selectedSlots, { ...slot, day }]);
      }
    };

    const handleMentorSelect = (mentor: MentorProfile) => {
        setSelectedMentor(mentor);
        setSelectedSlots([]);
    };

    const handleMentorDetails = (mentor: MentorProfile) => {
        setViewingMentorDetails(mentor);
    };
  
    const confirmSelection = () => {
        if (selectedSlots.length === 0 || !selectedMentor) return;
        
        const newSessions: Session[] = selectedSlots.map((slot: SelectedSlot) => ({
          subject: subject,
          date: slot.day,
          time: `${slot.startTime}-${slot.endTime}`,
          mentorId: selectedMentor._id,
          mentorName: selectedMentor.fullName
        }));
  
        setSelectedSessions([...selectedSessions, ...newSessions]);
        setSelectedSlots([]);
        setSelectedMentor(null);
        toast.success(`${newSessions.length} sessions added!`);
    };
  
    const removeSession = (index: number) => {
      setSelectedSessions(selectedSessions.filter((_: Session, i: number) => i !== index));
    };
  
    const handleSubmitRequest = async () => {
      if (selectedSessions.length === 0) {
          toast.error("Please select at least one session");
          return;
      }
  
      try {
          setLoading(true);
          // Group sessions by subject for multiple requests if needed, 
          // but for now the backend expects one request at a time or we send first session details
          const firstSession = selectedSessions[0];
          const days = selectedSessions.map((s: Session) => s.date);
          
          const payload = {
              subject: firstSession.subject,
              grade: studentProfile?.academicDetails?.grade || "N/A",
              mentoringMode: mentoringMode,
              preferredDays: days,
              timeSlot: firstSession.time,
              mentorId: firstSession.mentorId // New mentorId support
          };
          const response = await createCourseRequest(payload);
          if (response.success) {
               setShowSuccess(true);
               setSelectedSessions([]);
          }
      } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(err.response?.data?.message || "Failed to submit request");
      } finally {
          setLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        <Header />
        {viewingMentorDetails && <MentorDetailsModal mentor={viewingMentorDetails} onClose={() => setViewingMentorDetails(null)} />}

        {showSuccess ? (
          <SuccessComponent
            title="Request Received!"
            message="We've received your tutoring request. Our team will match you with your selected mentor and confirm the schedule within 24 hours."
            buttonText="Back to Dashboard"
            onButtonClick={() => (window.location.href = "/student/dashboard")}
            onClose={() => setShowSuccess(false)}
          />
        ) : !showForm ? (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                 <div className="w-24 h-24 bg-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-teal-500/20">
                     <BookOpen className="text-white w-12 h-12" />
                 </div>
                 <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Request a <span className="text-teal-500">Trial Class</span></h1>
                 <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto">Get matched with our top mentors for a personalized 1-on-1 session to jumpstart your learning journey.</p>
                 <Button onClick={() => setShowForm(true)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 mx-auto hover:bg-slate-800 transition-all group shadow-xl shadow-slate-900/10">
                     START REQUEST <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                 </Button>
            </div>
        ) : (
          <main className="max-w-6xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form and Selection */}
              <div className="lg:col-span-8 space-y-8">
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
                      <div className="mb-10">
                          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                              Find Your Perfect <span className="text-teal-500">Mentor</span>
                          </h1>
                          <p className="text-slate-500 mt-2 text-lg">Choose a subject and select a mentor from our expert network.</p>
                      </div>
  
                      <div className="space-y-10">
                          {/* 0. Student Availability (NEW STEP) */}
                          {studentAvailability.length === 0 || isDefiningAvailability ? (
                              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <StudentAvailabilityGrid 
                                      studentAvailability={studentAvailability} 
                                      setStudentAvailability={setStudentAvailability} 
                                  />
                                  <div className="mt-8 flex justify-end">
                                      <Button 
                                          onClick={() => setIsDefiningAvailability(false)}
                                          disabled={studentAvailability.length === 0}
                                          className="bg-teal-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-600 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
                                      >
                                          NEXT: FIND MENTOR <ChevronRight size={18} />
                                      </Button>
                                  </div>
                              </section>
                          ) : (
                              <>
                                  <div className="flex justify-between items-center bg-teal-50 border border-teal-100 p-4 rounded-2xl mb-6">
                                      <div className="flex items-center gap-3">
                                          <div className="bg-teal-500 p-2 rounded-lg text-white">
                                              <Clock size={16} />
                                          </div>
                                          <div>
                                              <p className="text-xs font-black text-teal-800 uppercase tracking-tight">Your availability set</p>
                                              <p className="text-[10px] text-teal-600 font-bold">{studentAvailability.length} slots will be highlighted in mentor schedules</p>
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => setIsDefiningAvailability(true)}
                                          className="text-xs font-black text-teal-600 hover:text-teal-700 underline underline-offset-2"
                                      >
                                          Edit
                                      </button>
                                  </div>

                                  <section>
                                      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">
                                          Step 1: Mentoring Mode
                                      </label>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <button
                                              onClick={() => setMentoringMode("one-to-one")}
                                              className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer ${
                                                  mentoringMode === "one-to-one"
                                                  ? "bg-teal-50 border-teal-500 ring-4 ring-teal-500/10"
                                                  : "bg-white border-slate-100 hover:border-slate-300"
                                              }`}
                                          >
                                              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${mentoringMode === "one-to-one" ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                  <User size={20} />
                                              </div>
                                              <h3 className="font-bold text-lg">One-to-One</h3>
                                              <p className="text-sm text-slate-500 mt-1">Personalized 1:1 attention for focused learning.</p>
                                              {mentoringMode === "one-to-one" && <div className="absolute top-4 right-4 text-teal-500"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>}
                                          </button>
                                          <button
                                              onClick={() => setMentoringMode("one-to-many")}
                                              className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer ${
                                                  mentoringMode === "one-to-many"
                                                  ? "bg-teal-50 border-teal-500 ring-4 ring-teal-500/10"
                                                  : "bg-white border-slate-100 hover:border-slate-300"
                                              }`}
                                          >
                                              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${mentoringMode === "one-to-many" ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                                                  <Menu size={20} />
                                              </div>
                                              <h3 className="font-bold text-lg">Small Group</h3>
                                              <p className="text-sm text-slate-500 mt-1">Collaborative learning in a small group setting.</p>
                                              {mentoringMode === "one-to-many" && <div className="absolute top-4 right-4 text-teal-500"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>}
                                          </button>
                                      </div>
                                  </section>
  
                                  {/* 2. Choose Subject */}
                                  <section>
                                      <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">
                                          Step 2: Choose Subject
                                      </label>
                                      <div className="relative">
                                          <select
                                              value={subject}
                                              onChange={(e) => setSubject(e.target.value)}
                                              className="w-full h-14 pl-5 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 appearance-none font-bold text-slate-700 transition-all cursor-pointer"
                                          >
                                              <option value="">Select subject...</option>
                                              <option value="Mathematics">Mathematics</option>
                                              <option value="Physics">Physics</option>
                                              <option value="Chemistry">Chemistry</option>
                                              <option value="Biology">Biology</option>
                                              <option value="Computer Science">Computer Science</option>
                                              <option value="English">English</option>
                                          </select>
                                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                          </div>
                                      </div>
                                  </section>
  
                                  {/* 3. Mentor Selection */}
                                  {subject && (
                                      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                          <div className="flex justify-between items-end mb-4">
                                              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                                  Step 3: Pick a Mentor
                                              </label>
                                              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">
                                                  {mentors.length} found
                                              </span>
                                          </div>
                                          
                                          {loading ? (
                                              <div className="p-20 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500/20 border-t-teal-500 mb-4"></div>
                                                  <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Finding matches...</p>
                                              </div>
                                          ) : mentors.length > 0 ? (
                                              <div className="grid gap-4">
                                                  {mentors.map((m: MentorProfile) => (
                                                      <MentorCard key={m._id} mentor={m} onSelect={handleMentorSelect} onDetails={handleMentorDetails} />
                                                  ))}
                                              </div>
                                          ) : (
                                              <div className="p-10 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                                  <p className="text-slate-400 font-medium">No mentors currently available for {subject}.</p>
                                                  <button className="text-teal-600 font-black mt-3 hover:text-teal-700 underline underline-offset-4 cursor-pointer">
                                                      Request Custom Session
                                                  </button>
                                              </div>
                                          )}
                                      </section>
                                  )}
                              </>
                          )}
                      </div>
                  </div>
              </div>
  
              {/* Right Column: Checkout Summary */}
              <div className="lg:col-span-4 lg:sticky lg:top-28">
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl group-hover:bg-teal-500/30 transition-colors duration-700"></div>
                      
                      <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-8">
                              <div className="bg-teal-500 p-2 rounded-xl text-slate-900">
                                  <Menu size={20} />
                              </div>
                              <h2 className="text-xl font-black text-white">Booking Summary</h2>
                          </div>
  
                          {selectedSessions.length === 0 ? (
                              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                                      <Bell size={24} />
                                  </div>
                                  <p className="text-sm font-medium italic">Empty basket.<br/>Pick a mentor to begin.</p>
                              </div>
                          ) : (
                              <div className="space-y-8 text-white">
                                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                      {selectedSessions.map((s: Session, i: number) => (
                                          <div key={i} className="group/item bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl flex justify-between items-start hover:border-teal-500/50 transition-colors">
                                              <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                      <p className="text-[10px] font-black uppercase text-teal-400 tracking-wider">
                                                          {s.subject}
                                                      </p>
                                                  </div>
                                                  <p className="font-bold text-md leading-none text-white">{s.date}</p>
                                                  <p className="text-slate-400 text-xs font-medium">{s.time} • {s.mentorName}</p>
                                              </div>
                                              <button 
                                                  onClick={() => removeSession(i)}
                                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
                                              >
                                                  <X size={16} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
  
                                  <div className="space-y-4 pt-4 border-t border-slate-800">
                                      <div className="flex justify-between items-center text-sm font-bold">
                                          <span className="text-slate-400">Total Sessions</span>
                                          <span className="bg-slate-800 px-3 py-1 rounded-full">{selectedSessions.length}</span>
                                      </div>
                                      <Button 
                                          onClick={handleSubmitRequest}
                                          disabled={loading || selectedSessions.length === 0}
                                          className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-black py-5 rounded-2xl text-md tracking-tight transform active:scale-95 transition-all shadow-xl shadow-teal-500/20 disabled:grayscale disabled:opacity-50"
                                      >
                                          {loading ? "PROCESSING..." : "FINALIZE BOOKING"}
                                      </Button>
                                      <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest mt-2">
                                          Secure matching engine • Aptus Education
                                      </p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
            </div>
          </main>
        )}
  
        {/* Schedule Selection Modal */}
        {selectedMentor && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                 <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
                     <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-start bg-white">
                          <div className="flex gap-5 items-center">
                                <div className="w-16 h-16 rounded-2xl bg-teal-500 overflow-hidden shadow-lg shadow-teal-500/20">
                                    {selectedMentor.profileImageUrl ? (
                                        <img src={selectedMentor.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl uppercase">
                                            {selectedMentor.fullName?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                        {selectedMentor.fullName}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-teal-600 font-bold text-sm">Professional Tutor</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500 text-sm font-medium">{subject} Specialization</span>
                                    </div>
                                </div>
                          </div>
                          <button onClick={() => { setSelectedMentor(null); setSelectedSlots([]); }} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all cursor-pointer">
                              <X size={24} className="text-slate-600" />
                          </button>
                     </div>
                     
                     <div className="p-8 md:p-10 bg-slate-50/70 border-b border-slate-100">
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Available Weekly Slots</h3>
                            <div className="flex items-center gap-4 text-xs font-bold">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 bg-white border border-slate-200 rounded-sm"></div>
                                    <span className="text-slate-500">Available</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 bg-teal-500 rounded-sm"></div>
                                    <span className="text-slate-500">Selected</span>
                                </div>
                            </div>
                        </div>
                        <AvailabilityGrid 
                            availability={selectedMentor.availability as AvailabilityDay[] | undefined} 
                            onSlotSelect={handleSlotSelect}
                            selectedSlots={selectedSlots}
                            studentAvailability={studentAvailability}
                        />
                     </div>
  
                     <div className="p-8 md:p-10 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div className="text-center sm:text-left">
                              <p className="text-2xl font-black text-slate-900">
                                  {selectedSlots.length} <span className="text-teal-500">Sessions</span>
                              </p>
                              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-0.5">Ready to be added to summary</p>
                          </div>
                          <div className="flex gap-4 w-full sm:w-auto">
                              <Button 
                                variant="ghost" 
                                className="flex-1 sm:flex-none py-4 px-8 border border-slate-200 rounded-2xl"
                                onClick={() => { setSelectedMentor(null); setSelectedSlots([]); }}
                              >
                                  Go Back
                              </Button>
                              <Button 
                                  variant="secondary" 
                                  className="flex-1 sm:flex-none py-4 px-10 bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-900/10"
                                  disabled={selectedSlots.length === 0}
                                  onClick={confirmSelection}
                              >
                                  Add to Schedule
                              </Button>
                          </div>
                     </div>
                 </div>
            </div>
        )}
      </div>
    );

  };

export default BookTuitionSessions;
