import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.constants';
import { FileText, Clock, Award, ArrowRight, ArrowLeft, GraduationCap, Info } from 'lucide-react';
import StudentLayout from '../../../components/students/StudentLayout';
import { Loader } from '../../../components/ui/Loader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getExamsForStudent } from "../../../features/exam/examSlice";
import type { IEnrichedExam } from "../../../types/examTypes";
import type { AppDispatch, RootState } from "../../../app/store";

const StudentExamList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { exams, loading } = useSelector((state: RootState) => ({
        exams: state.exam.exams as unknown as IEnrichedExam[],
        loading: state.exam.loading
    }));

    const { profile } = useSelector((state: RootState) => state.student);
    const isPremium = profile?.subscription?.status === 'active'; 
    
    const [activeTab, setActiveTab] = React.useState<'available' | 'history'>('available');

    useEffect(() => {
        dispatch(getExamsForStudent());
    }, [dispatch]);

    useEffect(() => {
        console.log("StudentExamList - Exams:", exams);
    }, [exams]);

    const handleTakeExam = (examId: string, isPremiumExam: boolean) => {
        if (isPremiumExam && !isPremium) {
            
            navigate(ROUTES.STUDENT.SUBSCRIPTION_PLANS); 
            return;
        }
        navigate(`/student/exam/${examId}/take`);
    };

   

    return (
        <StudentLayout title="My Exams">
            <div className="max-w-6xl mx-auto p-6">
                <button 
                    onClick={() => navigate(ROUTES.STUDENT.DASHBOARD)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900">Exams & Assessments</h1>
                    <p className="text-slate-500 mt-1">Test your knowledge and track your progress across all your subjects.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-200 mb-8">
                    <button
                        onClick={() => setActiveTab('available')}
                        className={`pb-3 px-1 text-sm font-bold transition-all relative ${
                            activeTab === 'available' 
                            ? 'text-indigo-600' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Available Exams
                        {activeTab === 'available' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 px-1 text-sm font-bold transition-all relative ${
                            activeTab === 'history' 
                            ? 'text-indigo-600' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Exam History
                        {activeTab === 'history' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
                        )}
                    </button>
                </div>

                {loading ? (
                    <div className="py-20">
                        <Loader size="lg" text="Loading your exams..." />
                    </div>
                ) : (
                    <>
                        {activeTab === 'available' && (
                            exams.filter(e => !(e as IEnrichedExam).attemptStatus).length === 0 ? (
                                <EmptyState 
                                    icon={FileText} 
                                    title="No New Exams" 
                                    description="You have completed all assigned exams or none are available." 
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {exams.filter(e => !(e as IEnrichedExam).attemptStatus).map((exam) => (
                                        <div key={exam._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all relative overflow-hidden">
                                            {/* Exam Card Content - Same as before but filtered */}
                                            {exam.isPremium && (
                                                <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                                    <Award size={14} /> Premium
                                                </div>
                                            )}
                                            
                                            <div className="mb-4 mt-2">
                                                <h3 className="text-xl font-bold text-slate-800 line-clamp-2">{exam.title}</h3>
                                                <p className="text-slate-500 text-sm mt-1 whitespace-pre-line">{exam.description || 'No description provided.'}</p>
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={16} className="text-indigo-500" />
                                                        <span>Duration</span>
                                                    </div>
                                                    <span className="font-bold">{exam.duration} mins</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Award size={16} className="text-indigo-500" />
                                                        <span>Total Marks</span>
                                                    </div>
                                                    <span className="font-bold">{exam.totalMarks}</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    // Debug log on click
                                                    console.log("Clicked exam:", exam);
                                                    if ((exam as IEnrichedExam).resultId) {
                                                        navigate(`/student/results/${(exam as IEnrichedExam).resultId}`);
                                                    } else {
                                                        handleTakeExam(exam._id, !!exam.isPremium);
                                                    }
                                                }}
                                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                                                    [(exam as IEnrichedExam).attemptStatus].includes('COMPLETED') || [(exam as IEnrichedExam).attemptStatus].includes('PENDING_REVIEW')
                                                     ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                     : exam.isPremium && !isPremium 
                                                         ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                                         : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                }`}
                                            >
                                                {exam.attemptStatus === 'COMPLETED' ? (
                                                    <>View Results <Award size={18} /></>
                                                ) : exam.attemptStatus === 'PENDING_REVIEW' ? (
                                                    <>Analysis (Matches Pending) <Clock size={18} /></>
                                                ) : exam.isPremium && !isPremium ? (
                                                    <>Upgrade to Access</>
                                                ) : (
                                                    <>Start Exam <ArrowRight size={18} /></>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}

                        {activeTab === 'history' && (
                            exams.filter(e => (e as IEnrichedExam).attemptStatus).length === 0 ? (
                                <EmptyState 
                                    icon={GraduationCap} 
                                    title="No Exam History" 
                                    description="You haven't attempted any exams yet." 
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {exams.filter(e => (e as IEnrichedExam).attemptStatus).map((exam) => (
                                        <div key={exam._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all relative overflow-hidden opacity-90">
                                            <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                                {(exam as IEnrichedExam).attemptStatus === 'PENDING_REVIEW' ? 'Reviewed Pending' : 'Completed'}
                                            </div>
                                            
                                            <div className="mb-4 mt-2">
                                                <h3 className="text-xl font-bold text-slate-800 line-clamp-2">{exam.title}</h3>
                                                <p className="text-slate-500 text-sm mt-1 whitespace-pre-line">{exam.description || 'No description provided.'}</p>
                                            </div>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={16} className="text-indigo-500" />
                                                        <span>Duration</span>
                                                    </div>
                                                    <span className="font-bold">{exam.duration} mins</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <Award size={16} className="text-indigo-500" />
                                                        <span>Total Marks</span>
                                                    </div>
                                                    <span className="font-bold">{exam.totalMarks}</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => navigate(`/student/results/${(exam as IEnrichedExam).resultId}`)}
                                                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                {(exam as IEnrichedExam).attemptStatus === 'PENDING_REVIEW' ? (
                                                    <>Analysis (Matches Pending) <Clock size={18} /></>
                                                ) : (
                                                    <>View Results <Award size={18} /></>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentExamList;
