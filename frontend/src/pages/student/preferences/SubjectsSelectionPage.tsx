import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { fetchStudentProfile } from '../../../features/student/studentThunk';
import { fetchSubjectsByGrade } from '../../../features/student/studentApi';
import StudentLayout from '../../../components/students/StudentLayout';
import { Book, Check, ChevronRight, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import type { Subject } from '../../../types/adminTypes';

const SubjectsSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { profile, loading } = useAppSelector((state) => state.student);
    
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [fetchingSubjects, setFetchingSubjects] = useState(false);

    const [saving] = useState(false);
    const maxSubjects = profile?.subscription?.subjectCount || 1;
    const isBasicPlan = 
        profile?.subscription?.planType === 'basic' || 
        profile?.subscription?.planCode === 'BASIC'; 
    const gradeField = profile?.gradeId || (profile?.academicDetails as { grade?: string | { _id?: string, id?: string } })?.grade;
    const gradeId = typeof gradeField === 'object' && gradeField !== null ? (gradeField as { _id?: string, id?: string })._id || (gradeField as { _id?: string, id?: string }).id : gradeField;
    const syllabus = (profile?.academicDetails as { syllabus?: string })?.syllabus;

    useEffect(() => {
        if (!profile && !loading) {
            dispatch(fetchStudentProfile());
        }
    }, [profile, loading, dispatch]);

    useEffect(() => {
        const getSubjects = async () => {
            if (!gradeId) return;
            try {
                setFetchingSubjects(true);
                const data = await fetchSubjectsByGrade(gradeId, syllabus);
                // API returns { success: true, data: [...], message: "..." }
                const list = data.data || data;
                setSubjects(Array.isArray(list) ? list : []);
            } catch (error) {
                console.error('Failed to fetch subjects:', error);
                toast.error('Failed to load subjects. Please refresh.');
            } finally {
                setFetchingSubjects(false);
            }
        };

        getSubjects();
    }, [gradeId, syllabus]);

    const toggleSubject = (subjectId: string) => {
        // BUG FIX: Use subjectId (which is subject.id from DTO)
        if (selectedSubjects.includes(subjectId)) {
            setSelectedSubjects(selectedSubjects.filter(id => id !== subjectId));
        } else {
            if (selectedSubjects.length >= maxSubjects) {
                toast.error(`Your plan allows only ${maxSubjects} subject${maxSubjects > 1 ? 's' : ''}.`);
                return;
            }
            setSelectedSubjects([...selectedSubjects, subjectId]);
        }
    };

    const handleNext = async () => {
        if (selectedSubjects.length === 0) {
            toast.error('Please select at least one subject.');
            return;
        }

        const selectedSubjectDetails = subjects.filter(s => selectedSubjects.includes(s.id));
        
        // Premium Flow: Subjects -> Mentors -> Time Slots
        if (!isBasicPlan) {
            navigate('/student/preferences/mentors', { state: { selectedSubjects: selectedSubjectDetails } });
        } else {
            // Basic Flow: Subjects -> Time Slots (Shifts)
            navigate('/student/preferences/time-slots', { state: { selectedSubjects: selectedSubjectDetails } });
        }
    };

    if (loading || fetchingSubjects || saving) {
        return (
            <StudentLayout title="Choose Subjects">
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="Choose Subjects">
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-indigo-50 relative overflow-hidden">
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Book className="text-indigo-600" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Select Your Subjects
                        </h1>
                        <p className="mt-4 text-lg text-slate-500">
                            Choose up to <span className="font-bold text-indigo-600">{maxSubjects}</span> subject{maxSubjects > 1 ? 's' : ''} for your regular classes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((subject) => (
                            <button
                                key={subject.id}
                                onClick={() => toggleSubject(subject.id)}
                                className={`relative p-8 rounded-[2rem] border-2 transition-all group flex flex-col items-center text-center ${
                                    selectedSubjects.includes(subject.id)
                                        ? 'border-indigo-600 bg-indigo-50 shadow-lg scale-[1.02]'
                                        : 'border-slate-50 bg-white hover:border-indigo-200 hover:shadow-md'
                                }`}
                            >
                                <div className={`p-5 rounded-2xl mb-4 transition-all duration-300 ${
                                    selectedSubjects.includes(subject.id) 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                        : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:scale-110'
                                }`}>
                                    <Book size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-1">{subject.subjectName}</h3>
                                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">{subject.syllabus}</p>
                                
                                {selectedSubjects.includes(subject.id) && (
                                    <div className="absolute top-5 right-5 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {subjects.length === 0 && !fetchingSubjects && (
                        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                            <Info size={64} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-bold text-xl">No subjects found for your grade.</p>
                            <p className="text-slate-400 text-sm mt-2">Please contact our support team for assistance.</p>
                        </div>
                    )}

                    <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                            Selected: <span className="text-indigo-600 text-xl font-black ml-2">{selectedSubjects.length} / {maxSubjects}</span>
                        </div>
                        <Button
                            onClick={handleNext}
                            disabled={selectedSubjects.length === 0 || saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-indigo-100 transform transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                        >
                            {isBasicPlan ? "CONTINUE TO SHIFTS" : "NEXT: SELECT MENTORS"}
                            <ChevronRight size={20} strokeWidth={3} />
                        </Button>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default SubjectsSelectionPage;
