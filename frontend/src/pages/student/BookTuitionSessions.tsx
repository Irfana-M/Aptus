import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import StudentLayout from '../../components/students/StudentLayout';
import { Search, BookOpen, Clock, Calendar } from "lucide-react";
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { fetchAvailableCourses } from "../../features/student/studentThunk";
import type { AppDispatch, RootState } from "../../app/store";
import CustomTimeRequestModal from "../../features/student/components/CustomTimeRequestModal";
import { enrollInCourse } from "../../features/student/studentApi";
import toast from "react-hot-toast";

const BookTuitionSessions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { courses, loading, profile } = useSelector((state: RootState) => state.student);
  
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const studentGrade = profile?.gradeId || profile?.academicDetails?.gradeId;
  const studentSyllabus = profile?.academicDetails?.syllabus;

  useEffect(() => {
    dispatch(fetchAvailableCourses({ 
        gradeId: studentGrade, 
        syllabus: studentSyllabus 
    }));
  }, [dispatch, studentGrade, studentSyllabus]);

  const handleEnrollInCourse = async (courseId: string) => {
    try {
      setEnrolling(courseId);
      const response = await enrollInCourse(courseId);
      
      if (response.success) {
        toast.success('Successfully enrolled in course!');
        navigate(ROUTES.STUDENT.SUBSCRIPTION_PLANS);
      } else {
        toast.error(response.message || 'Failed to enroll in course');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while enrolling';
      toast.error(errorMessage);
    } finally {
      setEnrolling(null);
    }
  };

  const handleSearch = () => {
    dispatch(fetchAvailableCourses({ 
        subject: selectedSubject, 
        gradeId: studentGrade, 
        syllabus: studentSyllabus 
    }));
  };

  const dummySubjects = ['Mathematics', 'Science', 'English', 'History', 'Physics', 'Chemistry']; 

  const gradeDisplay = typeof studentGrade === 'object' ? studentGrade.name : studentGrade;

  return (
    <StudentLayout title="Book Tuition Sessions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">One-on-One Tuition</h1>
            <p className="mt-2 text-gray-600">
                Book your personalized session for {gradeDisplay ? `Grade ${gradeDisplay}` : ''} {studentSyllabus}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by mentor or course name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
            </div>
            <div className="flex gap-4">
                <select 
                    value={selectedSubject}
                    onChange={(e) => { setSelectedSubject(e.target.value); handleSearch(); }}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                    <option value="">All Subjects</option>
                    {dummySubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
             <div className="py-24">
                 <Loader size="lg" text="Finding available sessions..." />
             </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: {
              _id: string;
              title?: string;
              subject?: { subjectName: string };
              dayOfWeek?: number;
              timeSlot?: string;
              mentor?: { name?: string; fullName?: string; profilePicture?: string };
            }) => (
              <div key={course._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 text-sm font-medium rounded-full">
                      {course.subject?.subjectName || 'Subject'}
                    </span>
                    <span className="flex items-center text-gray-500 text-sm">
                       <Calendar size={16} className="mr-1" />
                       {course.dayOfWeek ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][course.dayOfWeek] : 'Flexible'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title || "Tuition Session"}</h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                     {course.mentor?.profilePicture ? (
                         <img src={course.mentor.profilePicture} alt={course.mentor.name} className="w-8 h-8 rounded-full" />
                     ) : (
                         <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                             {course.mentor?.name?.charAt(0) || 'M'}
                         </div>
                     )}
                     <span className="text-sm text-gray-600">{course.mentor?.name || course.mentor?.fullName || 'Mentor Name'}</span>
                  </div>

                  <div className="flex items-center text-gray-600 text-sm mb-6">
                      <Clock size={16} className="mr-2" />
                      {course.timeSlot || 'Timeslot'}
                  </div>

                  <button 
                    onClick={() => handleEnrollInCourse(course._id)}
                    className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition duration-200"
                    disabled={enrolling === course._id}
                  >
                    {enrolling === course._id ? 'Enrolling...' : 'Confirm Slot & Proceed to Payment'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
             <div className="bg-white rounded-xl shadow-sm p-12">
                 <EmptyState 
                    title="No sessions found for your grade"
                    description={`We couldn't find any available slots for Grade ${gradeDisplay} ${studentSyllabus}.`}
                    icon={BookOpen}
                    actionLabel="Request a custom time slot"
                    onAction={() => setIsModalOpen(true)}
                 />
             </div>
        )}
        
        {/* Call to action for custom request */}
        {courses.length > 0 && (
            <div className="mt-8 text-center text-gray-500">
                Can't find a time that works? {' '}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-teal-600 font-medium hover:underline"
                >
                    Request a custom time slot
                </button>
            </div>
        )}
      </div>

      <CustomTimeRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialSubject={selectedSubject}
      />
    </StudentLayout>
  );
};

export default BookTuitionSessions;
