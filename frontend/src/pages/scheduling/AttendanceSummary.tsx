import React from 'react';

const AttendanceSummary: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Attendance & Performance</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-indigo-50 rounded-lg">
          <p className="text-sm text-indigo-600 font-medium">Total Sessions</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Present</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummary;
