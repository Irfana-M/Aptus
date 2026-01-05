import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Calendar, MessageSquare, Video, Search, ChevronRight, BookOpen } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import type { NavItem } from '../../components/layout/DashboardSidebar';
import { fetchMentorTrialClasses, fetchMentorProfile, fetchMentorCourses } from "../../features/mentor/mentorThunk";
import { logoutUser } from "../../features/auth/authThunks";
import type { AppDispatch, RootState } from "../../app/store";
import { Home, User, ClipboardList } from 'lucide-react';

interface UnifiedStudent {
    id: string;
    student: {
        fullName: string;
        email: string;
        profilePicture?: string;
    };
    subject: {
        name: string;
        grade: string;
    };
    type: 'Trial' | 'Enrolled';
    status: string;
    nextSession: {
        date: string;
        time: string;
        days?: string[];
    };
}

const MentorStudentsPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { trialClasses, courses, loading, profile } = useSelector((state: RootState) => state.mentor);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(fetchMentorTrialClasses());
        dispatch(fetchMentorCourses());
        if (!profile) {
            dispatch(fetchMentorProfile());
        }
    }, [dispatch, profile]);

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
        { icon: <ClipboardList size={20} />, label: 'Completed Classes', path: '/mentor/completed-trial-classes' },
        { icon: <Clock size={20} />, label: 'Availability', path: '/mentor/availability' },
    ];

    const dashboardUser = {
        name: profile?.fullName || user?.fullName || "Mentor",
        email: user?.email || "",
        avatar: profile?.profileImageUrl || undefined,
        role: "mentor"
    };

    const assignedStudents = useMemo((): UnifiedStudent[] => {
        const trials = (trialClasses || [])
            .filter(cls => cls.status === 'assigned' || cls.status === 'completed')
            .map(cls => ({
                id: cls.id || cls._id || '',
                student: {
                    fullName: cls.student?.fullName || 'N/A',
                    email: cls.student?.email || 'N/A',
                },
                subject: {
                    name: cls.subject?.subjectName || 'N/A',
                    grade: String(cls.subject?.grade || 'N/A')
                },
                type: 'Trial' as const,
                status: cls.status,
                nextSession: {
                    date: cls.preferredDate,
                    time: cls.preferredTime
                }
            }));

        const enrolled = (courses || [])
            .filter(c => c.student)
            .map(c => ({
                id: c._id,
                student: {
                    fullName: c.student?.fullName || 'N/A',
                    email: c.student?.email || 'N/A',
                    profilePicture: c.student?.profilePicture
                },
                subject: {
                    name: c.subject?.subjectName || 'N/A',
                    grade: String(c.grade?.name || 'N/A')
                },
                type: 'Enrolled' as const,
                status: c.status,
                nextSession: {
                    date: c.startDate,
                    time: c.schedule?.timeSlot || 'N/A',
                    days: c.schedule?.days || []
                }
            }));

        return [...trials, ...enrolled];
    }, [trialClasses, courses]);

    return (
        <DashboardLayout
            navItems={mentorNavItems}
            user={dashboardUser}
            title="My Students"
            onLogout={handleLogout}
            appTitle="Aptus"
        >
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Students & Batches</h1>
                        <p className="text-gray-500 mt-1">Manage your trial sessions and enrolled students</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search student name or subject..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Filter:</span>
                            <select className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
                                <option>All Students</option>
                                <option>Trial Students</option>
                                <option>Enrolled Students</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Subject & Grade</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Next Session</th>
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
                                ) : assignedStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="w-12 h-12 text-gray-200" />
                                                <p>No students assigned to you yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    assignedStudents.map((cls) => (
                                        <tr key={cls.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={cls.student?.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cls.student?.fullName}`}
                                                        alt=""
                                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors">
                                                            {cls.student?.fullName || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{cls.student?.email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{cls.subject.name}</p>
                                                    <p className="text-xs text-gray-500">Grade {cls.subject.grade}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                    cls.type === 'Trial' 
                                                        ? 'bg-purple-50 text-purple-600 border-purple-100' 
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                    {cls.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    cls.status === 'completed' || cls.status === 'ongoing' || cls.status === 'booked'
                                                        ? 'bg-green-50 text-green-600 border border-green-100' 
                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                    {cls.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-xs text-gray-700 font-medium whitespace-nowrap">
                                                        <Calendar className="w-3 h-3 text-cyan-600" />
                                                        {cls.nextSession.days && cls.nextSession.days.length > 0 ? cls.nextSession.days.join(', ') : new Date(cls.nextSession.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                        <Clock className="w-3 h-3" />
                                                        {cls.nextSession.time}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => navigate(cls.type === 'Trial' ? `/trial-class/${cls.id}/call` : `/classroom/${cls.id}`)}
                                                        className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                                        title="Launch Classroom"
                                                    >
                                                        <Video size={18} />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors" title="Message Student">
                                                        <MessageSquare size={18} />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                                                        <ChevronRight size={18} />
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

export default MentorStudentsPage;
