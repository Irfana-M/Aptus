import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { type AdminCreateStudentInput } from '../../lib/schemas/student.schemas';
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
  selectStudentsLoading,
} from "../../features/admin/adminSelectors";
import { Student } from "../../models/Student";
import type { StudentBaseResponseDto } from "../../types/student.types";
import { StudentModal } from "../../components/admin/StudentModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
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
  Calendar,
} from "lucide-react";
import { showToast } from "../../utils/toast";
import { Loader } from "../../components/ui/Loader";
import type { Column } from "../../types/table.types";

import { AdminLayout } from "../../components/admin/AdminLayout";

export const StudentsManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const students = useSelector(selectAllStudents);
  const loading = useSelector(selectStudentsLoading);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    verification: "",
    trialClasses: "",
    plan: "",
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
  {
    key: "plan",
    label: "Subscription Plan",
    options: [
      { label: "None", value: "none" },
      { label: "Monthly", value: "monthly" },
      { label: "Yearly", value: "yearly" },
    ],
  },
  ];

  useEffect(() => {
    dispatch(fetchAllStudentsAdmin());
  }, [dispatch]);



  const filteredStudents = useMemo(() => {
    return students
      .map(data => new Student(data))
      .filter((student) => {
        const matchesSearch =
          searchTerm === "" ||
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.id.toString().includes(searchTerm) ||
          (student.phone && student.phone.includes(searchTerm));

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
          (filters.trialClasses === 'with_trial' && (student.trialSummary?.total || 0) > 0) ||
          (filters.trialClasses === 'pending' && (student.trialSummary?.pending || 0) > 0) ||
          (filters.trialClasses === 'none' && !student.trialSummary);

        const matchesPlan =
          filters.plan === "" ||
          (filters.plan === 'none' && (!student.subscription || student.subscription.status === 'expired' || student.subscription.status === 'cancelled')) ||
          (filters.plan === 'monthly' && student.subscription?.plan === 'monthly' && student.subscription.status === 'active') ||
          (filters.plan === 'yearly' && student.subscription?.plan === 'yearly' && student.subscription.status === 'active');

        return matchesSearch && matchesStatus && matchesVerification && matchesTrialClasses && matchesPlan;
      });
  }, [students, searchTerm, filters]);

  useEffect(() => {
    pagination.goToPage(1);
  }, [searchTerm, filters, pagination]);

  const paginatedStudents = pagination.paginatedData(filteredStudents);

  // Calculate stats using models
  const stats = useMemo(() => {
    const total = students.length;
    const studentModels = students.map(s => new Student(s));
    
    const verified = studentModels.filter((s) => s.isVerified).length;
    const paid = studentModels.filter((s) => s.isPaid).length;
    const blocked = studentModels.filter((s) => s.isBlocked).length;
    const totalTrialClasses = studentModels.reduce((sum, s) => sum + (s.trialSummary?.total || 0), 0);
    const studentsWithTrialClasses = studentModels.filter(s => !!s.trialSummary).length;

    return {
      total,
      verified,
      paid,
      blocked,
      totalTrialClasses,
      studentsWithTrialClasses,
    };
  }, [students]);


  
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
      
    } catch (error: unknown) {
      showToast.dismiss();
      const err = error as { message?: string };
      const action = selectedStudent.action === 'block' ? 'block' : 'unblock';
      const errorMessage = err.message || `Failed to ${action} ${selectedStudent.name}`;
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
    .then(() => {
      // Navigate to trial classes page - using plural 'students' to match route
      navigate(`/admin/students/${studentId}/trial-classes`);
    })
    .catch(error => {
      showToast.error(error);
    });
};

  const handleSaveStudent = async (studentData: Partial<StudentBaseResponseDto>) => {
    try {
      if (selectedStudentForEdit) {
        await dispatch(updateStudentAdmin({
          studentId: selectedStudentForEdit.id,
          data: studentData
        })).unwrap();
        showToast.success("Student updated successfully");
      } else {
        await dispatch(addStudentAdmin(studentData as AdminCreateStudentInput)).unwrap();
        showToast.success("Student added successfully");
      }
      
      handleCloseStudentModal();


    } catch (error: unknown) {
      const err = error as { message?: string };
      const action = selectedStudentForEdit ? "update" : "add";
      const errorMessage = err.message || `Failed to ${action} student`;
      showToast.error(errorMessage);
      console.error(`Failed to ${action} student:`, error);
    }
  };

  const columns: Column<Student>[] = [
    {
      header: "Student",
      accessor: (student) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {student.initials}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{student.name}</p>
            <p className="text-sm text-gray-500">{student.email}</p>
            {student.trialSummary && (
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${student.trialSummary.color}`}>
                  {student.trialSummary.text}
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
      accessor: (student) => (
        <div className="text-sm">
          <p className="text-gray-900">{student.phone}</p>
          <p className="text-gray-500">ID: {student.id}</p>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (student) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${student.statusColor}`}>
              {student.statusText}
            </span>
          </div>
          {student.isPaid && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <CreditCard className="w-3 h-3 mr-1" />
              Paid
            </span>
          )}
          {student.trialSummary && student.trialSummary.status !== 'completed' && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${student.trialSummary.color}`}>
              {student.trialSummary.icon === 'Clock' && <Clock className="w-3 h-3 mr-1" />}
              {student.trialSummary.icon === 'Calendar' && <Calendar className="w-3 h-3 mr-1" />}
              {student.trialSummary.text}
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: "Subscription",
      accessor: (student) => (
        <div className="flex flex-col gap-1">
          <span className={`font-medium ${student.isSubscriptionActive ? 'text-gray-900' : 'text-gray-400'}`}>
            {student.subscriptionPlan}
          </span>
          {student.isSubscriptionActive && (
            <span className="text-xs text-gray-500">
              Expires: {student.subscriptionExpiryDate}
            </span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: "Joined Date",
      accessor: (student) => (
        <span className="text-gray-600 text-sm">
          {student.joinedDate}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (student) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          {/* Only show trial classes button if student has pending/assigned trial classes (not completed) */}
          {(student.trialSummary?.pending || 0) > 0 && (
            <button
              onClick={() => handleViewTrialClasses(student.id)}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
              title="View Trial Classes"
            >
              <Eye size={16} />
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/admin/students/${student.id}`);
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
              handleEditStudent(student.data);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit Student"
          >
            <Edit2 size={16} />
          </button>
          {student.isBlocked ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnblockClick(student.id, student.name);
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
                handleBlockClick(student.id, student.name);
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
    setFilters({ status: "", verification: "", trialClasses: "", plan: "" });
  };

  const handleSort = (
    column: keyof Student,
    direction: "asc" | "desc"
  ) => {
    console.log(`Sort by ${String(column)} ${direction}`);
  };

  if (loading && students.length === 0) {
    return (
      <AdminLayout title="Students Management" activeItem="Students">
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Loader size="lg" text="Loading students..." color="purple" />
        </div>
      </AdminLayout>
    );
  }
  

  return (
    <AdminLayout title="Students Management" activeItem="Students">
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
        <DataTable<Student>
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
    </AdminLayout>
  );
};

export default StudentsManagement;

