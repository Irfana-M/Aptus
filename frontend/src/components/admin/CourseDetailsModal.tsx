import React from 'react';
import type { Course } from '../../types/courseTypes';
import { X, Clock, User, BookOpen, CheckCircle, AlertCircle, Users, XCircle } from 'lucide-react';

interface CourseDetailsModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (course: Course) => void;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({ course, isOpen, onClose, onEdit }) => {
  if (!isOpen || !course) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "booked": return <Users className="w-5 h-5 text-blue-500" />;
      case "ongoing": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "completed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancelled": return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "booked": return "bg-blue-100 text-blue-800";
      case "ongoing": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Course Details</h2>
              <p className="text-sm text-gray-500">ID: {course._id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-medium ${getStatusColor(course.status)}`}>
               {getStatusIcon(course.status)}
               <span className="capitalize">{course.status}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 flex items-center gap-1">
                <span className="text-sm text-gray-400 font-normal mr-1">Fee:</span>
                <span className="text-green-600">₹{course.fee?.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Subject Info */}
             <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <BookOpen size={14} /> Subject & Grade
                </h3>
                <div>
                     <p className="text-xs text-gray-500">Subject</p>
                     <p className="font-medium text-gray-900">{course.subject?.subjectName}</p>
                </div>
                <div>
                     <p className="text-xs text-gray-500">Grade</p>
                     <p className="font-medium text-gray-900">{course.grade?.name}</p>
                </div>
                 <div>
                     <p className="text-xs text-gray-500">Syllabus</p>
                     <p className="font-medium text-gray-900">{course.grade?.syllabus || 'N/A'}</p>
                </div>
             </div>

             {/* Schedule Info */}
             <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Clock size={14} /> Schedule
                </h3>
                 <div>
                     <p className="text-xs text-gray-500">Class Day</p>
                     <p className="font-medium text-gray-900">{DAYS[Number(course.dayOfWeek)] || 'Not set'}</p>
                </div>
                <div>
                     <p className="text-xs text-gray-500">Time Slot</p>
                     <p className="font-medium text-gray-900">{course.timeSlot || 'Not set'}</p>
                </div>
                 <div>
                     <p className="text-xs text-gray-500">Duration</p>
                     <p className="font-medium text-gray-900">
                        {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                     </p>
                </div>
             </div>

             {/* People Info */}
             <div className="bg-gray-50 p-4 rounded-xl space-y-3 md:col-span-2 grid grid-cols-2 gap-4">
                 <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <User size={14} /> Mentor
                    </h3>
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                             {course.mentor?.fullName?.charAt(0) || 'M'}
                         </div>
                         <div>
                             <p className="font-medium text-gray-900">{course.mentor?.fullName || 'Unassigned'}</p>
                         </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Users size={14} /> Student
                    </h3>
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                             {course.student?.fullName?.charAt(0) || 'S'}
                         </div>
                         <div>
                             <p className="font-medium text-gray-900">{course.student?.fullName || 'Not enrolled'}</p>
                             <p className="text-xs text-gray-500">{course.student?.email || 'N/A'}</p>
                         </div>
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(course)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></div>
            Edit Course
          </button>
        </div>
      </div>
    </div>
  );
};
