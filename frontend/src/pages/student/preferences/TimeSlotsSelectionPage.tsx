import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { saveStudentPreferences as updatePreferences, getMentorAvailableSlots } from '../../../features/student/studentApi';
import { requestMentor, fetchStudentProfile } from '../../../features/student/studentThunk';
import StudentLayout from '../../../components/students/StudentLayout';
import { Clock, ChevronLeft, Check, Sun, Moon, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';

interface SelectedSubject {
    id: string;
    subjectName: string;
    syllabus: string;
}

interface TimeSlot {
    day: string;
    startTime: string;
    endTime: string;
}

interface SubjectPreference {
    subjectId: string;
    slots: TimeSlot[];
}

const WEEKEND_DAYS = ["Saturday", "Sunday"];
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SHIFTS = [
    { id: 'MORNING', label: 'Morning Batch', time: '9:00 AM - 1:00 PM', icon: <Sun className="w-6 h-6 text-orange-500" /> },
    { id: 'AFTERNOON', label: 'Afternoon Batch', time: '2:00 PM - 6:00 PM', icon: <Moon className="w-6 h-6 text-indigo-500" /> }
];

const TimeSlotsSelectionPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { profile, loading } = useAppSelector((state) => state.student);
    
    // State passed from navigation
    const selectedSubjects = useMemo(() => {
        let subjects = (location.state?.selectedSubjects || []) as { id: string; subjectName: string; syllabus: string }[];
        
        // Fallback Recovery (if state is missing but profile has data)
        if (subjects.length === 0 && profile?.preferredTimeSlots?.length) {
            const recoveredSubjects: SelectedSubject[] = [];
            (profile.preferredTimeSlots as { subjectId: { _id?: string, id?: string, subjectName?: string, syllabus?: string }, slots: { day: string; startTime: string; endTime: string }[] }[]).forEach((slot) => {
                if (slot.subjectId && typeof slot.subjectId === 'object' && slot.subjectId.subjectName) {
                    const subjId = slot.subjectId._id || slot.subjectId.id || '';
                    if (!recoveredSubjects.find(s => s.id === subjId)) {
                        recoveredSubjects.push({
                            id: subjId,
                            subjectName: slot.subjectId.subjectName,
                            syllabus: slot.subjectId.syllabus || 'Standard'
                        });
                    }
                }
            });
            if (recoveredSubjects.length > 0) subjects = recoveredSubjects;
        }
        return subjects;
    }, [location.state?.selectedSubjects, profile?.preferredTimeSlots]);

    const selectedMentors = useMemo(() => (location.state?.selectedMentors || {}) as Record<string, string>, [location.state?.selectedMentors]);

    // Initialize preferences state
    const [subjectPreferences, setSubjectPreferences] = useState<Record<string, TimeSlot[]>>(
        () => {
            const savedPreferences = location.state?.savedPreferences as SubjectPreference[];
            if (savedPreferences && Array.isArray(savedPreferences)) {
                return savedPreferences.reduce((acc: Record<string, TimeSlot[]>, pref) => {
                    acc[pref.subjectId] = pref.slots;
                    return acc;
                }, {});
            }
            const preferredTimeSlots = profile?.preferredTimeSlots as { subjectId: string, slots: TimeSlot[] }[];
            return Array.isArray(preferredTimeSlots) 
                ? preferredTimeSlots.reduce((acc: Record<string, TimeSlot[]>, pref) => {
                    acc[pref.subjectId] = pref.slots;
                    return acc;
                }, {})
                : {};
        }
    );
    
    const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    
    // Mentor Availability State
    const [mentorSlots, setMentorSlots] = useState<Record<string, { day: string; slots: { startTime: string; endTime: string; remainingCapacity: number }[] }[]>>({});
    const [loadingSlots, setLoadingSlots] = useState(false);

    const activeSubject = selectedSubjects[activeSubjectIndex];
    const activeAvailability = (activeSubject ? subjectPreferences[activeSubject.id] : []) || [];
    const activeMentorId = activeSubject ? selectedMentors[activeSubject.id] : null;

    React.useEffect(() => {
        if (!profile && !loading) {
            dispatch(fetchStudentProfile());
        }
    }, [profile, loading, dispatch]);

    const isPremium = 
        profile?.subscription?.planType === 'premium' || 
        profile?.subscription?.planCode === 'PREMIUM';

    const DISPLAY_DAYS = isPremium ? ALL_DAYS : WEEKEND_DAYS;

    // Redirect if missing data
    React.useEffect(() => {
        if (loading) return;
        if (!selectedSubjects.length) {
            console.warn('Redirecting from TimeSlots: Missing subjects');
            navigate('/student/preferences/subjects');
            return;
        }
        // If premium but no mentors selected, go back to mentor selection
        if (isPremium && selectedSubjects.length > 0 && Object.keys(selectedMentors).length === 0) {
             // Navigate back unless we are just recovering from refresh (which might be tricky)
             // For now, let's assume if they have no mentors selected in state, they should go back
             // But if they have saved preferences, maybe they are editing?
             // Let's rely on location.state.selectedMentors existence primarily
             if (!location.state?.selectedMentors) {
                navigate('/student/preferences/mentors', { state: { selectedSubjects } });
             }
        }
    }, [selectedSubjects, navigate, loading, isPremium, selectedMentors, location.state?.selectedMentors]);

    // Fetch Mentor Slots when active subject changes
    React.useEffect(() => {
        const fetchSlots = async () => {
            if (!activeMentorId || !isPremium) return;
            
            // If already fetched for this mentor, skip
            if (mentorSlots[activeMentorId]) return;

            try {
                setLoadingSlots(true);
                const response = await getMentorAvailableSlots(activeMentorId);
                // response.data should be array of { day, slots: [...] }
                if (response.success && response.data) {
                    setMentorSlots(prev => ({
                        ...prev,
                        [activeMentorId]: response.data
                    }));
                }
            } catch (err: unknown) {
                console.error("Failed to fetch slots for mentor", err);
                toast.error("Could not load mentor availability.");
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [activeMentorId, isPremium, mentorSlots]);

    const toggleShift = (day: string, shiftId: string, endTime?: string) => {
        if (!activeSubject) return;

        // Check for conflicts with OTHER subjects
        const otherSubjectIds = Object.keys(subjectPreferences).filter(id => id !== activeSubject.id);
        const isConflict = otherSubjectIds.some(id => 
            subjectPreferences[id]?.some(ps => ps.day === day && ps.startTime === shiftId)
        );

        if (isConflict) {
            toast.error(`You have already selected this time on ${day} for another subject.`);
            return;
        }

        const currentSlots = subjectPreferences[activeSubject.id] || [];
        const exists = currentSlots.find(s => s.day === day && s.startTime === shiftId);
        
        let newSlots;
        if (exists) {
            newSlots = currentSlots.filter(s => !(s.day === day && s.startTime === shiftId));
        } else {
             // Max limit check
            const maxSlots = (profile?.subscription as { sessionsPerSubjectPerWeek?: number } | undefined)?.sessionsPerSubjectPerWeek || 2;
            
            if (isPremium) {
                if (currentSlots.length >= maxSlots) {
                    toast.error(`You can only select up to ${maxSlots} slots per subject.`);
                    return;
                }
                newSlots = [...currentSlots, { day, startTime: shiftId, endTime: endTime || shiftId }];
            } else {
                // Basic Plan: One shift per day
                const otherShiftsOnSameDayRemoved = currentSlots.filter(s => s.day !== day);
                newSlots = [...otherShiftsOnSameDayRemoved, { day, startTime: shiftId, endTime: shiftId }];
            }
        }

        setSubjectPreferences({
            ...subjectPreferences,
            [activeSubject.id]: newSlots
        });
    };

    const handleSave = async () => {
        // Validation logic
        const maxSlots = (profile?.subscription as { sessionsPerSubjectPerWeek?: number } | undefined)?.sessionsPerSubjectPerWeek || 2;

        const invalidSubjects = selectedSubjects.filter(s => {
            const slots = subjectPreferences[s.id] || [];
            if (!isPremium) {
                if (maxSlots === 2) {
                    const hasSat = slots.some(sl => sl.day === 'Saturday');
                    const hasSun = slots.some(sl => sl.day === 'Sunday');
                    return slots.length !== 2 || !hasSat || !hasSun;
                }
                return slots.length !== maxSlots;
            }
            return slots.length < 1 || slots.length > maxSlots;
        });
        
        if (invalidSubjects.length > 0) {
            const errorMsg = isPremium 
                ? `Please select between 1 and ${maxSlots} time slots for each subject.`
                : `Please select exactly ${maxSlots} shifts (Saturday and Sunday) for each subject.`;
            toast.error(errorMsg);
            return;
        }

        // Cross-subject overlap check
        const allSlots: { subjectName: string, day: string, start: string }[] = [];
        let overlapFound = false;

        selectedSubjects.forEach(subject => {
            const slots = subjectPreferences[subject.id] || [];
            slots.forEach(slot => {
                const existing = allSlots.find(s => s.day === slot.day && s.start === slot.startTime);
                if (existing) {
                    toast.error(`Time slot ${slot.day} ${slot.startTime} is selected for both ${existing.subjectName} and ${subject.subjectName}.`);
                    overlapFound = true;
                }
                allSlots.push({ subjectName: subject.subjectName, day: slot.day, start: slot.startTime });
            });
        });

        if (overlapFound) return;

        // Prepare Payload
        const preferences = selectedSubjects.map(s => ({
            subjectId: s.id,
            slots: (subjectPreferences[s.id] || []).map(slot => ({
                day: slot.day,
                startTime: slot.startTime,
                endTime: slot.endTime
            }))
        }));

        try {
            setSaving(true);
            
            // 1. Save Preferences
            await updatePreferences({ preferences });
            
            // 2. Request Mentors (Premium only - since we skipped it in previous page)
            if (isPremium && Object.keys(selectedMentors).length > 0) {
                 await Promise.all(Object.entries(selectedMentors).map(async ([subjectId, mentorId]) => {
                     // We use the thunk to handle the state updates and error handling
                     // We need to catch errors individually to avoid breaking the whole flow
                     try {
                        await dispatch(requestMentor({ subjectId, mentorId })).unwrap();
                     } catch (err) {
                        console.error(`Failed to request mentor ${mentorId} for subject ${subjectId}`, err);
                     }
                 }));
            }

            toast.success('Preferences saved and requests sent successfully!');
            await dispatch(fetchStudentProfile());
            navigate('/student/dashboard');
        } catch (error: unknown) {
            const message = error && typeof error === 'object' && 'response' in error 
                ? ((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to save preferences')
                : (error instanceof Error ? error.message : 'Failed to save preferences');
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout title="Set Your Free Time">
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title={isPremium ? "Select Preferred Slots" : "Set Your Free Time"}>
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-indigo-50 relative overflow-hidden">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="text-indigo-600" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            {isPremium ? "Select Your Study Time" : "Set Your Free Time"}
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            {isPremium 
                                ? "Select available slots derived from your chosen mentor's schedule." 
                                : "Select exactly one shift for Saturday and Sunday."}
                        </p>
                    </div>

                    {/* Subject Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mb-10">
                        {selectedSubjects.map((subject, idx) => {
                            const slotCount = (subjectPreferences[subject.id] || []).length;
                            const isComplete = isPremium ? slotCount >= 1 : slotCount === 2;
                            const isActive = activeSubjectIndex === idx;

                            return (
                                <button
                                    key={subject.id}
                                    onClick={() => setActiveSubjectIndex(idx)}
                                    className={`px-6 py-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                        isActive 
                                            ? "border-indigo-600 bg-indigo-50 shadow-md scale-105" 
                                            : "border-slate-100 bg-white hover:border-indigo-200"
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                                        isComplete ? "bg-green-500 text-white" : isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                    }`}>
                                        {isComplete ? <Check size={16} strokeWidth={3} /> : slotCount}
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-sm font-black ${isActive ? "text-indigo-600" : "text-slate-600"}`}>
                                            {subject.subjectName}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{subject.syllabus}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {activeSubject && (
                        <div className="bg-slate-50 rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 shadow-inner">
                            <div className="mb-8 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">{activeSubject.subjectName}</h2>
                                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
                                        {isPremium ? "Pick your preferred hours" : "Pick a Morning or Afternoon Batch"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-3xl font-black ${(subjectPreferences[activeSubject.id] || []).length >= (isPremium ? 1 : 2) ? "text-green-500" : "text-amber-500"}`}>
                                        {(subjectPreferences[activeSubject.id] || []).length}
                                    </span>
                                    <span className="text-slate-400 font-bold ml-1">
                                        {isPremium ? " Slots" : "/ 2 Shifts"}
                                    </span>
                                </div>
                            </div>

                            {/* PREMIUM UI - Dynamic Mentor Slots */}
                            {isPremium ? (
                                loadingSlots ? (
                                    <div className="py-20 flex flex-col items-center justify-center">
                                         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                                         <p className="text-slate-400 font-bold">Loading mentor's availability...</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {DISPLAY_DAYS.map(day => {
                                            const dayData = activeMentorId ? mentorSlots[activeMentorId]?.find((d: { day: string }) => d.day === day) : undefined;
                                            // Ensure slots exist and are available
                                            const availableSlots = dayData?.slots || [];
                                            const hasSlots = availableSlots.length > 0;

                                            return (
                                                <div key={day} className={`bg-white p-5 rounded-3xl border transition-colors ${hasSlots ? 'border-slate-200 hover:border-indigo-200' : 'border-slate-100 opacity-60'}`}>
                                                    <h3 className="text-sm font-black mb-4 text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                                                        <Calendar size={14} />
                                                        {day}
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {hasSlots ? availableSlots.map((slot: { startTime: string; endTime: string; remainingCapacity: number }) => {
                                                            const isSelected = activeAvailability.some(s => s.day === day && s.startTime === slot.startTime);
                                                            const isFull = slot.remainingCapacity <= 0;
                                                            
                                                            // Conflict Check
                                                            const otherSubjectIds = Object.keys(subjectPreferences).filter(id => id !== activeSubject.id);
                                                            const isTakenByOther = otherSubjectIds.some(id => 
                                                                subjectPreferences[id]?.some(ps => ps.day === day && ps.startTime === slot.startTime)
                                                            );
                                                            
                                                            const disabled = isFull || isTakenByOther;

                                                            return (
                                                                <button
                                                                    key={`${day}-${slot.startTime}`}
                                                                    onClick={() => !disabled && toggleShift(day, slot.startTime, slot.endTime)}
                                                                    disabled={disabled}
                                                                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                                                                        isSelected 
                                                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                                                                            : disabled
                                                                                ? "bg-slate-100 text-slate-300 cursor-not-allowed decoration-slice line-through"
                                                                                : "bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                                                                    }`}
                                                                    title={isFull ? "No seats left" : isTakenByOther ? "Already selected for another subject" : `${slot.remainingCapacity} seats left`}
                                                                >
                                                                    {slot.startTime} 
                                                                </button>
                                                            );
                                                        }) : (
                                                            <div className="col-span-2 text-center py-4">
                                                                <p className="text-[10px] text-slate-300 font-bold uppercase">No Slots</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : (
                                /* BASIC PLAN UI - Sat/Sun Shifts - UNCHANGED */
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {WEEKEND_DAYS.map(day => (
                                        <div key={day} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                            <h3 className="text-xl font-black mb-6 text-indigo-600 tracking-tight uppercase">{day}</h3>
                                            <div className="flex flex-col gap-4">
                                                {SHIFTS.map(shift => {
                                                    const isSelected = activeAvailability.some(s => s.day === day && s.startTime === shift.id);
                                                    
                                                    const otherSubjectIds = Object.keys(subjectPreferences).filter(id => id !== activeSubject.id);
                                                    const isTakenByOther = otherSubjectIds.some(id => 
                                                        subjectPreferences[id]?.some(ps => ps.day === day && ps.startTime === shift.id)
                                                    );

                                                    return (
                                                        <button
                                                            key={`${day}-${shift.id}`}
                                                            onClick={() => toggleShift(day, shift.id, shift.id)}
                                                            className={`relative overflow-hidden p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                                                                isSelected 
                                                                    ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-600/30" 
                                                                    : isTakenByOther
                                                                        ? "bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed"
                                                                        : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                                                            }`}
                                                            disabled={isTakenByOther}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`text-2xl ${isSelected ? 'animate-bounce' : ''}`}>
                                                                    {shift.icon}
                                                                </div>
                                                                <div className="text-left">
                                                                    <div className={`font-black text-lg ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                                                        {shift.label}
                                                                    </div>
                                                                    <div className={`text-xs font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                                        {shift.time}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="bg-white text-indigo-600 p-1.5 rounded-full shadow-lg">
                                                                    <Check size={16} strokeWidth={4} />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <button
                            onClick={() => navigate(isPremium ? '/student/preferences/mentors' : '/student/preferences/subjects', {
                                state: {
                                    selectedSubjects,
                                    selectedMentors
                                }
                            })}
                            className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-indigo-600 transition-all group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
                            {isPremium ? "Back to Mentors" : "Back to Subjects"}
                        </button>

                        <div className="flex flex-col items-center sm:items-end gap-3">
                            <Button 
                                onClick={handleSave} 
                                disabled={saving} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-100 transform transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                            >
                                {saving ? 'SAVING...' : (isPremium ? 'FINISH & REQUEST MENTORS' : 'SAVE ALL PREFERENCES')}
                                {!saving && <Check size={20} strokeWidth={3} />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default TimeSlotsSelectionPage;
