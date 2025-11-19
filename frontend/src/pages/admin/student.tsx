import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../app/store";
import { 
  fetchAllStudentsAdmin,
  blockStudentAdmin,
  unblockStudentAdmin,
  addStudentAdmin,
  updateStudentAdmin,
  fetchStudentTrialClasses
} from "../../features/admin/adminThunk";
import {
  selectAllStudents,
  selectAdminLoading,
} from "../../features/admin/adminSelectors";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { StudentModal } from "../../components/admin/StudentModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import {
  SearchAndFilters,
  type FilterConfig,
} from "../../components/ui/SearchAndFilters";
import { usePagination } from "../../hooks/usePagination";
import {
  Plus,
  Edit2,
  Eye,
  Users,
  CheckCircle,
  Clock,
  Ban,
  Check,
  CreditCard,
} from "lucide-react";
import { showToast } from "../../utils/toast";
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Students");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    verification: "",
    trialClasses: "",
  });
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string, action: 'block' | 'unblock'} | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentBaseResponseDto | null>(null);

  const pagination = usePagination({
    totalItems: students.length,
    initialPage: 1,
    initialItemsPerPage: 10,
  });

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
     {
    key: "trialClasses",
    label: "Trial Classes",
    options: [
      { label: "With Trial Classes", value: "with_trial" },
      { label: "Pending Assignment", value: "pending" },
      { label: "No Trial Classes", value: "none" },
    ],
  },
  ];

  useEffect(() => {
    dispatch(fetchAllStudentsAdmin());
  }, [dispatch]);



  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchTerm === "" ||
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.id.toString().includes(searchTerm) ||
        (student.phoneNumber && student.phoneNumber.includes(searchTerm));

      const matchesStatus =
        filters.status === "" || 
        (filters.status === 'active' && !student.isBlocked) ||
        (filters.status === 'blocked' && student.isBlocked);

      const matchesVerification =
        filters.verification === "" ||
        (filters.verification === 'verified' && student.isVerified) ||
        (filters.verification === 'pending' && !student.isVerified);

         const matchesTrialClasses =
      filters.trialClasses === "" ||
      (filters.trialClasses === 'with_trial' && (student.totalTrialClasses || 0) > 0) ||
      (filters.trialClasses === 'pending' && (student.pendingTrialClasses || 0) > 0) ||
      (filters.trialClasses === 'none' && (student.totalTrialClasses || 0) === 0);

      return matchesSearch && matchesStatus && matchesVerification&& matchesTrialClasses;
    });
  }, [students, searchTerm, filters]);

  useEffect(() => {
    pagination.goToPage(1);
  }, [searchTerm, filters]);

  const paginatedStudents = pagination.paginatedData(filteredStudents);

  // Calculate stats
  const stats = useMemo(() => {
    const total = students.length;
    const verified = students.filter((student) => student.isVerified).length;
    const paid = students.filter((student) => student.isPaid).length;
    const blocked = students.filter((student) => student.isBlocked).length;
    const profileComplete = students.filter((student) => student.isProfileComplete).length;
    const totalTrialClasses = students.reduce((sum, student) => sum + (student.totalTrialClasses || 0), 0);
    const pendingTrialClasses = students.reduce((sum, student) => sum + (student.pendingTrialClasses || 0), 0);
    const studentsWithTrialClasses = students.filter(student => (student.totalTrialClasses || 0) > 0).length;

    return {
      total,
      verified,
      paid,
      blocked,
      profileComplete,
      totalTrialClasses,
    pendingTrialClasses,
    studentsWithTrialClasses,
    };
  }, [students]);

  const getStatusIcon = (isVerified: boolean, isBlocked?: boolean) => {
    if (isBlocked) return <Ban className="w-4 h-4 text-red-500" />;
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

  
  const handleBlockClick = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName, action: 'block' });
    setShowBlockModal(true);
  };

  const handleUnblockClick = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName, action: 'unblock' });
    setShowBlockModal(true);
  };

  

  const handleConfirmAction = async () => {
    if (!selectedStudent) return;

    try {
      const loadingToastId = showToast.loading(
        `${selectedStudent.action === 'block' ? 'Blocking' : 'Unblocking'} ${selectedStudent.name}...`
      );

      if (selectedStudent.action === 'block') {
        await dispatch(blockStudentAdmin(selectedStudent.id)).unwrap();
        showToast.success(`${selectedStudent.name} has been blocked successfully`);
      } else {
        await dispatch(unblockStudentAdmin(selectedStudent.id)).unwrap();
        showToast.success(`${selectedStudent.name} has been unblocked successfully`);
      }

      showToast.dismiss(loadingToastId);
      setShowBlockModal(false);
      setSelectedStudent(null);
      
    } catch (error: any) {
      showToast.dismiss();
      const action = selectedStudent.action === 'block' ? 'block' : 'unblock';
      const errorMessage = error?.message || `Failed to ${action} ${selectedStudent.name}`;
      showToast.error(errorMessage);
      console.error(`Failed to ${action} student:`, error);
    }
  };

  
  const handleEditStudent = (student: StudentBaseResponseDto) => {
    setSelectedStudentForEdit(student);
    setShowStudentModal(true);
  };

  const handleAddStudent = () => {
    setSelectedStudentForEdit(null);
    setShowStudentModal(true);
  };

  const handleCloseStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudentForEdit(null);
  };

      const handleViewTrialClasses = (studentId: string) => {
  dispatch(fetchStudentTrialClasses({ studentId }))
    .unwrap()
    .then(trialClasses => {
      console.log('Fetched trial classes:', trialClasses);
      // Navigate to trial classes page or show in modal
      navigate(`/admin/student/${studentId}/trial-classes`);
    })
    .catch(error => {
      showToast.error(error);
    });
};

  const handleSaveStudent = async (studentData: any) => {
    try {
      if (selectedStudentForEdit) {
        await dispatch(updateStudentAdmin({
          studentId: selectedStudentForEdit.id,
          data: studentData
        })).unwrap();
        showToast.success("Student updated successfully");
        dispatch(fetchAllStudentsAdmin());
      } else {
        await dispatch(addStudentAdmin(studentData)).unwrap();
        showToast.success("Student added successfully");
        dispatch(fetchAllStudentsAdmin());
      }
      
      handleCloseStudentModal();


    } catch (error: any) {
      const action = selectedStudentForEdit ? "update" : "add";
      const errorMessage = error?.message || `Failed to ${action} student`;
      showToast.error(errorMessage);
      console.error(`Failed to ${action} student:`, error);
    }
  };

  const columns: Column<StudentBaseResponseDto>[] = [
    {
      header: "Student",
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {row.fullName?.split(" ").map((n) => n[0]).join("") || "U"}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.fullName}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
            {(row.totalTrialClasses && row.totalTrialClasses > 0) && (
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${
                (row.pendingTrialClasses && row.pendingTrialClasses > 0) ? 'bg-yellow-400' : 'bg-green-400'
              }`} />
              <span className="text-xs text-gray-600">
                {row.totalTrialClasses} trial {row.totalTrialClasses === 1 ? 'class' : 'classes'}
                {(row.pendingTrialClasses && row.pendingTrialClasses > 0) && ` (${row.pendingTrialClasses} pending)`}
              </span>
            </div>
          )}
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
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.isVerified, row.isBlocked)}`}>
              {getStatusText(row.isVerified, row.isBlocked)}
            </span>
          </div>
          {row.isPaid && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CreditCard className="w-3 h-3 mr-1" />
              Paid
            </span>
          )}
           {(row.pendingTrialClasses && row.pendingTrialClasses > 0) && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            {row.pendingTrialClasses} Pending Trial
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
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
    <button
        onClick={() => handleViewTrialClasses(row.id)}
        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
        title="View Trial Classes"
      >
        <Eye size={16} />
      </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`${row.id}/trial-classes`);
            }}
            className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors duration-200"
            title="View Profile"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEditStudent(row);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit Student"
          >
            <Edit2 size={16} />
          </button>
          {row.isBlocked ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnblockClick(row.id, row.fullName);
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title="Unblock Student"
            >
              <Check size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBlockClick(row.id, row.fullName);
              }}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
              title="Block Student"
            >
              <Ban size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({ status: "", verification: "", trialClasses: "" });
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
      <Sidebar
        isOpen={sidebarOpen}
        activeItem={activeNav}
        onItemClick={setActiveNav}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Students Management"
          user={{
            name: "Admin User",
            email: "admin@mentora.com",
          }}
        />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
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
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.verified}</p>
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
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.paid}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Blocked</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.blocked}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center">
                  <Ban className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

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

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Students</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Showing {paginatedStudents.length} of {filteredStudents.length} students
                  {filteredStudents.length !== students.length && ` (filtered from ${students.length} total)`}
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

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <DataTable<StudentBaseResponseDto>
              columns={columns}
              data={paginatedStudents}
              loading={loading}
              onSort={handleSort}
              onRowClick={(student) => navigate(`/admin/student/${student.id}`)}
              variant="bordered"
              emptyMessage={
                searchTerm || Object.values(filters).some((f) => f !== "")
                  ? "No students match your search criteria"
                  : "No students have been added yet"
              }
            />
          </div>

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

          {/* Confirmation Modal for Block/Unblock */}
          {showBlockModal && selectedStudent && (
            <ConfirmationModal
              isOpen={showBlockModal}
              onClose={() => {
                setShowBlockModal(false);
                setSelectedStudent(null);
              }}
              onConfirm={handleConfirmAction}
              title={`Confirm ${selectedStudent.action === 'block' ? 'Block' : 'Unblock'}`}
              message={`Are you sure you want to ${selectedStudent.action} ${selectedStudent.name}? ${
                selectedStudent.action === 'block' 
                  ? 'They will not be able to access the platform.' 
                  : 'They will regain access to the platform.'
              }`}
              confirmText={selectedStudent.action === 'block' ? 'Block' : 'Unblock'}
              variant="danger"
              isLoading={loading}
            />
          )}

          {/* Student Modal for Add/Edit */}
          {showStudentModal && (
            <StudentModal
              student={selectedStudentForEdit}
              onClose={handleCloseStudentModal}
              onSave={handleSaveStudent}
              isOpen={showStudentModal}
              loading={loading}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentsManagement;