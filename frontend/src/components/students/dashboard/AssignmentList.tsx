import { ClipboardList, Clock } from 'lucide-react';
import { EmptyState } from '../../ui/EmptyState';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store';
import { Loader } from '../../ui/Loader';

const AssignmentList: React.FC = () => {
  const { assignments, assignmentsLoading } = useSelector((state: RootState) => state.student);

  if (assignmentsLoading) {
      return (
          <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">Assignments</h2>
              <Loader size="md" text="Loading assignments..." />
          </div>
      );
  }

  const pendingAssignments = (assignments || [])
    .filter(a => a.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-bold mb-4">Pending Assignments</h2>
      <div className="space-y-3">
        {pendingAssignments.length > 0 ? (
          pendingAssignments.map(assignment => (
            <div key={assignment._id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{assignment.title}</p>
                  <p className="text-xs text-gray-500">{assignment.subjectName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs">
                    <Clock size={12} />
                    <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                    Pending
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
