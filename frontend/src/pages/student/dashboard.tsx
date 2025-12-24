import React, { useState } from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import AnnouncementCard from '../../components/students/dashboard/AnnouncementCard';
import EnrolledCourses from '../../components/students/dashboard/EnrolledCourses';
import AssignmentList from '../../components/students/dashboard/AssignmentList';
import ScheduleList from '../../components/students/dashboard/ScheduleList';
import UpcomingClasses from '../../components/students/dashboard/UpcomingClasses';
import ProgressCard from '../../components/students/dashboard/ProgressCard';

import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { CreditCard, Clock, BookOpen, ChevronRight, Check, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { fetchSubjectsByGrade } from '../../features/student/studentApi';
import { fetchStudentProfile } from '../../features/student/studentThunk';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';

interface Subject {
  subjectName: string;
  id?: string;
  [key: string]: unknown;
}

interface SetupData {
  planType: 'monthly' | 'yearly';
  subjectCount: number;
  subjects: string[];
  amount: number;
  availability: { day: string; startTime: string; endTime: string }[];
}

interface SetupWizardProps {
  onComplete: (data: SetupData) => void;
}

interface StudentData {
  academicDetails?: {
    grade?: string;
    syllabus?: string;
  };
  isTrialCompleted?: boolean;
  hasPaid?: boolean;
}

// Assuming StudentProfile is the type of the actual student profile data
// If profile from Redux state is directly StudentProfile, then the `data` property won't exist.
// If profile from Redux state is { data: StudentProfile }, then it will.
// For now, we'll define a minimal StudentProfile based on usage.
interface StudentProfile {
  academicDetails?: {
    grade?: string;
    syllabus?: string;
  };
  isTrialCompleted?: boolean;
  hasPaid?: boolean;
  // Add other properties of a student profile if known
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [availability, setAvailability] = useState<{ day: string; startTime: string; endTime: string }[]>([]);
    const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const { user } = useSelector((state: RootState) => state.auth);
    const { profile } = useSelector((state: RootState) => state.student);
    
    // Safely unwrap profile if it's an API response object
    const studentData = (profile as unknown as { data: StudentProfile })?.data || profile;
    const studentUser = (studentData || user) as StudentData;

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const hours = [
        "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM",
        "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM",
        "04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM", "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM",
        "08:00 PM - 09:00 PM"
    ];

    const toggleSlot = (day: string, time: string) => {
        const [start, end] = time.split(' - ');
        const exists = availability.find(s => s.day === day && s.startTime === start);
        if (exists) {
            setAvailability(availability.filter(s => !(s.day === day && s.startTime === start)));
        } else {
            setAvailability([...availability, { day, startTime: start, endTime: end }]);
        }
    };

    React.useEffect(() => {
        const loadSubjects = async () => {
            const grade = studentUser?.academicDetails?.grade;
            const syllabus = studentUser?.academicDetails?.syllabus;
            if (!grade) {
                console.warn("No grade found for student", studentUser);
                return;
            }
            
            setLoadingSubjects(true);
            try {
                const data = await fetchSubjectsByGrade(grade, syllabus);
                // The API might return { data: [...] } or just [...]
                const list = (data as { data: Subject[] }).data || (data as Subject[]);
                setAvailableSubjects(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error("Failed to fetch subjects", err);
                toast.error("Could not load subjects for your grade.");
            } finally {
                setLoadingSubjects(false);
            }
        };
        loadSubjects();
    }, [studentUser, studentUser?.academicDetails?.grade, studentUser?.academicDetails?.syllabus]);

    const toggleSubject = (subjectName: string) => {
        if (selectedSubjects.includes(subjectName)) {
            setSelectedSubjects(selectedSubjects.filter(s => s !== subjectName));
        } else {
            setSelectedSubjects([...selectedSubjects, subjectName]);
        }
    };

    const calculatePrice = (type?: 'monthly' | 'yearly') => {
        const activeType = type || planType;
        const count = selectedSubjects.length || 1;
        if (activeType === 'monthly') return count * 500;
        // Tiered Yearly: 1:5k, 2:10k, 3:15k, 4+:20k
        if (count >= 4) return 20000;
        return count * 5000;
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-5xl w-full border border-indigo-50 transform animate-in fade-in zoom-in duration-500 overflow-hidden relative">
            {/* Steps Progress */}
            <div className="flex justify-between mb-12 relative px-10">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                {[1, 2, 3].map(s => (
                    <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 border-2 border-slate-100'}`}>
                        {step > s ? <Check size={18} /> : s}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Set Your Free Time</h2>
                        <p className="text-slate-500 mt-2">Mark the slots when you're available for regular classes.</p>
                        <div className="mt-4 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl inline-flex items-center gap-2 text-indigo-700 text-sm font-medium">
                            <BookOpen size={16} /> Each subject includes 3 classes per week.
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-x-auto shadow-inner">
                        <div className="min-w-[700px]">
                            <div className="grid grid-cols-8 gap-2 mb-4">
                                <div />
                                {days.map(d => <div key={d} className="text-[10px] font-black text-center text-slate-500 uppercase tracking-widest">{d.slice(0, 3)}</div>)}
                            </div>
                            {hours.map(h => (
                                <div key={h} className="grid grid-cols-8 gap-2 mb-2">
                                    <div className="text-[10px] font-black text-slate-500 uppercase flex items-center">{h.split('-')[0]}</div>
                                    {days.map(day => {
                                        const [startTime] = h.split(' - ');
                                        const isSelected = availability.some(s => s.day === day && s.startTime === startTime);
                                        return (
                                            <button 
                                                key={day}
                                                onClick={() => toggleSlot(day, h)}
                                                className={`h-8 rounded-lg border-2 transition-all cursor-pointer ${isSelected ? "bg-indigo-500 border-indigo-400 shadow-lg shadow-indigo-500/20" : "bg-white/5 border-transparent hover:border-white/20"}`}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-between items-center text-slate-400 text-sm italic">
                         <p>{availability.length} slots selected</p>
                         <Button onClick={() => setStep(2)} disabled={availability.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2">
                            NEXT: CHOOSE PLAN <ChevronRight size={18} />
                         </Button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="text-amber-600" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Choose Your Subscription</h2>
                        <p className="text-slate-500 mt-2">Select a plan that fits your learning goals.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-10">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Select Your Subjects</label>
                                <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loadingSubjects ? (
                                        <div className="col-span-2 text-center py-4 text-slate-400 italic">Loading subjects...</div>
                                    ) : availableSubjects.length > 0 ? (
                                        availableSubjects.map((sub: Subject) => (
                                            <button
                                                key={sub.subjectName || sub.id}
                                                onClick={() => toggleSubject(sub.subjectName)}
                                                className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-center ${selectedSubjects.includes(sub.subjectName) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}
                                            >
                                                {sub.subjectName}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="col-span-2 text-center py-4 text-slate-400 italic">
                                            {!(studentUser as StudentData)?.academicDetails?.grade ? 
                                                "Please complete your profile details first." : 
                                                `No subjects found for ${(studentUser as StudentData)?.academicDetails?.grade} (${(studentUser as StudentData)?.academicDetails?.syllabus || 'Any Board'}).`}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-3 italic">{selectedSubjects.length} subjects selected. Yearly plan caps at ₹20,000 for 4+ subjects.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setPlanType('monthly')} className={`p-6 rounded-2xl border-2 text-left transition-all ${planType === 'monthly' ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                    <h3 className="font-bold">Monthly</h3>
                                    <p className="text-xs text-slate-500 mt-1">Pay every month</p>
                                    <p className="font-black text-indigo-600 mt-3 text-lg">₹{calculatePrice('monthly')}<span className="text-[10px] text-slate-400">/mo</span></p>
                                </button>
                                <button onClick={() => setPlanType('yearly')} className={`p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${planType === 'yearly' ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                    <div className="bg-green-500 text-white text-[8px] font-bold px-4 py-0.5 absolute top-2 -right-3 rotate-45">SAVE</div>
                                    <h3 className="font-bold">Yearly</h3>
                                    <p className="text-xs text-slate-500 mt-1">Best value</p>
                                    <p className="font-black text-indigo-600 mt-3 text-lg">₹{calculatePrice('yearly')}<span className="text-[10px] text-slate-400">/yr</span></p>
                                </button>
                            </div>
                        </div>

                        <div className="bg-indigo-600 rounded-3xl p-8 text-white flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-4">Plan Benefits</h3>
                                <ul className="space-y-3">
                                    {['Expert Mentors', 'Live Interactive Classes', 'Recorded Sessions', 'Mock Tests & Quizzes'].map(b => (
                                        <li key={b} className="flex items-center gap-2 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"><Check size={12} /></div>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/20">
                                <p className="text-sm opacity-60">Total Amount</p>
                                <p className="text-4xl font-black">₹{calculatePrice()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <button onClick={() => setStep(1)} className="text-slate-400 font-bold flex items-center gap-1 hover:text-indigo-600 transition-colors">
                            <ChevronLeft size={18} /> BACK
                        </button>
                        <div className="flex flex-col items-end gap-2">
                             {availability.length < (selectedSubjects.length * 3) && (
                                 <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                                     ⚠️ Select at least {(selectedSubjects.length * 3)} slots (3 per subject)
                                 </p>
                             )}
                            <Button 
                                onClick={() => setStep(3)} 
                                disabled={selectedSubjects.length === 0 || availability.length < (selectedSubjects.length * 3)} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2"
                            >
                                NEXT: FINAL CHECK <ChevronRight size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="animate-in slide-in-from-right-4 duration-300 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="text-green-600 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Almost Done!</h2>
                    <p className="text-slate-500 max-w-md mx-auto mb-10">Please review your selections. Once you subscribe, our admin will match you with mentors within 24 hours.</p>

                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 max-w-lg mx-auto mb-10 text-left space-y-4">
                        <div className="flex justify-between border-b border-slate-200 pb-3">
                            <span className="text-slate-500">Plan Selection</span>
                            <span className="font-bold text-slate-900 capitalize">{planType} - {selectedSubjects.length} Subject{selectedSubjects.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 py-2 border-b border-slate-200">
                             {selectedSubjects.map(s => (
                                 <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold">{s}</span>
                             ))}
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-3">
                            <span className="text-slate-500">Weekly Schedule</span>
                            <span className="font-bold text-slate-900">{availability.length} Slots Marked</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-slate-900 font-bold">Total Price</span>
                            <span className="text-2xl font-black text-indigo-600">₹{calculatePrice().toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button onClick={() => setStep(2)} className="px-8 py-4 text-slate-400 font-bold hover:bg-slate-100 rounded-2xl transition-all">
                             EDIT SELECTIONS
                        </button>
                        <Button onClick={() => onComplete({ planType, subjectCount: selectedSubjects.length, subjects: selectedSubjects, amount: calculatePrice(), availability })} className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100">
                            PROCEED TO PAYMENT
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { profile, enrollments } = useSelector((state: RootState) => state.student);
  const navigate = useNavigate();

  React.useEffect(() => {
      dispatch(fetchStudentProfile());
  }, [dispatch]);

  const studentData = (profile as unknown as { data: StudentProfile })?.data || profile; 
  const studentUser = (studentData || user) as StudentData;

  // SetupWizard should ONLY show if:
  // 1. Trial is completed (user is ready to buy)
  // 2. User has NOT paid yet (needs to buy)
  // 3. Setup is not complete (implied by step flow, but main gate is payment)
  const showSetupWizard = !!(studentUser && studentUser.isTrialCompleted && !studentUser.hasPaid);

  // Locked state: Shows the blurred dashboard background + Wizard overlay
  // This is effectively the same condition as showSetupWizard
  const isLocked = showSetupWizard;

  const isProcessingPayment = !!(studentUser && studentUser.hasPaid && enrollments.length === 0);

  const handleSetupComplete = (data: SetupData) => {
    // This will navigate to payment page with wizard data
    navigate('/student/payment', { state: data });
  };

  if (isLocked) {
    return (
        <StudentLayout title="Dashboard">
            <div className="relative">
                {/* Dashboard content blurred in background */}
                <div className="opacity-20 pointer-events-none">
                    <DashboardContent isLocked={true} />
                </div>
                
                {/* Setup Wizard Overlay */}
                <div className="absolute inset-0 z-10 flex items-start justify-center pt-8">
                   <SetupWizard onComplete={handleSetupComplete} />
                </div>
            </div>
        </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Dashboard">
      <DashboardContent isLocked={false} isProcessingPayment={isProcessingPayment} />
    </StudentLayout>
  );
};

const DashboardContent: React.FC<{ isLocked: boolean; isProcessingPayment?: boolean }> = ({ isLocked, isProcessingPayment }) => (
    <div className={`w-full space-y-6 transition-all duration-500 ${isLocked ? 'blur-[1px] grayscale-[0.2] h-[600px] overflow-hidden' : ''}`}>
        {isProcessingPayment && (
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mb-6">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-3">Your dashboard will be ready soon! 🚀</h2>
                    <p className="text-indigo-100 max-w-2xl text-lg">
                        Thank you for subscribing! Our academic team is currently matching you with the best mentors for your selected subjects. 
                        This usually takes less than 24 hours. You'll receive a notification as soon as your classroom is ready.
                    </p>
                    <div className="mt-6 flex gap-4">
                        <div className="px-4 py-2 bg-white/20 rounded-xl text-sm font-bold flex items-center gap-2">
                           <Clock size={16} /> Matching in progress...
                        </div>
                    </div>
                </div>
                <div className="absolute right-[-5%] top-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <AnnouncementCard />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                   <EnrolledCourses />
                   <ProgressCard />
                </div>
                
                <AssignmentList />
            </div>

            <div className="space-y-6">
                <ScheduleList />
                <UpcomingClasses />
            </div>
        </div>
    </div>
);

export default Dashboard;
