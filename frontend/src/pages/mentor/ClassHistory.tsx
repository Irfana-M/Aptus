import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Home, User, Users, Calendar, BookOpen, Clock, ClipboardList } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import type { NavItem } from '../../components/layout/DashboardSidebar';
import { Table, type TableColumn } from '../../components/mentor/Table';
import { fetchMentorTrialClasses, fetchMentorProfile, fetchMentorCourses } from "../../features/mentor/mentorThunk";
import { logoutUser } from "../../features/auth/authThunks";
import type { AppDispatch, RootState } from "../../app/store";

// Helper for date formatting
const formatDate = (dateString: string) => {
    try {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
};

interface HistoryItem {
    id: string;
    studentName: string;
    subject: string;
    grade: string;
    date: string;
    time: string;
    type: 'Trial' | 'Regular';
    status: string;
}



const ClassHistory: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { trialClasses, courses, loading, profile } = useSelector((state: RootState) => state.mentor);
    const { user } = useSelector((state: RootState) => state.auth);
    const [view, setView] = useState<'all' | 'trial' | 'regular'>('all');

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
        { icon: <ClipboardList size={20} />, label: 'Class History', path: '/mentor/class-history' },
        { icon: <Clock size={20} />, label: 'Availability', path: '/mentor/availability' },
    ];

    const dashboardUser = {
        name: profile?.fullName || user?.fullName || "Mentor",
        email: user?.email || "",
        avatar: profile?.profileImageUrl || undefined,
        role: "mentor"
    };

    // Prepare unified history
    const historyData = [
        ...(trialClasses || [])
            .filter(cls => cls.status === 'completed')
            .map(cls => ({
                id: cls._id,
                studentName: cls.student?.fullName || 'Unknown',
                subject: cls.subject?.subjectName || 'N/A',
                grade: String(cls.subject?.grade || 'N/A'),
                date: cls.preferredDate,
                time: cls.preferredTime,
                type: 'Trial' as const,
                status: 'Completed'
            })),
        ...(courses || [])
            .filter(course => course.status === 'completed')
            .map(course => ({
                id: course._id,
                studentName: course.student?.fullName || 'Batch/Multiple',
                subject: course.subject?.subjectName || 'N/A',
                grade: String(course.grade?.name || 'N/A'),
                date: course.endDate,
                time: course.schedule?.timeSlot || 'N/A',
                type: 'Regular' as const,
                status: 'Completed'
            }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) as HistoryItem[];

    const filteredData = historyData.filter(item => {
        if (view === 'all') return true;
        if (view === 'trial') return item.type === 'Trial';
        if (view === 'regular') return item.type === 'Regular';
        return true;
    });

    const columns: TableColumn<HistoryItem>[] = [
        { 
            header: 'Student/Subject', 
            accessor: (item) => (
                <div className="flex items-center gap-3">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.studentName}`}
                        alt=""
                        className="w-8 h-8 rounded-full bg-gray-100"
                    />
                    <div>
                        <div className="font-medium text-gray-900">{item.studentName}</div>
                        <div className="text-xs text-gray-500">{item.subject}</div>
                    </div>
                </div>
            ) 
        },
        { header: 'Type', accessor: (item) => (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                item.type === 'Trial' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
                {item.type}
            </span>
        )},
        { header: 'Date', accessor: (item) => formatDate(item.date) },
        { header: 'Time', accessor: (item) => item.time },
        { 
            header: 'Status', 
            accessor: () => (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    Completed
                </span>
            ) 
        },
    ];

    return (
        <DashboardLayout
            navItems={mentorNavItems}
            user={dashboardUser}
            title="Class History"
            onLogout={handleLogout}
            appTitle="Aptus"
        >
            <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Class History</h1>
                        <p className="text-gray-500 mt-1">Review all your completed sessions</p>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setView('all')}
                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${view === 'all' ? 'bg-white shadow-sm text-cyan-600 font-medium' : 'text-gray-500'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setView('trial')}
                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${view === 'trial' ? 'bg-white shadow-sm text-cyan-600 font-medium' : 'text-gray-500'}`}
                        >
                            Trials
                        </button>
                        <button 
                            onClick={() => setView('regular')}
                            className={`px-4 py-1.5 text-sm rounded-md transition-all ${view === 'regular' ? 'bg-white shadow-sm text-cyan-600 font-medium' : 'text-gray-500'}`}
                        >
                            Regular
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                        </div>
                    ) : filteredData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table data={filteredData} columns={columns} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                             <ClipboardList className="w-12 h-12 text-gray-200 mb-2" />
                             <p>No completed classes found for this view.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ClassHistory;
