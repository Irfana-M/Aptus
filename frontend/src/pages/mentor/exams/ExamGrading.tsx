import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamResults, getExamById, gradeExam } from '../../../features/exam/examSlice';
import type { AppDispatch, RootState } from '../../../app/store';
import { ChevronLeft, Save, CheckCircle, XCircle } from 'lucide-react';
import { QuestionType } from '../../../types/examTypes';
import toast from 'react-hot-toast';

const ExamGrading: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { examId, resultId } = useParams<{ examId: string; resultId: string }>();
    
    const { results, currentExam, loading } = useSelector((state: RootState) => state.exam);
    
    // Local state for grading changes
    const [grades, setGrades] = useState<Record<string, { marks: number; feedback: string }>>({});

    useEffect(() => {
        if (examId) {
            if (!currentExam || currentExam._id !== examId) {
                dispatch(getExamById(examId));
            }
            if (results.length === 0 || !results.find(r => r._id === resultId)) {
                dispatch(getExamResults(examId));
            }
        }
    }, [dispatch, examId, resultId, currentExam, results]);

    const result = results.find(r => r._id === resultId);

    // Initialize grades state from result when loaded
    useEffect(() => {
        if (result && currentExam) {
            const initialGrades: Record<string, { marks: number; feedback: string }> = {};
            result.answers.forEach(ans => {
                const qId = ans.questionId.toString();
                initialGrades[qId] = {
                    marks: ans.marksObtained,
                    feedback: ans.feedback || ''
                };
            });
            setGrades(initialGrades);
        }
    }, [result, currentExam]);

    if (loading || !result || !currentExam) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    const handleGradeChange = (questionId: string, field: 'marks' | 'feedback', value: number | string) => {
        setGrades(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        if (!resultId) return;

        const gradesArray = Object.entries(grades).map(([questionId, data]) => ({
            questionId,
            marks: Number(data.marks),
            feedback: data.feedback
        }));

        console.log("📤 Submitting grades:", gradesArray);

        const action = await dispatch(gradeExam({ resultId, grades: gradesArray }));
        
        if (gradeExam.fulfilled.match(action)) {
            toast.success("Grading saved successfully!");
            navigate(`/mentor/exams/${examId}/results`);
        } else {
            toast.error("Failed to save grading.");
        }
    };

    // Calculate total on the fly
    const currentTotalScore = Object.values(grades).reduce((sum, g) => sum + (Number(g.marks) || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(`/mentor/exams/${examId}/results`)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Grading: {(result.studentId as unknown as { fullName: string }).fullName || 'Student'}</h1>
                            <p className="text-sm text-gray-500">{currentExam.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Current Score</p>
                            <p className="text-2xl font-bold text-cyan-600">{currentTotalScore} <span className="text-gray-400 text-lg">/ {currentExam.totalMarks}</span></p>
                        </div>
                        <button 
                            onClick={handleSave}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold shadow-sm transition-all"
                        >
                            <Save size={20} />
                            Save & Publish
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 space-y-8">
                {currentExam.questions.map((question, index) => {
                    const answer = result.answers.find(a => a.questionId === question._id);
                    const grade = grades[question._id!] || { marks: 0, feedback: '' };
                    const isMCQ = question.type === QuestionType.MCQ;

                    return (
                        <div key={question._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <span className="font-bold text-gray-700">Question {index + 1}</span>
                                <span className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                                    Max Marks: {question.marks}
                                </span>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left: Question & Answer */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">{question.text}</h3>
                                    
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Student Answer</p>
                                        {isMCQ ? (
                                            <div className="space-y-2">
                                                {question.options?.map((opt, i) => {
                                                    const isSelected = answer?.selectedOptionId === opt._id || answer?.selectedOptionText === opt.text;
                                                    const isCorrect = opt.isCorrect;
                                                    let className = "p-3 rounded-lg border flex justify-between items-center ";
                                                    
                                                    if (isSelected && isCorrect) className += "bg-green-50 border-green-200 text-green-700";
                                                    else if (isSelected && !isCorrect) className += "bg-red-50 border-red-200 text-red-700";
                                                    else if (isCorrect) className += "bg-green-50 border-green-200 border-dashed text-green-700 opacity-70";
                                                    else className += "border-gray-200 text-gray-500 opacity-50";

                                                    return (
                                                        <div key={i} className={className}>
                                                            <span>{opt.text}</span>
                                                            {isSelected && isCorrect && <CheckCircle size={18} />}
                                                            {isSelected && !isCorrect && <XCircle size={18} />}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-gray-800 whitespace-pre-wrap">{answer?.textAnswer || 'No answer provided.'}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Grading */}
                                <div className="border-l border-gray-100 lg:pl-8 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Marks Awarded</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                min="0"
                                                max={question.marks}
                                                value={grade.marks}
                                                onChange={(e) => handleGradeChange(question._id!, 'marks', Math.min(question.marks, Math.max(0, Number(e.target.value))))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                                                // Disable marks editing for MCQ if we want system-only grading, but usually mentors can override
                                                // disabled={isMCQ} 
                                            />
                                            <span className="absolute right-3 top-2 text-gray-400 text-sm">/ {question.marks}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Feedback / Comments</label>
                                        <textarea 
                                            value={grade.feedback}
                                            onChange={(e) => handleGradeChange(question._id!, 'feedback', e.target.value)}
                                            rows={4}
                                            placeholder="Provide feedback on the answer..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ExamGrading;
