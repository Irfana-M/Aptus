import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEnrollments } from '../../../features/student/studentThunk';
import { BookOpen } from 'lucide-react';
import type { RootState, AppDispatch } from '../../../app/store';
import { Loader } from '../../ui/Loader';
import { EmptyState } from '../../ui/EmptyState';

const EnrolledCourses: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments, loading } = useSelector((state: RootState) => state.student);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  if (loading && (!enrollments || enrollments.length === 0)) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center">
        <Loader size="md" />
      </div>
    );
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
            <EmptyState 
              icon={BookOpen} 
              title="No courses yet" 
              description="Explore our plans to get started." 
              className="py-4 border-none" 
            />
        )}
      </div>
    </div>
  );
};

export default EnrolledCourses;
