import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.constants';
import { Clock, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { getExamById, submitExam } from "../../../features/exam/examSlice";
import type { AppDispatch, RootState } from "../../../app/store";
import { QuestionType } from "../../../types/exam.types";
import type { SubmitAnswerDTO } from "../../../types/exam.types";
import toast from 'react-hot-toast';
import { Loader } from '../../../components/ui/Loader';

const TakeExam: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { examId } = useParams<{ examId: string }>();
    const { currentExam, loading } = useSelector((state: RootState) => state.exam);
    
    // State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, SubmitAnswerDTO>>({}); // Map questionID to Answer
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [showHint, setShowHint] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Load
    useEffect(() => {
        if (examId) {
            dispatch(getExamById(examId));
        }
    }, [dispatch, examId]);

    // Setup Exam when loaded
    useEffect(() => {
        if (currentExam) {
            setTimeLeft(currentExam.duration * 60); // minutes to seconds
        }
    }, [currentExam]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId: string, value: string | undefined, type: QuestionType) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                questionId,
                selectedOptionId: type === QuestionType.MCQ ? value : undefined,
                textAnswer: type === QuestionType.SUBJECTIVE ? value : undefined
            }
        }));
    };

    const handleSubmit = useCallback(async () => {
        if (!examId) return;
        
        // Transform answers map to array
        const answersArray = Object.values(answers);
        
        toast.promise(
            dispatch(submitExam({
                examId,
                answers: answersArray
            })).unwrap(),
            {
                loading: 'Submitting Exam...',
                success: 'Exam Submitted Successfully!',
                error: 'Failed to submit exam.'
            }
        ).then(() => {
           navigate(ROUTES.STUDENT.RESULTS); 
        });
    }, [dispatch, examId, answers, navigate]);

    // Timer Logic
    useEffect(() => {
        if (timeLeft > 0 && !loading) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        handleSubmit(); // Auto submit
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, loading, handleSubmit]);

    if (loading || !currentExam) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader size="lg" text="Preparing your exam..." />
            </div>
        );
    }

    const currentQuestion = currentExam.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentExam.questions.length) * 100;
    // const isAnswered = !!answers[currentQuestion._id!];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{currentExam.title}</h1>
                        <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {currentExam.questions.length}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Clock size={20} />
                        {formatTime(timeLeft)}
                    </div>
                    <button 
                        onClick={handleSubmit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                    >
                        Finish Exam
                    </button>
                </div>
                {/* Progress Bar */}
                <div className="max-w-5xl mx-auto mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl w-full mx-auto p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                            Question {currentQuestionIndex + 1}
                        </span>
                        <span className="text-gray-500 text-sm font-medium">
                            {currentQuestion.marks} Marks
                        </span>
                    </div>

                    <h2 className="text-xl font-medium text-gray-800 mb-8 leading-relaxed">
                        {currentQuestion.text}
                    </h2>

                    <div className="flex-1 space-y-4">
                        {currentQuestion.type === QuestionType.MCQ ? (
                            <div className="space-y-3">
                                {currentQuestion.options?.map((option, idx) => {
                                    const isSelected = answers[currentQuestion._id!]?.selectedOptionId === option._id;
                                    return (
                                        <div 
                                            key={idx}
                                            onClick={() => handleAnswerChange(currentQuestion._id!, option._id, QuestionType.MCQ)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                                                isSelected 
                                                    ? 'border-indigo-600 bg-indigo-50/50' 
                                                    : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                                            }`}>
                                                {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                            </div>
                                            <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                                                {option.text}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <textarea 
                                value={answers[currentQuestion._id!]?.textAnswer || ''}
                                onChange={(e) => handleAnswerChange(currentQuestion._id!, e.target.value, QuestionType.SUBJECTIVE)}
                                className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                placeholder="Type your answer here..."
                            />
                        )}
                    </div>

                    {showHint && currentQuestion.hint && (
                        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-sm font-bold flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                                Premium Hint:
                            </p>
                            <p className="text-sm italic">{currentQuestion.hint}</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mt-6">
                    <button 
                        onClick={() => {
                            setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
                            setShowHint(false); // Reset hint
                        }}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-600 disabled:opacity-50 hover:bg-white hover:shadow-sm transition-all"
                    >
                        <ChevronLeft size={20} /> Previous
                    </button>

                    {currentQuestion.hint && (
                        <button 
                            onClick={() => setShowHint(!showHint)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                showHint ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            }`}
                        >
                            {showHint ? 'Hide Hint' : 'Show Hint'}
                        </button>
                    )}
                    
                    {currentQuestionIndex === currentExam.questions.length - 1 ? (
                         <button 
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all"
                        >
                            <Save size={20} /> Submit Exam
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                setCurrentQuestionIndex(prev => Math.min(currentExam.questions.length - 1, prev + 1));
                                setShowHint(false); // Reset hint for next question
                            }}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                        >
                            Next <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TakeExam;

