import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { updatePreferences, findMentors, fetchMyMentorRequests } from '../../../features/student/studentApi';
import { fetchStudentProfile, requestMentor } from '../../../features/student/studentThunk';
import StudentLayout from '../../../components/students/StudentLayout';
import { 
    Users, ChevronLeft, Check, User, Info, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import MentorDetailModal from '../../../components/students/MentorDetailModal';

const MentorSelectionPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { profile } = useAppSelector((state) => state.student);
    
    // State from previous page
    const selectedSubjects = (location.state?.selectedSubjects || []) as { id: string; subjectName: string; syllabus: string }[];
    const pendingPreferences = (location.state?.preferences || []) as { subjectId: string; slots: { day: string; startTime: string; endTime: string }[] }[];

    // Local state
    const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
    const [matches, setMatches] = useState<Record<string, { matches: any[]; alternates: any[] }>>({});
    const [loading, setLoading] = useState(false);
    const [selectedMentors, setSelectedMentors] = useState<Record<string, string>>({}); // subjectId -> mentorId
    const [saving, setSaving] = useState(false);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    
    // Mentor Detail Modal
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [viewingMentor, setViewingMentor] = useState<any | null>(null);
    const [requestingMentor, setRequestingMentor] = useState(false);

    const activeSubject = selectedSubjects[activeSubjectIndex];

    useEffect(() => {
        if (!selectedSubjects.length || !pendingPreferences.length) {
            navigate('/student/preferences/time-slots');
            return;
        }

        // Fetch mentors for all subjects
        const loadData = async () => {
            setLoading(true);
            const newMatches: Record<string, any> = {};

            try {
                // 1. Fetch Candidates
                await Promise.all(selectedSubjects.map(async (subject) => {
                    const pref = pendingPreferences.find(p => p.subjectId === subject.id);
                    if (!pref) return;

                    const uniqueDays = Array.from(new Set(pref.slots.map(s => s.day)));
                    
                    let timeSlot = "";
                    if (pref.slots.length > 0) {
                        const firstSlot = pref.slots[0];
                        const start = firstSlot.startTime.slice(0, 5); // Take first 5 chars "HH:mm"
                        const end = firstSlot.endTime.slice(0, 5);     // Take first 5 chars
                        timeSlot = `${start}-${end}`;
                    }
                    
                    const result = await findMentors(subject.id, profile?.gradeId, uniqueDays, timeSlot);
                    newMatches[subject.id] = result.data;
                }));
                setMatches(newMatches);

                // 2. Fetch Requests
                const requestsResponse = await fetchMyMentorRequests();
                if (requestsResponse.success) {
                    setMyRequests(requestsResponse.data);
                }

            } catch (error) {
                console.error("Failed to fetch data", error);
                toast.error("Failed to load matching mentors");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleSelectMentor = (mentorId: string) => {
        if (!activeSubject) return;
        setSelectedMentors(prev => ({
            ...prev,
            [activeSubject.id]: prev[activeSubject.id] === mentorId ? '' : mentorId
        }));
    };

    const handleSave = async () => {
        // Filter out empty selections
        const selectedMentorIds = Object.entries(selectedMentors).filter(([_, id]) => id);

        try {
            setSaving(true);
            
            // 1. Update Time Slots (Backend saves these preferences)
            await updatePreferences(pendingPreferences);
            
            // 2. Request Mentors for selected subjects
            if (selectedMentorIds.length > 0) {
                 await Promise.all(selectedMentorIds.map(async ([subjectId, mentorId]) => {
                     // We use the thunk to handle the state updates and error handling
                     await dispatch(requestMentor({ subjectId, mentorId })).unwrap();
                 }));
            }

            toast.success('Preferences saved and mentors requested successfully!');
            await dispatch(fetchStudentProfile());
            navigate('/student/dashboard');
        } catch (error: any) {
            console.error('Failed to save preferences', error);
            toast.error(error.message || 'Failed to request mentors. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const isBasicPlan = profile?.subscription?.plan !== 'yearly';

    const openMentorDetail = async (mentor: any) => {
        if (isBasicPlan) return;
        setViewingMentor(mentor);
        setIsDetailOpen(true);
    };

    const handleRequestMentor = async () => {
        if (!viewingMentor || !activeSubject) return;
        
        setRequestingMentor(true);
        try {
            await dispatch(requestMentor({ 
                subjectId: activeSubject.id, 
                mentorId: viewingMentor._id 
            })).unwrap();
            
            // Update local state to reflect selection
            setSelectedMentors(prev => ({
                ...prev,
                [activeSubject.id]: viewingMentor._id
            }));
            
            // Refresh requests list
            const requestsResponse = await fetchMyMentorRequests();
            if (requestsResponse.success) {
                setMyRequests(requestsResponse.data);
            }
            
            toast.success('Mentor requested successfully!');
            setIsDetailOpen(false);
        } catch (error: any) {
            console.error('Failed to request mentor', error);
            toast.error(error.message || 'Failed to request mentor');
        } finally {
            setRequestingMentor(false);
        }
    };

    // Determine request status
    const getMentorRequestStatus = (mentorId: string) => {
        // Check if there is a pending request for this mentor
        const request = myRequests.find(r => r.mentorId._id === mentorId && r.subjectId._id === activeSubject.id);
        if (request) return request.status;

        // Check if current mentor matches the assigned one
        const currentPref = profile?.preferredTimeSlots?.find((slot: any) => slot.subjectId === activeSubject.id);
        if (currentPref?.assignedMentorId === mentorId && currentPref?.status === 'mentor_assigned') {
            return 'assigned';
        }
        
        return null;
    };

    if (loading) {
        return (
            <StudentLayout title="Select Your Mentors">
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </StudentLayout>
        );
    }

    const currentMatches = activeSubject ? matches[activeSubject.id] : null;

    return (
        <StudentLayout title="Select Your Mentors">
             <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-indigo-50 relative overflow-hidden">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="text-indigo-600" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Select Your Mentors</h1>
                        <p className="text-slate-500 mt-2 text-lg">Choose a preferred mentor for each subject.</p>
                    </div>

                    {/* Subject Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mb-10">
                        {selectedSubjects.map((subject, idx) => {
                            const isSelected = !!selectedMentors[subject.id];
                            const requestForSubject = myRequests.find(r => r.subjectId._id === subject.id || r.subjectId === subject.id);
                            const hasPending = requestForSubject?.status === 'pending';
                            const hasAssigned = requestForSubject?.status === 'approved';
                            
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
                                        hasAssigned ? "bg-green-500 text-white" :
                                        hasPending ? "bg-yellow-500 text-white" :
                                        isSelected ? "bg-indigo-500 text-white" : 
                                        isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                                    }`}>
                                        {hasAssigned ? <Check size={16} strokeWidth={3} /> :
                                         hasPending ? <span className="text-[10px]">WAIT</span> :
                                         isSelected ? <Check size={16} strokeWidth={3} /> : idx + 1}
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-sm font-black ${isActive ? "text-indigo-600" : "text-slate-600"}`}>
                                            {subject.subjectName}
                                        </div>
                                        {hasPending && <div className="text-[10px] text-yellow-600 font-bold uppercase">Pending Approval</div>}
                                        {hasAssigned && <div className="text-[10px] text-green-600 font-bold uppercase">Assigned</div>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Match List */}
                    {activeSubject && currentMatches && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Perfect Matches */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                    Perfect Matches
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentMatches.matches?.length > 0 ? currentMatches.matches.map((mentor: any) => {
                                        const status = getMentorRequestStatus(mentor._id);
                                        const isPending = status === 'pending';
                                        const isAssigned = status === 'assigned';
                                        const isRejected = status === 'rejected';
                                        
                                        return (
                                        <div 
                                            key={mentor._id}
                                            onClick={() => !isPending && !isAssigned && handleSelectMentor(mentor._id)}
                                            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative group ${
                                                selectedMentors[activeSubject.id] === mentor._id
                                                    ? 'border-indigo-600 bg-indigo-50 shadow-xl scale-[1.02]'
                                                    : isPending 
                                                        ? 'border-yellow-200 bg-yellow-50/50' 
                                                        : isAssigned
                                                            ? 'border-green-200 bg-green-50/50'
                                                            : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                    {mentor.profileImageUrl ? (
                                                        <img src={mentor.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-black text-slate-900 truncate">{mentor.fullName}</h4>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
                                                        {mentor.experience} Expert
                                                    </p>
                                                    
                                                    {/* Status Badges */}
                                                    {isPending && (
                                                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-lg">
                                                            Pending Approval
                                                        </div>
                                                    )}
                                                    {isAssigned && (
                                                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-lg">
                                                            Assigned Mentor
                                                        </div>
                                                    )}
                                                    
                                                    {/* About Link */}
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { 
                                                            e.preventDefault();
                                                            e.stopPropagation(); 
                                                            openMentorDetail(mentor); 
                                                        }}
                                                        className={`mt-3 flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors ${
                                                            isBasicPlan ? 'text-slate-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-700 cursor-pointer'
                                                        }`}
                                                    >
                                                        {isBasicPlan && <div className="w-2 h-2 rounded-full bg-slate-300 mr-1" />}
                                                        About Mentor
                                                        {!isBasicPlan && <Info size={14} />}
                                                    </button>
                                                </div>
                                                
                                                {selectedMentors[activeSubject.id] === mentor._id && !isPending && !isAssigned && (
                                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in">
                                                        <Check size={16} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ); }) : (
                                        <div className="col-span-full py-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 font-medium">No perfect matches found for these times.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Alternates would go here similarly */}
                        </div>
                    )}

                    <div className="pt-8 mt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <button
                            onClick={() => navigate('/student/preferences/time-slots')}
                            className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-indigo-600 transition-all group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
                            Back to Time Slots
                        </button>

                        <Button 
                            onClick={handleSave} 
                            disabled={saving} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-100 transform transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                        >
                             {saving ? 'SAVING...' : 'FINISH & SAVE'}
                            <Check size={20} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
            
            <MentorDetailModal 
                isOpen={isDetailOpen} 
                onClose={() => setIsDetailOpen(false)} 
                mentor={viewingMentor}
                onRequestMentor={handleRequestMentor}
                requestStatus={viewingMentor ? getMentorRequestStatus(viewingMentor._id) : 'none'}
                isLoadingRequest={requestingMentor}
            />
        </StudentLayout>
    );
};

export default MentorSelectionPage;
