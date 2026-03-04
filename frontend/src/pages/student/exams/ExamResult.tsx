import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock } from 'lucide-react';
import StudentLayout from '../../../components/students/StudentLayout';
import { Loader } from '../../../components/ui/Loader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getStudentResults } from "../../../features/exam/examSlice";
import type { IExam } from "../../../types/examTypes";
import type { AppDispatch, RootState } from "../../../app/store";

const ExamResultPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { results, loading } = useSelector((state: RootState) => state.exam);

    useEffect(() => {
        dispatch(getStudentResults());
    }, [dispatch]);

    return (
        <StudentLayout title="My Results">
            <div className="max-w-5xl mx-auto p-6">
                <h1 className="text-3xl font-black text-slate-900 mb-8">Exam Results</h1>

                {loading ? (
                    <div className="py-20">
                        <Loader size="lg" text="Fetching your results..." />
                    </div>
                ) : results.length === 0 ? (
                    <EmptyState 
                        icon={Trophy} 
                        title="No exam results found" 
                        description="Complete your assigned exams to see your results here." 
                    />
                ) : (
                    <div className="space-y-6">
                        {results.map((result) => {
                            const exam = result.examId as unknown as IExam; // Populated
                            const percentage = (result.score / result.totalMarks) * 100;
                            const isPassed = result.score >= (exam.passingMarks || 0);

                            return (
                                <div key={result._id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8">
                                    <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 ${
                                        isPassed ? 'border-green-100 bg-green-50 text-green-600' : 'border-red-100 bg-red-50 text-red-600'
                                    }`}>
                                        <div className="text-center">
                                            <span className="text-3xl font-black block">{Math.round(percentage)}%</span>
                                            <span className="text-xs font-bold uppercase">{isPassed ? 'Passed' : 'Failed'}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{exam.title}</h3>
                                        <p className="text-slate-500 mb-4">{exam.description || 'Assessment Completed'}</p>
                                        
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium text-slate-600">
                                                <Trophy size={16} className="text-amber-500" />
                                                <span>Score: {result.score} / {result.totalMarks}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium text-slate-600">
                                                <Clock size={16} className="text-indigo-500" />
                                                <span>Completed: {new Date(result.submittedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                        {/* Future: Add 'View Analysis' button logic */}
                                        <button 
                                            onClick={() => navigate(`/student/results/${result._id}`)}
                                            className="px-6 py-3 bg-white border-2 border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 text-slate-600 font-bold rounded-xl transition-all"
                                        >
                                            View Analysis
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default ExamResultPage;
