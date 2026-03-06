import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchAllAttendanceAdmin } from '../../features/attendance/attendanceThunk';
import { format } from 'date-fns';
import { UserCheck, UserX, Calendar, Search, Filter, BookOpen } from 'lucide-react';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { AdminLayout } from '../../components/admin/AdminLayout';

const AdminAttendance: React.FC = () => {
    const dispatch = useAppDispatch();
    const { history, loading } = useAppSelector((state) => state.attendance);
    const [activeTab, setActiveTab] = useState<'student' | 'mentor'>('student');
    const [searchQuery, setSearchQuery] = useState('');
    const [sessionFilter, setSessionFilter] = useState<'all' | 'one-to-one' | 'group'>('all');

    useEffect(() => {
        dispatch(fetchAllAttendanceAdmin());
    }, [dispatch]);

    const filteredHistory = useMemo(() => {
        return history.filter(record => {
            const matchesRole = record.userRole?.toLowerCase() === activeTab.toLowerCase();
            
            const fullName = record.userId?.fullName?.toLowerCase() || '';
            const subjectName = record.sessionId?.subjectId?.subjectName?.toLowerCase() || '';
            const searchLower = searchQuery.toLowerCase();
            
            const matchesSearch = fullName.includes(searchLower) || subjectName.includes(searchLower);
            
            const matchesSession = sessionFilter === 'all' || record.sessionId?.sessionType === sessionFilter;
            
            return matchesRole && matchesSearch && matchesSession;
        });
    }, [history, activeTab, searchQuery, sessionFilter]);

    const stats = useMemo(() => {
        const total = filteredHistory.length;
        const presentCount = filteredHistory.filter(h => h.status === 'present').length;
        const absentCount = filteredHistory.filter(h => h.status === 'absent').length;
        return { total, presentCount, absentCount };
    }, [filteredHistory]);

    if (loading && history.length === 0) {
        return (
            <AdminLayout title="Attendance Management" activeItem="Attendance">
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    <Loader size="lg" text="Loading attendance..." color="teal" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Attendance Management" activeItem="Attendance">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-22xl font-black text-slate-900 tracking-tight">Attendance Records</h1>
                    <p className="text-slate-500 font-medium mt-1">Monitor participation across all subjects and roles.</p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Total Sessions</p>
                        <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-inner">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Attended</p>
                        <p className="text-2xl font-black text-green-600">{stats.presentCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shadow-inner">
                        <UserX size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Missed</p>
                        <p className="text-2xl font-black text-red-500">{stats.absentCount}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Tabs & Filters */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex bg-slate-50 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('student')}
                            className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${
                                activeTab === 'student' 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Student Attendance
                        </button>
                        <button
                            onClick={() => setActiveTab('mentor')}
                            className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${
                                activeTab === 'mentor' 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Mentor Attendance
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search name or subject..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 font-medium w-64"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                            <Filter size={14} className="text-slate-400" />
                            <select
                                value={sessionFilter}
                                onChange={(e) => setSessionFilter(e.target.value as "all" | "one-to-one" | "group")}
                                className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-0 p-0"
                            >
                                <option value="all">All Sessions</option>
                                <option value="one-to-one">1:1 Sessions</option>
                                <option value="group">Group Classes</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                                <th className="px-6 py-4">Participant</th>
                                <th className="px-6 py-4">Subject & Type</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader size="md" text="Loading Records..." />
                                    </td>
                                </tr>
                            ) : filteredHistory.length > 0 ? (
                                filteredHistory.map((record) => (
                                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <p className="font-black text-slate-900 text-sm">{record.userId?.fullName || 'N/A'}</p>
                                                <p className="text-xs text-slate-400 font-medium">{record.userId?.email || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {record.sessionId?.subjectId?.subjectName || record.sessionId?.subject?.subjectName || 'N/A'}
                                                </span>
                                                <span className={`w-fit px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                                    record.sessionModel === 'TrialClass'
                                                        ? 'bg-teal-50 text-teal-600'
                                                        : record.sessionId?.sessionType === 'group' 
                                                            ? 'bg-orange-50 text-orange-600' 
                                                            : 'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                    {record.sessionModel === 'TrialClass' ? 'Trial' : record.sessionId?.sessionType === 'group' ? 'Group' : '1:1'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-600">{format(new Date(record.createdAt), 'MMM dd, yyyy')}</span>
                                                <span className="text-xs text-slate-400">{format(new Date(record.createdAt), 'hh:mm a')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                record.status === 'present' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                                <BookOpen size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <EmptyState 
                                            icon={Calendar} 
                                            title="No records found" 
                                            description="Adjust your search or filters to find specific attendance entries." 
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAttendance;
