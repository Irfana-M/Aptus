import React from 'react';
import { MentorLayout } from '../../components/mentor/MentorLayout';
import { BookOpen } from 'lucide-react';

const MentorClassroom: React.FC = () => {
  return (
    <MentorLayout title="Classroom">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Classrooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                    <BookOpen size={24} />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Mathematics - Batch A</h3>
                <p className="text-sm text-gray-500 mt-1">Grade 10 • 12 Students</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">Active</span>
                    <button className="text-indigo-600 text-sm font-medium hover:underline">View Class</button>
                </div>
            </div>
             <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <p>More classrooms will appear here when assigned.</p>
            </div>
        </div>
      </div>
    </MentorLayout>
  );
};

export default MentorClassroom;
