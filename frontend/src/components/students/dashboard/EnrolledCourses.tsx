import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEnrollments } from '../../../features/student/studentThunk';
import { BookOpen } from 'lucide-react';
import type { RootState } from '../../../app/store';

const EnrolledCourses: React.FC = () => {
  const dispatch = useDispatch();
  const { enrollments, loading } = useSelector((state: RootState) => state.student);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  if (loading && enrollments.length === 0) {
    return <div className="bg-white rounded-lg shadow-sm p-6">Loading Enrollments...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">My Enrolled Courses</h2>
      </div>
      <div className="space-y-3">
        {enrollments && enrollments.length > 0 ? (
            enrollments.map((enrollment) => (
            <div key={enrollment._id} className="bg-teal-50 rounded-lg p-4 flex items-center gap-3 transition-transform hover:scale-[1.02]">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                    <BookOpen size={20} />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900 leading-tight">{enrollment.course?.subject?.subjectName || 'Subject'}</p>
                    <p className="text-xs text-gray-700">{enrollment.course?.grade?.name || 'Grade'}</p>
                </div>
                 <div className="text-right">
                    <span className="text-xs font-medium text-teal-700 bg-teal-100 px-2 py-1 rounded-full">
                        {enrollment.status}
                    </span>
                 </div>
            </div>
            ))
        ) : (
            <p className="text-gray-500 text-sm">No active enrollments found.</p>
        )}
      </div>
    </div>
  );
};

export default EnrolledCourses;
