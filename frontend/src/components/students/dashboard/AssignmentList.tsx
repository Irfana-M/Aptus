import React from 'react';
import { ClipboardList } from 'lucide-react';
import { EmptyState } from '../../ui/EmptyState';

const AssignmentList: React.FC = () => {
  const assignments: {
    id: string;
    subject: string;
    chapter: string;
    task: string;
    page: string;
    time: string;
    status: string;
  }[] = []; // No data for now

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-bold mb-4">Assignments</h2>
      <div className="space-y-3">
        {assignments.length > 0 ? (
          assignments.map(assignment => (
            <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{assignment.subject}</p>
                  <p className="text-xs text-gray-500">{assignment.chapter}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">{assignment.task}</p>
                  <p className="text-xs text-gray-500">{assignment.page}</p>
                </div>
                <div className="flex items-center">
                  <p className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">{assignment.time}</p>
                </div>
                <div className="sm:text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    assignment.status === 'Completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                    }`}>
                    {assignment.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState 
            icon={ClipboardList} 
            title="No pending assignments" 
            description="You are all caught up for now!" 
            className="py-8"
          />
        )}
      </div>
    </div>
  );
};

export default AssignmentList;
