import React from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import { BookOpen, Video } from 'lucide-react';

const StudentClassroom: React.FC = () => {
  return (
    <StudentLayout title="Classroom">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white mb-8 relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">Your Virtual Classroom</h1>
            <p className="text-indigo-100 max-w-lg">Access your live classes, recordings, and interactive whiteboard sessions here.</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
            <BookOpen size={200} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Upcoming Live Classes</h2>
             <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                    <Video size={32} />
                </div>
                <p className="text-slate-900 font-bold text-lg">No classes scheduled</p>
                <p className="text-slate-500 mt-1">Your upcoming classes will appear here.</p>
            </div>
        </div>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
             <h2 className="text-xl font-bold text-slate-800 mb-6">Past Classes & Recordings</h2>
             <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">No recordings available yet.</p>
            </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentClassroom;
