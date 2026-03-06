import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes.constants';
import { 
  Plus, Trash2, Edit, ClipboardList, FileText
} from 'lucide-react';
import { Loader } from '../../../components/ui/Loader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { getExamsByMentor } from "../../../features/exam/examSlice";
import type { AppDispatch, RootState } from "../../../app/store";
import { MentorLayout } from "../../../components/mentor/MentorLayout";

const MentorExamList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { exams, loading } = useSelector((state: RootState) => state.exam);


    useEffect(() => {
        dispatch(getExamsByMentor());
    }, [dispatch]);

    return (
        <MentorLayout title="Exams">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
                        <p className="text-gray-500 mt-1">Manage your course exams and assessments</p>
                    </div>
                    <button
                        onClick={() => navigate(ROUTES.MENTOR.CREATE_EXAM)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Create Exam</span>
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4">Total Marks</th>
                                    <th className="px-6 py-4">Passing</th>
                                    <th className="px-6 py-4">Questions</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <Loader size="md" />
                                        </td>
                                    </tr>
                                ) : exams.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12">
                                            <EmptyState 
                                                title="No exams created yet"
                                                description="Manage your course exams and assessments by creating your first exam."
                                                icon={FileText}
                                                actionLabel="Create Exam"
                                                onAction={() => navigate(ROUTES.MENTOR.CREATE_EXAM)}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    exams.map((exam) => (
                                        <tr key={exam._id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">{exam.title}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{exam.description || 'No description'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {exam.duration} mins
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {exam.totalMarks}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {exam.passingMarks}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {exam.questions?.length || 0}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => navigate(`/mentor/exams/${exam._id}/results`)}
                                                        className="p-2 text-gray-400 hover:bg-gray-50 hover:text-cyan-600 rounded-lg transition-colors" 
                                                        title="View Results"
                                                    >
                                                        <ClipboardList size={18} />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:bg-gray-50 hover:text-cyan-600 rounded-lg transition-colors" title="Edit">
                                                        <Edit size={18} />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MentorLayout>
    );
};

export default MentorExamList;
