import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Calendar, MessageSquare, Video, Search, ChevronRight, BookOpen } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import type { NavItem } from '../../components/layout/DashboardSidebar';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { fetchMentorTrialClasses, fetchMentorProfile, fetchMentorCourses } from "../../features/mentor/mentorThunk";
import { logoutUser } from "../../features/auth/authThunks";
import type { AppDispatch, RootState } from "../../app/store";
import { Home, User, ClipboardList } from 'lucide-react';
import { ROUTES } from '../../constants/routes.constants';

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
    courseType: 'one-to-one' | 'group';
    feedback?: {
        rating: number;
        comment: string;
    };
}

const MentorStudentsPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { trialClasses, courses, loading, profile } = useSelector((state: RootState) => state.mentor);
    const { user } = useSelector((state: RootState) => state.auth);

    const [activeTab, setActiveTab] = React.useState<'trials' | 'enrolled'>('enrolled');
    const [searchQuery, setSearchQuery] = React.useState('');

    useEffect(() => {
        dispatch(fetchMentorTrialClasses());
        dispatch(fetchMentorCourses());
        if (!profile) {
            dispatch(fetchMentorProfile());
        }
    }, [dispatch, profile]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate(ROUTES.LOGIN);
    };

    const mentorNavItems: NavItem[] = [
        { icon: <Home size={20} />, label: 'Dashboard', path: ROUTES.MENTOR.DASHBOARD },
        { icon: <User size={20} />, label: 'Profile', path: ROUTES.MENTOR.PROFILE },
        { icon: <Users size={20} />, label: 'Students/Batches', path: ROUTES.MENTOR.STUDENTS },
        { icon: <Calendar size={20} />, label: 'Attendance', path: ROUTES.MENTOR.ATTENDANCE },
        { icon: <BookOpen size={20} />, label: 'Classroom', path: ROUTES.MENTOR.CLASSROOM },
        { icon: <ClipboardList size={20} />, label: 'Class History', path: ROUTES.MENTOR.CLASS_HISTORY },
        { icon: <Clock size={20} />, label: 'Availability', path: ROUTES.MENTOR.AVAILABILITY },
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
                },
                courseType: 'one-to-one' as const,
                feedback: cls.feedback
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
                },
                courseType: (c.courseType as 'one-to-one' | 'group') || 'one-to-one'
            }));

        const all = [...trials, ...enrolled];
        
        return all.filter(s => {
            const matchesSearch = s.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 s.subject.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTab = activeTab === 'trials' ? s.type === 'Trial' : s.type === 'Enrolled';
            return matchesSearch && matchesTab;
        });
    }, [trialClasses, courses, searchQuery, activeTab]);

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
                    <div className="border-b border-gray-200">
                        <div className="flex p-1 gap-1">
                            <button
                                onClick={() => setActiveTab('enrolled')}
                                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === 'enrolled'
                                        ? 'bg-cyan-50 text-cyan-700 font-bold'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Active Courses ({(courses || []).length})
                            </button>
                            <button
                                onClick={() => setActiveTab('trials')}
                                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${
                                    activeTab === 'trials'
                                        ? 'bg-purple-50 text-purple-700 font-bold'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Trial Requests ({(trialClasses || []).filter(c => c.status === 'assigned').length})
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search student name or subject..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Subject & Session Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Schedule</th>
                                    {activeTab === 'trials' && <th className="px-6 py-4">Feedback</th>}
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={activeTab === 'trials' ? 6 : 5} className="px-6 py-12">
                                            <Loader size="md" />
                                        </td>
                                    </tr>
                                ) : assignedStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeTab === 'trials' ? 6 : 5} className="px-6 py-12">
                                            <EmptyState 
                                                title={`No ${activeTab === 'trials' ? 'trial requests' : 'active courses'} found`}
                                                description={`You don't have any ${activeTab === 'trials' ? 'trial requests' : 'active courses'} at the moment.`}
                                                icon={Users}
                                            />
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
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm font-medium text-gray-800">{cls.subject.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">Grade {cls.subject.grade}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                            cls.courseType === 'group' 
                                                                ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                        }`}>
                                                            {cls.courseType === 'group' ? 'Group' : '1:1'}
                                                        </span>
                                                    </div>
                                                </div>
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
                                                        {cls.nextSession.days && cls.nextSession.days.length > 0 
                                                            ? cls.nextSession.days.join(', ') 
                                                            : cls.nextSession.date 
                                                                ? new Date(cls.nextSession.date).toLocaleDateString()
                                                                : 'TBD'
                                                        }
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                        <Clock className="w-3 h-3" />
                                                        {cls.nextSession.time || 'TBD'}
                                                    </div>
                                                </div>
                                            </td>
                                            {activeTab === 'trials' && (
                                                <td className="px-6 py-4">
                                                    {cls.feedback ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={`text-xs ${i < (cls.feedback?.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                                                                ))}
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 italic max-w-[150px] truncate">
                                                                "{cls.feedback.comment}"
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">No feedback</span>
                                                    )}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => navigate(ROUTES.COMMON.VIDEO_CALL.replace(':trialClassId', cls.id))}
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
