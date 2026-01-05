import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { updatePreferences } from '../../../features/student/studentApi';
import { fetchStudentProfile } from '../../../features/student/studentThunk';
import StudentLayout from '../../../components/students/StudentLayout';
import { Clock, BookOpen, ChevronLeft, Check, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = [
    "08:00 AM - 09:00 AM", "09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM", "01:00 PM - 02:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM", "05:00 PM - 06:00 PM", "06:00 PM - 07:00 PM", "07:00 PM - 08:00 PM",
    "08:00 PM - 09:00 PM"
];

const TimeSlotsSelectionPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { profile, loading } = useAppSelector((state) => state.student);
    const selectedSubjects = (location.state?.selectedSubjects || []) as { id: string; subjectName: string; syllabus: string }[];

    // Group availability by subjectId
    const [subjectPreferences, setSubjectPreferences] = useState<Record<string, { day: string; startTime: string; endTime: string }[]>>(
        // Initialize from profile if available, otherwise empty objects
        Array.isArray(profile?.preferredTimeSlots) 
            ? profile.preferredTimeSlots.reduce((acc: any, pref: any) => {
                acc[pref.subjectId] = pref.slots;
                return acc;
            }, {})
            : {}
    );
    
    const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
    const [saving, setSaving] = useState(false);

    const activeSubject = selectedSubjects[activeSubjectIndex];
    const activeAvailability = (activeSubject ? subjectPreferences[activeSubject.id] : []) || [];

    React.useEffect(() => {
        if (!selectedSubjects.length) {
            navigate('/student/preferences/subjects');
        }
    }, [selectedSubjects, navigate]);

    const toggleSlot = (day: string, time: string) => {
        if (!activeSubject) return;

        const [start, end] = time.split(' - ');
        const currentSlots = subjectPreferences[activeSubject.id] || [];
        const exists = currentSlots.find(s => s.day === day && s.startTime === start);
        
        let newSlots;
        if (exists) {
            newSlots = currentSlots.filter(s => !(s.day === day && s.startTime === start));
        } else {
            newSlots = [...currentSlots, { day, startTime: start, endTime: end }];
        }

        setSubjectPreferences({
            ...subjectPreferences,
            [activeSubject.id]: newSlots
        });
    };

    const convertTo24Hour = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        
        if (period === 'PM' && hours !== '12') {
            hours = String(parseInt(hours) + 12);
        } else if (period === 'AM' && hours === '12') {
            hours = '00';
        }
        
        return `${hours}:${minutes}`;
    };

    const handleSave = async () => {
        const invalidSubjects = selectedSubjects.filter(s => (subjectPreferences[s.id] || []).length < 3);
        
        if (invalidSubjects.length > 0) {
            toast.error(`Please select at least 3 slots for each subject. Check: ${invalidSubjects.map(s => s.subjectName).join(', ')}`);
            return;
        }

        // Convert the times to 24h format for consistent storage
        const preferences = selectedSubjects.map(s => ({
            subjectId: s.id,
            slots: (subjectPreferences[s.id] || []).map(slot => ({
                day: slot.day,
                startTime: convertTo24Hour(slot.startTime),
                endTime: convertTo24Hour(slot.endTime)
            }))
        }));



        // Premium Flow: Redirect to Mentor Selection
        if (profile?.subscription?.plan === 'yearly') {
            navigate('/student/preferences/mentors', { 
                state: { 
                    selectedSubjects, 
                    preferences 
                } 
            });
            return;
        }

        try {
            setSaving(true);
            await updatePreferences(preferences);
            toast.success('Preferences saved successfully!');
            await dispatch(fetchStudentProfile());
            navigate('/student/dashboard');
        } catch (error: any) {
            console.error('Failed to save preferences', error);
            toast.error(error.response?.data?.message || 'Failed to save preferences. Please try again.');
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
        <StudentLayout title="Set Your Free Time">
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-indigo-50 relative overflow-hidden">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="text-indigo-600" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Set Your Free Time</h1>
                        <p className="text-slate-500 mt-2 text-lg">Assign at least 3 preferred time slots for each subject.</p>
                    </div>

                    {/* Subject Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mb-10">
                        {selectedSubjects.map((subject, idx) => {
                            const slotCount = (subjectPreferences[subject.id] || []).length;
                            const isComplete = slotCount >= 3;
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
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-x-auto shadow-2xl relative mb-10 ring-1 ring-white/10">
                            <div className="mb-6 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                        <BookOpen className="text-indigo-400" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">{activeSubject.subjectName}</h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Select 3+ classes for this subject</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-3xl font-black ${(subjectPreferences[activeSubject.id] || []).length >= 3 ? "text-green-400" : "text-indigo-400"}`}>
                                        {(subjectPreferences[activeSubject.id] || []).length}
                                    </span>
                                    <span className="text-slate-500 font-black ml-1">/ 3+</span>
                                </div>
                            </div>

                            <div className="min-w-[700px]">
                                <div className="grid grid-cols-8 gap-3 mb-6">
                                    <div />
                                    {DAYS.map(d => (
                                        <div key={d} className="text-[12px] font-black text-center text-slate-500 uppercase tracking-[0.2em]">
                                            {d.slice(0, 3)}
                                        </div>
                                    ))}
                                </div>
                                {HOURS.map(h => (
                                    <div key={h} className="grid grid-cols-8 gap-3 mb-3">
                                        <div className="text-[10px] font-black text-slate-500 uppercase flex items-center h-10">
                                            {h.split(' - ')[0]}
                                        </div>
                                        {DAYS.map(day => {
                                            const [startTime] = h.split(' - ');
                                            const isSelected = activeAvailability.some(s => s.day === day && s.startTime === startTime);
                                            return (
                                                <button 
                                                    key={day}
                                                    onClick={() => toggleSlot(day, h)}
                                                    className={`h-10 rounded-xl border-2 transition-all cursor-pointer relative group/slot ${
                                                        isSelected 
                                                            ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/20 ring-offset-2 ring-offset-slate-900 scale-105 z-10" 
                                                            : "bg-white/5 border-transparent hover:border-white/20 hover:bg-white/10"
                                                    }`}
                                                >
                                                    {isSelected && <Check size={14} className="mx-auto text-white" strokeWidth={4} />}
                                                    {!isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                                            <PlusIcon className="w-4 h-4 text-white/30" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <button
                            onClick={() => navigate('/student/preferences/subjects')}
                            className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-indigo-600 transition-all group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
                            Back to Subjects
                        </button>

                        <div className="flex flex-col items-center sm:items-end gap-3">
                            {selectedSubjects.some(s => (subjectPreferences[s.id] || []).length < 3) && (
                                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest">
                                    ⚠️ Some subjects need more slots (3 per subject)
                                </p>
                            )}
                            <Button 
                                onClick={handleSave} 
                                disabled={saving || selectedSubjects.some(s => (subjectPreferences[s.id] || []).length < 3)} 
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-100 transform transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        SAVING...
                                    </>
                                ) : (
                                    <>
                                        {profile?.subscription?.plan === 'yearly' ? 'NEXT: SELECT MENTORS' : 'SAVE ALL PREFERENCES'}
                                        <ChevronRight size={20} strokeWidth={3} />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
    </svg>
);

export default TimeSlotsSelectionPage;
