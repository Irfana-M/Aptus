import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Home, User, Users, Calendar, BookOpen, Clock, ClipboardList, LogOut } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import type { NavItem } from '../../components/layout/DashboardSidebar';
import { Table, type TableColumn } from '../../components/mentor/Table';
import { fetchMentorTrialClasses, fetchMentorProfile } from "../../features/mentor/mentorThunk";
import { logoutUser } from "../../features/auth/authThunks";
import type { AppDispatch, RootState } from "../../app/store";
import type { TrialClass } from '../../types/studentTypes';

// Helper for date formatting
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return dateString;
    }
};

const CompletedTrialClasses: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { trialClasses, loading, profile } = useSelector((state: RootState) => state.mentor);
    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(fetchMentorTrialClasses());
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

    // Filter for completed classes
    const completedClasses = (trialClasses || []).filter(cls => cls.status === 'completed');

    const columns: TableColumn<TrialClass>[] = [
        { 
            header: 'Student Name', 
            accessor: (item) => (
                <div className="flex items-center gap-3">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.student?.fullName}`}
                        alt=""
                        className="w-8 h-8 rounded-full bg-gray-100"
                    />
                    <span className="font-medium">{item.student?.fullName || 'Unknown'}</span>
                </div>
            ) 
        },
        { header: 'Subject', accessor: (item) => item.subject?.subjectName || 'N/A' },
        { header: 'Grade', accessor: (item) => String(item.subject?.grade || 'N/A') },
        { header: 'Date', accessor: (item) => formatDate(item.preferredDate) },
        { header: 'Time', accessor: (item) => item.preferredTime },
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
            title="Completed Trial Classes"
            onLogout={handleLogout}
            appTitle="Aptus"
        >
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Completed Sessions</h1>
                        <p className="text-gray-500 mt-1">Review your finished trial classes</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                        </div>
                    ) : completedClasses.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table data={completedClasses} columns={columns} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                             <ClipboardList className="w-12 h-12 text-gray-200 mb-2" />
                             <p>No completed trial classes found.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CompletedTrialClasses;
