
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../app/store';
import { fetchAvailableMentorsForCourse } from '../../../features/admin/adminThunk';
import type { AvailableMentorDto } from '../../../features/admin/adminThunk';
import { X, Check } from 'lucide-react';
import { adminCourseApi } from '../../../features/admin/adminApi';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';

interface CourseRequestData {
    _id: string;
    subject: string;
    grade: string;
    preferredDays: string[];
    timeSlot?: string;
    timeRange?: string;
    student: {
        _id: string;
        fullName: string;
    } | string;
}

interface FindMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: CourseRequestData | null;
    onMatchConfirmed: () => void;
}

interface MentorMatchResult {
    matches: AvailableMentorDto[];
    alternates: AvailableMentorDto[];
}

const FindMatchModal: React.FC<FindMatchModalProps> = ({ isOpen, onClose, request, onMatchConfirmed }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [mentors, setMentors] = useState<MentorMatchResult>({ matches: [], alternates: [] });
    const [loading, setLoading] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState<AvailableMentorDto | null>(null);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);

    const findMentors = useCallback(async () => {
        if (!request) return;
        setLoading(true);
        try {
            const result = await dispatch(fetchAvailableMentorsForCourse({
                subject: request.subject,
                gradeId: request.grade,
                days: request.preferredDays,
                timeSlot: request.timeSlot || request.timeRange
            })).unwrap();
            setMentors(result);
        } catch {
            toast.error("Failed to find mentors");
        } finally {
            setLoading(false);
        }
    }, [dispatch, request]);

    useEffect(() => {
        if (isOpen && request) {
            findMentors();
        }
    }, [isOpen, request, findMentors]);

    const handleCreateCourse = async () => {
        if (!selectedMentor || !request) return;
        setCreating(true);
        try {
            const studentId = typeof request.student === 'object' ? request.student._id : request.student;
            
            await adminCourseApi.createOneToOneCourse({
                gradeId: request.grade,
                subjectId: request.subject,
                mentorId: selectedMentor._id,
                studentId: studentId,
                schedule: {
                    days: selectedDays.length > 0 ? selectedDays : (request.preferredDays || []),
                    timeSlot: request.timeSlot || request.timeRange
                },
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                fee: 0,
            });

            toast.success("Course created successfully");
            onMatchConfirmed();
            onClose();
        } catch {
            toast.error("Failed to create course");
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Match Mentor</h2>
                        <p className="text-slate-500 text-sm mt-1">Assign a tutor to this course request.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="mb-6 bg-teal-50 border border-teal-100 p-5 rounded-2xl flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2">
                             <span className="px-2 py-0.5 bg-teal-500 text-white text-[10px] font-black rounded uppercase">{request?.subject}</span>
                             <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                                {typeof request?.student === 'object' ? request.student.fullName : 'Student'}
                             </span>
                        </div>
                        <p className="text-sm text-slate-700 mt-2 font-bold">
                            {request?.preferredDays?.join(', ')} at {request?.timeSlot || request?.timeRange}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500/20 border-t-teal-500 mb-4"></div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Searching experts...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Perfect Matches */}
                            <section>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                    Perfect Matches ({mentors.matches?.length || 0})
                                </h3>
                                {mentors.matches?.length === 0 ? (
                                    <div className="p-6 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 italic text-sm">No exact matches found for this time slot.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {mentors.matches?.map((mentor: AvailableMentorDto) => (
                                            <div 
                                                key={mentor._id}
                                                onClick={() => setSelectedMentor(mentor)}
                                                className={`p-4 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all duration-200 ${
                                                    selectedMentor?._id === mentor._id 
                                                        ? 'border-teal-500 bg-teal-50/50 shadow-lg shadow-teal-500/10' 
                                                        : 'border-slate-100 hover:border-slate-200 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                                        {mentor.profileImageUrl ? (
                                                            <img src={mentor.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xl uppercase italic bg-slate-50">
                                                                {mentor.fullName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800">{mentor.fullName}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className="flex text-yellow-500 text-[10px]">
                                                                {"★".repeat(Math.round(mentor.rating || 5))}
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400">({mentor.rating || '5.0'})</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedMentor?._id === mentor._id && (
                                                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center text-white">
                                                        <Check size={14} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Alternate Matches */}
                            {mentors.alternates?.length > 0 && (
                                <section>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        Alternates ({mentors.alternates.length})
                                    </h3>
                                    <div className="grid gap-3">
                                        {mentors.alternates.map((mentor: AvailableMentorDto) => (
                                            <div 
                                                key={mentor._id}
                                                onClick={() => setSelectedMentor(mentor)}
                                                className={`p-4 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all duration-200 ${
                                                    selectedMentor?._id === mentor._id 
                                                        ? 'border-slate-800 bg-slate-50 shadow-lg shadow-slate-900/10' 
                                                        : 'border-slate-100 hover:border-slate-200 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm opacity-60">
                                                        {mentor.profileImageUrl ? (
                                                            <img src={mentor.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xl italic bg-slate-50">
                                                                {mentor.fullName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-600">{mentor.fullName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Availability Shift Required</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedMentor(mentor); setShowSchedule(true); }}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-wider transition-colors"
                                                >
                                                    Check Slots
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                             {/* 3-Day Schedule Selection */}
                             {selectedMentor && (
                                 <section className="animate-in slide-in-from-top-2 duration-300">
                                     <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                         Select Exactly 3 Days for the Schedule
                                     </h3>
                                     <div className="flex flex-wrap gap-2">
                                         {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                                             const isStudentAvailable = request?.preferredDays?.includes(day);
                                             const isMentorAvailable = selectedMentor.availability?.some(a => a.day === day && a.slots.some(s => !s.isBooked));
                                             const isSelected = selectedDays.includes(day);
                                             
                                             return (
                                                 <button 
                                                     key={day}
                                                     disabled={!isMentorAvailable}
                                                     onClick={() => {
                                                         if (isSelected) setSelectedDays(selectedDays.filter(d => d !== day));
                                                         else if (selectedDays.length < 3) setSelectedDays([...selectedDays, day]);
                                                         else toast.error("Only 3 days allowed per subject");
                                                     }}
                                                     className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                                         isSelected ? 'bg-indigo-600 border-transparent text-white shadow-lg' : 
                                                         isStudentAvailable && isMentorAvailable ? 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:border-indigo-300' :
                                                         isMentorAvailable ? 'bg-slate-50 border-slate-100 text-slate-400 opacity-60' :
                                                         'bg-transparent border-slate-100 text-slate-200 cursor-not-allowed'
                                                     }`}
                                                 >
                                                     <div className="flex flex-col items-center">
                                                         <span>{day.slice(0, 3)}</span>
                                                         {isStudentAvailable && <span className="text-[8px] opacity-70">Student Choice</span>}
                                                     </div>
                                                 </button>
                                             );
                                         })}
                                     </div>
                                 </section>
                             )}
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center gap-4">
                    <div className="text-xs font-bold text-slate-400">
                        {selectedDays.length}/3 Days Selected
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                        <button 
                            onClick={handleCreateCourse}
                            disabled={!selectedMentor || creating || selectedDays.length !== 3}
                            className="px-8 py-2.5 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 transform active:scale-95 transition-all text-sm"
                        >
                            {creating ? 'Processing...' : 'Finish Slot Selection & Confirm'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Availability Preview Modal (Nested or Separate) */}
            {showSchedule && selectedMentor && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-10 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center overflow-hidden">
                                     {selectedMentor.profileImageUrl ? (
                                         <img src={selectedMentor.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                     ) : (
                                         <span className="text-white font-black text-xl">{selectedMentor.fullName.charAt(0)}</span>
                                     )}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900">{selectedMentor.fullName}'s Schedule</h3>
                            </div>
                            <button onClick={() => setShowSchedule(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-2 mb-8">
                             {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                                 <div key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">{d}</div>
                             ))}
                             {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(dayName => {
                                 const dayData = selectedMentor.availability?.find(d => d.day === dayName);
                                 return (
                                     <div key={dayName} className="space-y-1">
                                         {dayData?.slots.slice(0, 5).map((s, i) => (
                                             <div key={i} className={`h-6 rounded text-[8px] flex items-center justify-center font-bold ${s.isBooked ? 'bg-slate-50 text-slate-200' : 'bg-teal-50 text-teal-600'}`}>
                                                 {s.startTime}
                                             </div>
                                         ))}
                                     </div>
                                 );
                             })}
                        </div>

                        <Button variant="secondary" className="w-full py-4 rounded-2xl" onClick={() => setShowSchedule(false)}>
                            Got it
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindMatchModal;
