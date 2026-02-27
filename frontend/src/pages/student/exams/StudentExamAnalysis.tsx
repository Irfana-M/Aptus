import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentResults, getExamById } from '../../../features/exam/examSlice';
import type { AppDispatch, RootState } from '../../../app/store';
import { ChevronLeft, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import StudentLayout from '../../../components/students/StudentLayout';
import { QuestionType } from '../../../types/examTypes';

const StudentExamAnalysis: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { resultId } = useParams<{ resultId: string }>();
    
    const { results, currentExam, loading } = useSelector((state: RootState) => state.exam);
    const result = results.find(r => r._id === resultId);

    useEffect(() => {
        if (import.meta.env.MODE !== 'test') { // Avoid double fetch in test
             dispatch(getStudentResults());
        }
    }, [dispatch]);

    useEffect(() => {
        const examId = typeof result?.examId === 'object' ? result.examId._id : result?.examId;
        if (result && examId && (!currentExam || currentExam._id !== examId)) {
            dispatch(getExamById(examId));
        }
    }, [dispatch, result, currentExam]);

    if (loading || !result || !currentExam) {
        return (
            <StudentLayout title="Exam Analysis">
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </StudentLayout>
        );
    }

    const examTitle = (result.examId as unknown as { title: string }).title || currentExam.title;

    return (
        <StudentLayout title="Exam Analysis">
            <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
                 {/* Header */}
                 <div className="flex items-center gap-4 mb-8">
                    <button 
                        onClick={() => navigate('/results')}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{examTitle} - Analysis</h1>
                        <p className="text-slate-500">
                            Score: <span className="font-bold text-indigo-600">{result.score}</span> / {result.totalMarks}
                        </p>
                    </div>
                </div>

                {currentExam.questions.map((question, index) => {
                    const answer = result.answers.find(a => a.questionId === question._id);
                    const marksObtained = answer?.marksObtained || 0;
                    const feedback = answer?.feedback;

                    return (
                        <div key={question._id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                             <div className="flex justify-between items-start mb-6">
                                <h3 className="text-lg font-bold text-slate-900 flex-1">
                                    <span className="text-slate-400 mr-2">Q{index + 1}.</span>
                                    {question.text}
                                </h3>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        marksObtained > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {marksObtained} / {question.marks} Marks
                                    </span>
                                </div>
                            </div>

                            {/* Answer Section */}
                            <div className="bg-slate-50 rounded-xl p-6 mb-4">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Your Answer</p>
                                {question.type === QuestionType.MCQ ? (
                                    <div className="space-y-3">
                                         {question.options?.map((opt, i) => {
                                            const isSelected = answer?.selectedOptionId === opt._id || answer?.selectedOptionText === opt.text;
                                            const isCorrect = opt.isCorrect;
                                            
                                            let className = "p-4 rounded-xl border-2 flex justify-between items-center transition-all ";
                                            
                                            if (isSelected && isCorrect) className += "bg-green-50 border-green-200 text-green-700";
                                            else if (isSelected && !isCorrect) className += "bg-red-50 border-red-200 text-red-700";
                                            else if (isCorrect) className += "bg-white border-green-200 border-dashed text-green-600";
                                            else className += "bg-white border-slate-100 text-slate-500 opacity-60";

                                            return (
                                                <div key={i} className={className}>
                                                    <span className="font-medium">{opt.text}</span>
                                                    {isSelected && isCorrect && <CheckCircle size={20} />}
                                                    {isSelected && !isCorrect && <XCircle size={20} />}
                                                    {!isSelected && isCorrect && <span className="text-xs font-bold px-2 py-1 bg-green-100 rounded-lg">Correct Answer</span>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {answer?.textAnswer || <span className="text-slate-400 italic">No answer provided.</span>}
                                    </p>
                                )}
                            </div>

                            {/* Feedback Section */}
                            {feedback && (
                                <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 flex gap-4">
                                    <MessageCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                                    <div>
                                        <h4 className="font-bold text-amber-800 text-sm mb-1">Mentor Feedback</h4>
                                        <p className="text-amber-700 text-sm leading-relaxed">{feedback}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </StudentLayout>
    );
};

export default StudentExamAnalysis;
