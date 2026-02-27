import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import {
  createCourseThunk,
  fetchCoursesPaginated,
  updateCourseAdmin,
} from "../../features/admin/adminThunk";
import {
  selectCoursesLoading,
  selectAllCourses, 
} from "../../features/admin/adminSelectors";
import { CourseModal } from "../../components/admin/CourseModal";
import { CourseDetailsModal } from "../../components/admin/CourseDetailsModal";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import {
  SearchAndFilters,
  type FilterConfig,
} from "../../components/ui/SearchAndFilters";
import type { Course } from "../../types/courseTypes";
import type { CourseRequest } from "../../types/studentTypes";
import {
  Plus,
  Edit2,
  Eye,
  BookOpen,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { showToast } from "../../utils/toast";
import AdminCourseRequestsPage from "./courseRequests";
import AdminEnrollmentsPage from "./AdminEnrollmentsPage";
import { useDebounce } from "../../hooks/useDebounce";

// Tab types
type TabType = 'courses' | 'requests' | 'enrollments';

interface TabButtonProps {
  id: TabType;
  label: string;
  active: boolean;
  onClick: (id: TabType) => void;
  icon?: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ id, label, active, onClick, icon }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
      active 
        ? "text-cyan-700 bg-cyan-50/50" 
        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
    }`}
  >
    {icon}
    {label}
    {active && (
      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-600 rounded-t-full" />
    )}
  </button>
);

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const CreateOneToOneCourse: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const courses = useSelector(selectAllCourses);
  const coursesPagination = useSelector((state: RootState) => state.admin.coursesPagination);
  const loading = useSelector(selectCoursesLoading);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Courses");
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState<{
    status: 'available' | 'booked' | 'ongoing' | 'completed' | 'cancelled' | '';
    grade: string;
  }>({ status: "", grade: "" });
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState<Course | null>(null);
  const [initialCourseValues, setInitialCourseValues] = useState<Partial<Parameters<typeof createCourseThunk>[0]> | null>(null);
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourseForDetails, setSelectedCourseForDetails] = useState<Course | null>(null);

  const gradeOptions = useMemo(() => {
    const map = new Map<string, string>();

    courses.forEach((course: Course) => {
      if (course.grade?._id && course.grade?.name) {
        map.set(course.grade._id, course.grade.name);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({
      label: name,
      value: id,           
    }));
  }, [courses]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: "status",
      label: "All Status",
      options: [
        { label: "Available", value: "available" },
        { label: "Booked", value: "booked" },
        { label: "Ongoing", value: "ongoing" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      key: "grade",
      label: "All Grades",
      options: gradeOptions,
    },
  ], [gradeOptions]);

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch courses when pagination/search/filters change
  const fetchCourses = useCallback(() => {
    dispatch(fetchCoursesPaginated({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      gradeId: filters.grade || undefined,
    }));
  }, [dispatch, currentPage, itemsPerPage, debouncedSearch, filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "booked": return <Users className="w-4 h-4 text-blue-500" />;
      case "ongoing": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "completed": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
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

  const handleAddCourse = useCallback(() => {
    setSelectedCourseForEdit(null);
    setShowCourseModal(true);
  }, []);

  const handleEditCourse = useCallback((course: Course) => {
    setSelectedCourseForEdit(course);
    setShowCourseModal(true);
  }, []);

  const handleCloseCourseModal = useCallback(() => {
    setShowCourseModal(false);
    setSelectedCourseForEdit(null);
  }, []);

  const handleSaveCourse = useCallback(async (courseData: Parameters<typeof createCourseThunk>[0]) => {
    try {
      if (selectedCourseForEdit) {
        await dispatch(updateCourseAdmin({ courseId: selectedCourseForEdit._id, data: courseData })).unwrap();
        showToast.success("Course updated successfully!");
      } else {
        await dispatch(createCourseThunk(courseData)).unwrap();
        showToast.success("Course created successfully!");
      }
      handleCloseCourseModal();
      fetchCourses(); 
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast.error(err?.message || "Failed to save course");
    }

  }, [dispatch, handleCloseCourseModal, fetchCourses, selectedCourseForEdit]);

  const handleEditFromDetails = useCallback((course: Course) => {
    setShowDetailsModal(false);
    handleEditCourse(course);
  }, [handleEditCourse]);

  const columns: Column<Course>[] = useMemo(() => [
    {
      header: "Course",
      accessor: (row: Course) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {row.subject.subjectName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.subject.subjectName}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">{row.grade.name}</p>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                row.courseType === 'group' 
                  ? "bg-indigo-100 text-indigo-700" 
                  : "bg-blue-100 text-blue-700"
              }`}>
                {row.courseType === 'group' ? 'Group' : '1:1'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Mentor",
      accessor: (row: Course) => (
        <div className="flex items-center space-x-3">
          {row.mentor.profileImageUrl || row.mentor.profilePicture ? (
            <img 
              src={row.mentor.profileImageUrl || row.mentor.profilePicture} 
              alt={row.mentor.fullName} 
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-sm border-2 border-white shadow-sm">
              {row.mentor.fullName?.charAt(0) || 'M'}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm">{row.mentor.fullName}</p>
            <p className="text-xs text-gray-500">Mentor</p>
          </div>
        </div>
      ),
    },
    {
      header: "Schedule",
      accessor: (row: Course) => {
        const dayNames = row.schedule?.days?.join(", ");
        const legacyDay = row.dayOfWeek !== undefined ? DAYS[row.dayOfWeek] : null;
        return (
          <div className="text-sm">
            <p className="font-medium">{dayNames || legacyDay || "No Day Set"}</p>
            <p className="text-gray-500">{row.schedule?.timeSlot || row.timeSlot}</p>
          </div>
        );
      },
    },
    {
      header: "Dates",
      accessor: (row: Course) => (
        <span className="text-sm text-gray-600">
          {new Date(row.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
          {new Date(row.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row: Course) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: Course) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCourseForDetails(row);
              setShowDetailsModal(true);
            }} 
            className="text-cyan-600 hover:bg-cyan-50 p-2 rounded"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditCourse(row);
            }}
            className="text-blue-600 hover:bg-blue-50 p-2 rounded"
          >
            <Edit2 size={16} />
          </button>
        </div>
      ),
    },
  ], [handleEditCourse]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setFilters({ status: "", grade: "" });
  }, []);

  const handleCreateCourseFromRequest = useCallback((request: CourseRequest) => {
    // 1. Build maps for Name -> ID (Fallback for legacy data)
    const gradeMap = new Map<string, string>();
    const subjectMap = new Map<string, string>();
    
    courses.forEach((c: Course) => {
       if (c.grade?._id && c.grade?.name) gradeMap.set(c.grade.name, c.grade._id);
       if (c.subject?._id && c.subject?.subjectName) subjectMap.set(c.subject.subjectName, c.subject._id);
    });

    const foundGradeId = gradeMap.get(request.grade) || "";
    const foundSubjectId = subjectMap.get(request.subject) || "";

    const prefilledValues = {
       gradeId: request.gradeId || foundGradeId,
       subjectId: request.subjectId || foundSubjectId,
       subjectName: request.subject || "",
       syllabus: request.syllabus || "",
       selectedDays: request.preferredDays || [],
       timeSlot: request.timeSlot || "",
       courseType: request.mentoringMode,
       studentId: typeof request.student === 'object' ? request.student.id : request.student,
    };
    
    setInitialCourseValues(prefilledValues);
    setSelectedCourseForEdit(null); // Ensure creation mode
    setShowCourseModal(true);
  }, [courses, setShowCourseModal, setInitialCourseValues, setSelectedCourseForEdit]); 

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        activeItem={activeNav}
        onItemClick={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Courses Management"
          user={{ name: "Admin User", email: "admin@mentora.com" }}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{courses.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Available</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {courses.filter((c: Course) => c.status === "available").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Booked</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {courses.filter((c: Course) => c.status === "booked").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          
          {/* Tabs Header */}
           <div className="bg-white border-b border-gray-200 mb-6 sticky top-0 z-10">
              <div className="flex px-6">
                <TabButton 
                  id="courses" 
                  label="All Courses" 
                  active={activeTab === 'courses'} 
                  onClick={setActiveTab}
                  icon={<BookOpen size={18} />}
                />
                <TabButton 
                  id="requests" 
                  label="Course Requests" 
                  active={activeTab === 'requests'} 
                  onClick={setActiveTab}
                  icon={<AlertCircle size={18} />}
                />
                 <TabButton 
                  id="enrollments" 
                  label="Enrollments" 
                  active={activeTab === 'enrollments'} 
                  onClick={setActiveTab}
                  icon={<Users size={18} />}
                />
              </div>
          </div>

          {activeTab === 'courses' && (
            <>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold">All Courses</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Showing {courses.length} of {coursesPagination.totalStudents} courses
                      {(searchTerm || filters.status || filters.grade) && ` (filtered)`}
                    </p>
                  </div>
                  <button
                    onClick={handleAddCourse}
                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium"
                  >
                    <Plus size={20} />
                    Add Course
                  </button>
                </div>
              </div>

               <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={filters}
                onFilterChange={handleFilterChange}
                filterConfigs={filterConfigs}
                onClearFilters={handleClearFilters}
                searchPlaceholder="Search by grade, subject, or mentor..."
                className="mb-6"
              />

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <DataTable<Course>
                  columns={columns}
                  data={courses}
                  loading={loading}
                  onRowClick={(c: Course) => navigate(`/admin/course/${c._id}`)}
                  emptyMessage="No courses found"
                />
              </div>

              {coursesPagination.totalStudents > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={coursesPagination.totalPages}
                  onPageChange={handlePageChange}
                  totalItems={coursesPagination.totalStudents}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <AdminCourseRequestsPage onCreateCourse={handleCreateCourseFromRequest} />
          )}

          {activeTab === 'enrollments' && (
             <AdminEnrollmentsPage />
          )}

          <CourseModal
            course={selectedCourseForEdit}
            initialValues={initialCourseValues}
            isOpen={showCourseModal}
            onClose={handleCloseCourseModal}
            onSave={handleSaveCourse}
            loading={loading}
          />
          
          <CourseDetailsModal
            course={selectedCourseForDetails}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            onEdit={handleEditFromDetails}
          />
        </div>
      </main>
    </div>
  );
};

export default CreateOneToOneCourse;
