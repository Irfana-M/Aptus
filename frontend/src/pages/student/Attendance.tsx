import React, { useEffect, useMemo } from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchAttendanceHistory } from '../../features/attendance/attendanceThunk';
import { format } from 'date-fns';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';

const StudentAttendance: React.FC = () => {
    const dispatch = useAppDispatch();
    const { history, loading } = useAppSelector((state) => state.attendance);

    useEffect(() => {
        dispatch(fetchAttendanceHistory());
    }, [dispatch]);

    const stats = useMemo(() => {
        const total = history.length;
        const present = history.filter(h => h.status === 'present').length;
        const absent = history.filter(h => h.status === 'absent').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return { total, present, absent, percentage };
    }, [history]);

    return (
        <StudentLayout title="My Attendance">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Total Classes</p>
                        <p className="text-3xl font-black text-slate-800">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Attendance Rate</p>
                        <p className="text-3xl font-black text-green-600">{stats.percentage}%</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm font-medium mb-1">Missed Classes</p>
                        <p className="text-3xl font-black text-red-500">{stats.absent}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                        <XCircle size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={24} />
                    Attendance History
                </h2>

                {loading ? (
                    <Loader size="lg" text="Loading attendance data..." />
                ) : history.length > 0 ? (
                    <div className="overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="pb-4 px-4 font-black">Date</th>
                                    <th className="pb-4 px-4 font-black">Subject</th>
                                    <th className="pb-4 px-4 font-black">Status</th>
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
                                        <td className="py-4 px-4 font-medium text-slate-600">
                                            {record.sessionId?.subjectId?.subjectName || 'Course Session'}
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
                        title="No attendance records yet" 
                        description="Your attendance statistics will show up here once your classes begin." 
                    />
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentAttendance;
