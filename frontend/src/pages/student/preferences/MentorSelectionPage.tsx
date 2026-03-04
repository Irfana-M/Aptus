import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/hooks';
import { findMentors, fetchMyMentorRequests, fetchMentorDetails } from '../../../features/student/studentApi';
import StudentLayout from '../../../components/students/StudentLayout';
import { 
    Users, ChevronLeft, Check, User, Info, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { Loader } from '../../../components/ui/Loader';
import MentorDetailModal from '../../../components/students/MentorDetailModal';
import type { MentorProfile } from '../../../features/mentor/mentorSlice';
import { ROUTES } from '../../../constants/routes.constants';

interface SelectedSubject {
    id: string;
    subjectName: string;
    syllabus: string;
}

interface SubjectPreference {
    subjectId: string;
    slots: { day: string; startTime: string; endTime: string }[];
}

interface MentorMatch {
    matches: MentorProfile[];
    alternates: MentorProfile[];
}

const MentorSelectionPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, loading: profileLoading } = useAppSelector((state) => state.student);

    // Memoize selected subjects and preferences to prevent effect re-runs
    const { selectedSubjects, pendingPreferences } = useMemo(() => {
        let subjects = (location.state?.selectedSubjects || []) as SelectedSubject[];
        let preferences = (location.state?.preferences || []) as SubjectPreference[];

        // Fallback Recovery (if state is missing but profile has data)
        if (subjects.length === 0 && profile?.preferredTimeSlots?.length) {
            const recoveredSubjects: SelectedSubject[] = [];
            const recoveredPreferences: SubjectPreference[] = [];

            (profile.preferredTimeSlots as { subjectId: { _id?: string, id?: string, subjectName?: string, syllabus?: string }, slots: { day: string; startTime: string; endTime: string }[] }[]).forEach((slot) => {
                // ensure subjectId is populated object
                if (slot.subjectId && typeof slot.subjectId === 'object' && slot.subjectId.subjectName) {
                    const subjId = slot.subjectId._id || slot.subjectId.id || '';
                    // Avoid duplicates
                    if (!recoveredSubjects.find(s => s.id === subjId)) {
                        recoveredSubjects.push({
                            id: subjId,
                            subjectName: slot.subjectId.subjectName,
                            syllabus: slot.subjectId.syllabus || 'Standard'
                        });
                    }
                    if (!recoveredPreferences.find(p => p.subjectId === subjId)) {
                        recoveredPreferences.push({
                            subjectId: subjId,
                            slots: slot.slots || []
                        });
                    }
                }
            });

            if (recoveredSubjects.length > 0) {
                subjects = recoveredSubjects;
                preferences = recoveredPreferences;
            }
        }
        return { selectedSubjects: subjects, pendingPreferences: preferences };
    }, [location.state?.selectedSubjects, location.state?.preferences, profile?.preferredTimeSlots]);

    // Local state
    const [activeSubjectIndex, setActiveSubjectIndex] = useState(0);
    const [matches, setMatches] = useState<Record<string, MentorMatch>>({});
    const [localLoading, setLocalLoading] = useState(false);
    const [selectedMentors, setSelectedMentors] = useState<Record<string, string>>({}); // subjectId -> mentorId
    const [myRequests, setMyRequests] = useState<{ mentorId?: { _id: string }, subjectId?: { _id: string }, status: string }[]>([]);
    
    // Mentor Detail Modal
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [viewingMentor, setViewingMentor] = useState<MentorProfile | null>(null);
    
    const activeSubject = selectedSubjects[activeSubjectIndex];
    
    useEffect(() => {
        // Wait for profile to load before making redirect decisions
        if (profileLoading) return;

        if (!selectedSubjects.length) {
            console.warn('Redirecting from MentorSelection: Missing subjects');
            navigate(ROUTES.STUDENT.PREFERENCES.SUBJECTS);
            return;
        }

        // Fetch mentors for all subjects
        const loadData = async () => {
            setLocalLoading(true);
            const newMatches: Record<string, MentorMatch> = {};

            try {
                // 1. Fetch Candidates (No time constraints for Premium flow)
                await Promise.all(selectedSubjects.map(async (subject: SelectedSubject) => {
                    // For mentor-first flow, we don't have slots yet, so we pass undefined for days/timeSlot
                    const result = await findMentors(subject.id, profile?.gradeId);
                    newMatches[subject.id] = result.data as MentorMatch;
                }));
                setMatches(newMatches);

                // 2. Fetch Requests
                const requestsResponse = await fetchMyMentorRequests();
                if (requestsResponse.success) {
                    setMyRequests(requestsResponse.data.map(r => ({
                        _id: r._id,
                        mentorId: r.mentorId,
                        subjectId: r.subjectId,
                        status: r.status
                    })));
                }

            } catch (error: unknown) {
                const message = error && typeof error === 'object' && 'response' in error 
                    ? ((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to load matching mentors')
                    : (error instanceof Error ? error.message : 'Failed to load matching mentors');
                toast.error(message);
            } finally {
                setLocalLoading(false);
            }
        };

        loadData();
    }, [profileLoading, selectedSubjects, navigate, profile?.gradeId]);

    const handleSelectMentor = (mentorId: string) => {
        if (!activeSubject) return;
        setSelectedMentors(prev => ({
            ...prev,
            [activeSubject.id]: prev[activeSubject.id] === mentorId ? '' : mentorId
        }));
    };

    const handleNext = () => {
        // Validate that a mentor is selected for each subject
        const missingSubjects = selectedSubjects.filter((s: SelectedSubject) => !selectedMentors[s.id]);
        
        if (missingSubjects.length > 0) {
            toast.error(`Please select a mentor for: ${missingSubjects.map((s: SelectedSubject) => s.subjectName).join(', ')}`);
            return;
        }

        navigate(ROUTES.STUDENT.PREFERENCES.TIME_SLOTS, { 
            state: { 
                selectedSubjects,
                selectedMentors // Pass selected mentors to the next page
            } 
        });
    };

    const isBasicPlan = 
        profile?.subscription?.planType === 'basic' || 
        profile?.subscription?.planCode === 'BASIC';

    useEffect(() => {
        if (isBasicPlan && profile) {
            console.log('🛡️ Basic plan detected, redirecting from mentor selection');
            navigate(ROUTES.STUDENT.DASHBOARD);
        }
    }, [isBasicPlan, profile, navigate]);

    const openMentorDetail = async (mentor: MentorProfile) => {
        if (isBasicPlan) return;
        setViewingMentor(mentor);
        setIsDetailOpen(true);
        
        // Fetch full details (includes reviews/feedback)
        try {
            const data = await fetchMentorDetails(mentor._id);
            setViewingMentor(data.data as unknown as MentorProfile);
        } catch (error) {
            console.error("Error fetching mentor details:", error);
        }
    };

    const handleMentorToggle = () => {
        if (!viewingMentor || !activeSubject) return;
        
        const mentorId = viewingMentor._id;
        setSelectedMentors(prev => ({
            ...prev,
            [activeSubject.id]: prev[activeSubject.id] === mentorId ? '' : mentorId
        }));
        
        setIsDetailOpen(false);
    };

    // Determine request status
    const getMentorRequestStatus = (mentorId: string): "pending" | "rejected" | "assigned" | "none" => {
        // Check if there is a pending request for this mentor
        const request = myRequests.find(r => r.mentorId?._id === mentorId && r.subjectId?._id === activeSubject?.id);
        if (request) return request.status as "pending" | "rejected" | "assigned" | "none";

        // Check if current mentor matches the assigned one
        const currentPref = (profile?.preferredTimeSlots as { subjectId: string, assignedMentorId: string, status: string }[])?.find(slot => slot.subjectId === activeSubject?.id);
        if (currentPref?.assignedMentorId === mentorId && currentPref?.status === 'mentor_assigned') {
            return 'assigned';
        }
        
        return "none";
    };

    if (localLoading || (profileLoading && !selectedSubjects.length)) {
        return (
            <StudentLayout title="Select Your Mentors">
                <div className="min-h-[60vh]">
                    <Loader size="lg" text="Finding the best mentors for you..." />
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
                        {selectedSubjects.map((subject: SelectedSubject, idx: number) => {
                            const isSelected = !!selectedMentors[subject.id];
                            const requestForSubject = myRequests.find(r => (r.subjectId?._id || r.subjectId) === subject.id);
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
                                    {currentMatches.matches?.length > 0 ? currentMatches.matches.map((mentor: MentorProfile) => {
                                        const status = getMentorRequestStatus(mentor._id);
                                        const isPending = status === 'pending';
                                        const isAssigned = status === 'assigned';
                                        
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
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    size={10} 
                                                                    className={i < Math.floor(mentor.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} 
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            ({mentor.rating || 0})
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
                                                        {mentor.experiences && mentor.experiences.length 
                                                            ? `${mentor.experiences.reduce((acc: number, curr: { duration: string }) => acc + (parseInt(curr.duration) || 0), 0)}+ Years Experience`
                                                            : "Experienced Expert"}
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
                                    );
                                    }) : (
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
                            onClick={() => navigate(ROUTES.STUDENT.PREFERENCES.TIME_SLOTS, { 
                                state: { 
                                    selectedSubjects, 
                                    savedPreferences: pendingPreferences // Pass back as savedPreferences to restore state
                                } 
                            })}
                            className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-indigo-600 transition-all group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
                            Back to Time Slots
                        </button>

                        <Button 
                            onClick={handleNext} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-100 transform transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                        >
                             NEXT: CHOOSE TIME SLOTS
                            <Check size={20} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
            
            <MentorDetailModal 
                isOpen={isDetailOpen} 
                onClose={() => setIsDetailOpen(false)} 
                mentor={viewingMentor}
                onRequestMentor={handleMentorToggle}
                requestStatus={viewingMentor ? getMentorRequestStatus(viewingMentor._id) : 'none'}
                isLoadingRequest={false}
                isReviewMode={true}
                isSelected={viewingMentor && activeSubject ? selectedMentors[activeSubject.id] === viewingMentor._id : false}
            />
        </StudentLayout>
    );
};

export default MentorSelectionPage;
