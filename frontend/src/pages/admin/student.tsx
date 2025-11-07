import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import type { AppDispatch } from "../../app/store";
import { addStudentAdmin, fetchAllStudentsAdmin } from "../../features/admin/adminThunk";
import {
  selectAllStudents,
  selectAdminLoading,
  selectAdminError,
  selectSelectedStudent,
  selectFilteredStudents,
  selectStudentStats,
  selectAdminSuccess,
} from "../../features/admin/adminSelectors";
import {
  setSelectedStudent,
  clearError,
  clearSuccess,
} from "../../features/admin/adminSlice";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
//import type { AddStudentRequestDto } from "../../features/admin/adminApi";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import {
  SearchAndFilters,
  type FilterConfig,
} from "../../components/ui/SearchAndFilters";
import { usePagination } from "../../hooks/usePagination";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

export const StudentsManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const students = useSelector(selectAllStudents);
  const loading = useSelector(selectAdminLoading);
  const error = useSelector(selectAdminError);
  const success = useSelector(selectAdminSuccess); // MOVED INSIDE COMPONENT
  const selectedStudent = useSelector(selectSelectedStudent);
  const stats = useSelector(selectStudentStats);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Students");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    verification: "",
  });
  const [showModal, setShowModal] = useState(false);

  // Initialize pagination
  const pagination = usePagination({
    totalItems: students.length,
    initialPage: 1,
    initialItemsPerPage: 10,
  });

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "All Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Blocked", value: "blocked" },
      ],
    },
    {
      key: "verification",
      label: "Verification Status",
      options: [
        { label: "Verified", value: "verified" },
        { label: "Pending", value: "pending" },
      ],
    },
  ];

  useEffect(() => {
    dispatch(fetchAllStudentsAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Add effect to clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const filteredStudents = useSelector((state: any) =>
    selectFilteredStudents(state, searchTerm)
  );

  useEffect(() => {
    pagination.goToPage(1);
  }, [searchTerm, filters]);

  const paginatedStudents = pagination.paginatedData(filteredStudents);

  const getStatusIcon = (isVerified: boolean, isBlocked?: boolean) => {
    if (isBlocked) return <XCircle className="w-4 h-4 text-red-500" />;
    if (isVerified) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusColor = (isVerified: boolean, isBlocked?: boolean) => {
    if (isBlocked) return "bg-red-100 text-red-800";
    if (isVerified) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (isVerified: boolean, isBlocked?: boolean) => {
    if (isBlocked) return "Blocked";
    if (isVerified) return "Verified";
    return "Pending";
  };

  // UPDATE: Proper handleSaveStudent function
  const handleSaveStudent = async (studentData: Partial<StudentBaseResponseDto>) => {
    try {
      await dispatch(addStudentAdmin({
        fullName: studentData.fullName!,
        email: studentData.email!,
        phoneNumber: studentData.phoneNumber,
      })).unwrap();
      
      // Modal will close automatically due to the success action
      handleCloseModal();
    } catch (error) {
      // Error is handled by the thunk
      console.error('Failed to add student:', error);
    }
  };

  const columns: Column<StudentBaseResponseDto>[] = [
    {
      header: "Student",
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {row.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.fullName}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Contact",
      accessor: (row) => (
        <div className="text-sm">
          <p className="text-gray-900">{row.phoneNumber || "N/A"}</p>
          <p className="text-gray-500">ID: {row.id}</p>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(row.isVerified, row.isBlocked)}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                row.isVerified,
                row.isBlocked
              )}`}
            >
              {getStatusText(row.isVerified, row.isBlocked)}
            </span>
          </div>
          {row.isPaid && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Paid
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: "Joined Date",
      accessor: (row) => (
        <span className="text-gray-600 text-sm">
          {new Date(row.createdAt || "").toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewStudent(row)}
            className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors duration-200"
            title="View Profile"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEditStudent(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit Student"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDeleteStudent(row.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete Student"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({ status: "", verification: "" });
  };

  const handleViewStudent = (student: StudentBaseResponseDto) => {
    navigate(`/admin/student/${student.id}`);
  };

  const handleEditStudent = (student: StudentBaseResponseDto) => {
    dispatch(setSelectedStudent(student));
    setShowModal(true);
  };

  const handleAddStudent = () => {
    dispatch(setSelectedStudent(null));
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    dispatch(setSelectedStudent(null));
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      console.log("Delete student:", studentId);
    }
  };

  const handleSort = (
    column: keyof StudentBaseResponseDto,
    direction: "asc" | "desc"
  ) => {
    console.log(`Sort by ${String(column)} ${direction}`);
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          isOpen={sidebarOpen}
          activeItem={activeNav}
          onItemClick={setActiveNav}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Reusable Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        activeItem={activeNav}
        onItemClick={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Reusable Topbar */}
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Students Management"
          user={{
            name: "Admin User",
            email: "admin@mentora.com",
          }}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Students
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.total}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Verified</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.verified}
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
                  <p className="text-gray-600 text-sm font-medium">Paid</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.paid}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Blocked</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.blocked}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Success Display */}
          {success && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Search and Filters */}
          <SearchAndFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={handleFilterChange}
            filterConfigs={filterConfigs}
            onClearFilters={handleClearFilters}
            searchPlaceholder="Search students by name, email, or ID..."
            className="mb-6"
          />

          {/* Action Bar */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  All Students
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Showing {paginatedStudents.length} of{" "}
                  {filteredStudents.length} students
                  {filteredStudents.length !== students.length &&
                    ` (filtered from ${students.length} total)`}
                </p>
              </div>

              <button
                onClick={handleAddStudent}
                className="flex items-center justify-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium"
              >
                <Plus size={20} />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <DataTable<StudentBaseResponseDto>
              columns={columns}
              data={paginatedStudents}
              loading={loading}
              onSort={handleSort}
              onRowClick={handleViewStudent}
              variant="bordered"
              emptyMessage={
                searchTerm || Object.values(filters).some((f) => f !== "")
                  ? "No students match your search criteria"
                  : "No students have been added yet"
              }
            />
          </div>

          {/* Pagination */}
          {filteredStudents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={filteredStudents.length}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.goToPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
                variant="detailed"
                className="px-6 py-4"
              />
            </div>
          )}

          {/* Student Modal */}
          {showModal && (
            <StudentModal
              student={selectedStudent}
              onClose={handleCloseModal}
              onSave={handleSaveStudent}
            />
          )}
        </div>
      </main>
    </div>
  );
};

interface StudentModalProps {
  student?: StudentBaseResponseDto | null;
  onClose: () => void;
  onSave: (data: Partial<StudentBaseResponseDto>) => void;
}

const StudentModal: React.FC<StudentModalProps> = ({
  student,
  onClose,
  onSave,
}) => {
//  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAdminLoading);
  const [formData, setFormData] = useState<Partial<StudentBaseResponseDto>>(
    student || {
      fullName: "",
      email: "",
      phoneNumber: "",
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    await onSave(formData);
  };

  const handleChange = (field: keyof StudentBaseResponseDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {student ? "Edit Student" : "Add Student"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName || ""}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className={`w-full p-2 bg-white border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              disabled={loading}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              className={`w-full p-2 bg-white border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-600 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phoneNumber || ""}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:bg-purple-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding...
                </div>
              ) : (
                `${student ? "Update" : "Add"} Student`
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentsManagement;