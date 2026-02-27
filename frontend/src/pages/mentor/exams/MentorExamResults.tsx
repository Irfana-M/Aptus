import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamResults } from '../../../features/exam/examSlice';
import type { AppDispatch, RootState } from '../../../app/store';
import { Eye, Edit, ChevronLeft } from 'lucide-react';

const MentorExamResults: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { examId } = useParams<{ examId: string }>();
    const { results, loading } = useSelector((state: RootState) => state.exam);

    useEffect(() => {
        if (examId) {
            dispatch(getExamResults(examId));
        }
    }, [dispatch, examId]);

    const handleGrade = (resultId: string) => {
        navigate(`/mentor/exams/${examId}/results/${resultId}/grade`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <button 
                onClick={() => navigate('/mentor/exams')}
                className="flex items-center text-gray-600 hover:text-cyan-600 mb-6 transition-colors"
            >
                <ChevronLeft size={20} />
                <span>Back to Exams</span>
            </button>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Exam Results</h1>
                    <p className="text-gray-500 mt-1">View and grade student submissions</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No submissions found for this exam.
                                    </td>
                                </tr>
                            ) : (
                                results.map((result) => (
                                    <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold">
                                                    {/* We need student name here, assuming populated */}
                                                    {(result.studentId as unknown as { fullName: string; email: string }).fullName?.charAt(0) || 'S'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {(result.studentId as unknown as { fullName: string; email: string }).fullName || 'Unknown Student'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {(result.studentId as unknown as { fullName: string; email: string }).email || ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(result.submittedAt).toLocaleDateString()} {new Date(result.submittedAt).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900">{result.score}</span>
                                            <span className="text-xs text-gray-500"> / {result.totalMarks}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                result.status === 'COMPLETED' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {result.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => handleGrade(result._id)}
                                                className="text-cyan-600 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ml-auto"
                                            >
                                                {result.status === 'PENDING_REVIEW' ? <Edit size={16} /> : <Eye size={16} />}
                                                {result.status === 'PENDING_REVIEW' ? 'Grade' : 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MentorExamResults;
