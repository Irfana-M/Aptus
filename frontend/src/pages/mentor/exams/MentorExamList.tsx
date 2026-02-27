import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Clock, Calendar, BookOpen, ClipboardList, 
  User, Home, FileText, Plus, Trash2, Edit
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import type { NavItem } from '../../../components/layout/DashboardSidebar';
import { getExamsByMentor } from "../../../features/exam/examSlice";
import type { AppDispatch, RootState } from "../../../app/store";
import { logoutUser } from "../../../features/auth/authThunks";

const MentorExamList: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { exams, loading } = useSelector((state: RootState) => state.exam);
    const { user } = useSelector((state: RootState) => state.auth);
    const { profile } = useSelector((state: RootState) => state.mentor);

    useEffect(() => {
        dispatch(getExamsByMentor());
    }, [dispatch]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/login');
    };

    const mentorNavItems: NavItem[] = [
        { icon: <Home size={20} />, label: 'Dashboard', path: '/mentor/dashboard' },
        { icon: <User size={20} />, label: 'Profile', path: '/mentor/profile' },
        { icon: <Users size={20} />, label: 'Students/Batches', path: '/mentor/students' },
        { icon: <Calendar size={20} />, label: 'Attendance', path: '/mentor/attendance' },
        { icon: <BookOpen size={20} />, label: 'Classroom', path: '/mentor/classroom' },
        { icon: <ClipboardList size={20} />, label: 'Class History', path: '/mentor/class-history' },
        { icon: <Clock size={20} />, label: 'Availability', path: '/mentor/availability' },
        { icon: <FileText size={20} />, label: 'Exams', path: '/mentor/exams' },
    ];

    const dashboardUser = {
        name: profile?.fullName || user?.fullName || "Mentor",
        email: user?.email || "",
        avatar: profile?.profileImageUrl || undefined,
        role: "mentor"
    };

    return (
        <DashboardLayout
            navItems={mentorNavItems}
            user={dashboardUser}
            title="Exams"
            onLogout={handleLogout}
            appTitle="Aptus"
        >
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
                        <p className="text-gray-500 mt-1">Manage your course exams and assessments</p>
                    </div>
                    <button
                        onClick={() => navigate('/mentor/exams/create')}
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
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : exams.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="w-12 h-12 text-gray-200" />
                                                <p>No exams created yet.</p>
                                            </div>
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
        </DashboardLayout>
    );
};

export default MentorExamList;
