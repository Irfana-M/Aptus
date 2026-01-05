import React from 'react';
import { MentorLayout } from '../../components/mentor/MentorLayout';

const MentorAttendance: React.FC = () => {
  return (
    <MentorLayout title="Attendance">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Student Attendance</h2>
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">Attendance records for your assigned students will appear here.</p>
            <p className="text-sm text-gray-400 mt-2">No records found for the current month.</p>
        </div>
      </div>
    </MentorLayout>
  );
};

export default MentorAttendance;
