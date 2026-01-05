import React from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import { Calendar } from 'lucide-react';

const StudentAttendance: React.FC = () => {
  return (
    <StudentLayout title="My Attendance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-medium mb-1">Total Classes</p>
                <p className="text-3xl font-black text-slate-800">0</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-medium mb-1">Present</p>
                <p className="text-3xl font-black text-green-600">0%</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <p className="text-slate-500 text-sm font-medium mb-1">Absent</p>
                <p className="text-3xl font-black text-red-500">0</p>
            </div>
        </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={24} />
            Attendance History
        </h2>
        
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Calendar size={32} />
            </div>
            <p className="text-slate-900 font-bold text-lg">No attendance records yet</p>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">Your attendance statistics will show up here once your classes begin.</p>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentAttendance;
