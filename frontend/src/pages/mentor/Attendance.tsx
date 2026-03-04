import React, { useEffect, useMemo } from 'react';
import { MentorLayout } from '../../components/mentor/MentorLayout';
import { Calendar, UserCheck, UserX, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchAttendanceHistory } from '../../features/attendance/attendanceThunk';
import { format } from 'date-fns';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';

const MentorAttendance: React.FC = () => {
    const dispatch = useAppDispatch();
    const { history, loading } = useAppSelector((state) => state.attendance);

    useEffect(() => {
        dispatch(fetchAttendanceHistory());
    }, [dispatch]);

    const stats = useMemo(() => {
        const total = history.length;
        const presentCount = history.filter(h => h.status === 'present').length;
        const absentCount = history.filter(h => h.status === 'absent').length;
        
        return { total, presentCount, absentCount };
    }, [history]);

    return (
        <MentorLayout title="Attendance History">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Records</p>
                        <p className="text-3xl font-black text-slate-800">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Present</p>
                        <p className="text-3xl font-black text-green-600">{stats.presentCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                        <UserCheck size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Absent</p>
                        <p className="text-3xl font-black text-red-500">{stats.absentCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                        <UserX size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={24} />
                    Recent Activity
                </h2>

                {loading ? (
                    <Loader size="lg" text="Loading attendance history..." />
                ) : history.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="pb-4 px-4">Date & Time</th>
                                    <th className="pb-4 px-4">Session Info</th>
                                    <th className="pb-4 px-4">Entity</th>
                                    <th className="pb-4 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {history.map((record) => (
                                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-700">
                                                {format(new Date(record.createdAt), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {format(new Date(record.createdAt), 'hh:mm a')}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-medium text-slate-600">
                                                {record.sessionId?.subjectId?.subjectName || 'Course Session'}
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono">
                                                ID: {record.sessionId?._id?.substring(0, 8) || 'N/A'}...
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                {record.userRole}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                record.status === 'present' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState 
                        icon={Calendar} 
                        title="No records found" 
                        description="Attendance records for your assigned students and sessions will appear here." 
                    />
                )}
            </div>
        </MentorLayout>
    );
};

export default MentorAttendance;
