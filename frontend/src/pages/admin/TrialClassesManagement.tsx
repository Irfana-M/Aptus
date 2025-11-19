import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../app/store";
import { 
  fetchAllTrialClassesAdmin,
  assignMentorToTrialClass
} from "../../features/admin/adminThunk";
import {
  selectAllTrialClasses,
  selectAdminLoading,
} from "../../features/admin/adminSelectors";
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
  Clock,
  CheckCircle,
  XCircle,
  User,
  BookOpen,
  Video,
  Eye,
} from "lucide-react";
import { showToast } from "../../utils/toast";
import { MentorAssignmentModal } from "../../components/admin/MentorAssignmentModal";
import type { TrialClassResponse } from "../../types/trialTypes";
interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

export const TrialClassesManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const trialClasses = useSelector(selectAllTrialClasses);
  const loading = useSelector(selectAdminLoading);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Trial Classes");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    subject: "",
  });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTrialClass, setSelectedTrialClass] = useState<TrialClassResponse | null>(null);

  const pagination = usePagination({
    totalItems: trialClasses.length,
    initialPage: 1,
    initialItemsPerPage: 10,
  });

  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "All Status",
      options: [
        { label: "Requested", value: "requested" },
        { label: "Assigned", value: "assigned" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      key: "subject",
      label: "Subject",
      options: [
        { label: "Mathematics", value: "mathematics" },
        { label: "Science", value: "science" },
        { label: "English", value: "english" },
      ],
    },
  ];

  useEffect(() => {
    dispatch(fetchAllTrialClassesAdmin());
  }, [dispatch]);

  const filteredTrialClasses = useMemo(() => {
    return trialClasses.filter((trial) => {
      const matchesSearch =
        searchTerm === "" ||
        trial.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trial.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trial.subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filters.status === "" || trial.status === filters.status;

      const matchesSubject =
        filters.subject === "" || 
        trial.subject.subjectName.toLowerCase().includes(filters.subject.toLowerCase());

      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [trialClasses, searchTerm, filters]);

  useEffect(() => {
    pagination.goToPage(1);
  }, [searchTerm, filters]);

  const paginatedTrialClasses = pagination.paginatedData(filteredTrialClasses);

  // Calculate stats
  const stats = useMemo(() => {
    const total = trialClasses.length;
    const requested = trialClasses.filter((trial) => trial.status === 'requested').length;
    const assigned = trialClasses.filter((trial) => trial.status === 'assigned').length;
    const completed = trialClasses.filter((trial) => trial.status === 'completed').length;

    return {
      total,
      requested,
      assigned,
      completed,
    };
  }, [trialClasses]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'assigned':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return "bg-yellow-100 text-yellow-800";
      case 'assigned':
        return "bg-blue-100 text-blue-800";
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'cancelled':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAssignMentor = (trialClass: TrialClassResponse) => {
    setSelectedTrialClass(trialClass);
    setShowAssignmentModal(true);
  };

  const handleMentorAssignment = async (mentorId: string, scheduledDate: string, scheduledTime: string) => {
    if (!selectedTrialClass) return;

    try {
      const loadingToastId = showToast.loading("Assigning mentor...");

      await dispatch(assignMentorToTrialClass({
        trialClassId: selectedTrialClass.id,
        mentorId,
        scheduledDate,
        scheduledTime
      })).unwrap();

      showToast.success("Mentor assigned successfully!");
      showToast.dismiss(loadingToastId);
      setShowAssignmentModal(false);
      setSelectedTrialClass(null);
      
      // Refresh the trial classes list
      dispatch(fetchAllTrialClassesAdmin());
      
    } catch (error: any) {
      showToast.dismiss();
      const errorMessage = error?.message || "Failed to assign mentor";
      showToast.error(errorMessage);
      console.error("Failed to assign mentor:", error);
    }
  };

  const columns: Column<TrialClassResponse>[] = [
    {
      header: "Student",
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {row.student.fullName?.split(" ").map((n) => n[0]).join("") || "U"}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.student.fullName}</p>
            <p className="text-sm text-gray-500">{row.student.email}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Subject & Grade",
      accessor: (row) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900">{row.subject.subjectName}</p>
          <p className="text-gray-500">{row.subject.syllabus} - Grade {row.subject.grade}</p>
        </div>
      ),
    },
    {
      header: "Preferred Time",
      accessor: (row) => (
        <div className="text-sm">
          <p className="text-gray-900">
            {new Date(row.preferredDate).toLocaleDateString()}
          </p>
          <p className="text-gray-500">{row.preferredTime}</p>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Status",
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.status)}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Mentor",
      accessor: (row) => (
        <div className="text-sm">
          {row.mentor ? (
            <div>
              <p className="font-medium text-gray-900">{row.mentor.name}</p>
              <p className="text-gray-500">{row.mentor.email}</p>
              {row.meetLink && (
                <a 
                  href={row.meetLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 mt-1"
                >
                  <Video size={12} />
                  Join Meeting
                </a>
              )}
            </div>
          ) : (
            <span className="text-gray-400">Not assigned</span>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/admin/trial-class/${row.id}`);
            }}
            className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors duration-200"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          
          {row.status === 'requested' && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAssignMentor(row);
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title="Assign Mentor"
            >
              <User size={16} />
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
    setFilters({ status: "", subject: "" });
  };

  const handleSort = (
    column: keyof TrialClassResponse,
    direction: "asc" | "desc"
  ) => {
    console.log(`Sort by ${String(column)} ${direction}`);
  };

  if (loading && trialClasses.length === 0) {
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
            <p className="text-gray-600">Loading trial classes...</p>
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
          title="Trial Classes Management"
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
                  <p className="text-gray-600 text-sm font-medium">Total Requests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.requested}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Assigned</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.assigned}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
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
            searchPlaceholder="Search by student name, email, or subject..."
            className="mb-6"
          />

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Trial Class Requests</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Showing {paginatedTrialClasses.length} of {filteredTrialClasses.length} requests
                  {filteredTrialClasses.length !== trialClasses.length && ` (filtered from ${trialClasses.length} total)`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <DataTable<TrialClassResponse>
              columns={columns}
              data={paginatedTrialClasses}
              loading={loading}
              onSort={handleSort}
              onRowClick={(trial) => navigate(`/admin/trial-class/${trial.id}`)}
              variant="bordered"
              emptyMessage={
                searchTerm || Object.values(filters).some((f) => f !== "")
                  ? "No trial classes match your search criteria"
                  : "No trial class requests yet"
              }
            />
          </div>

          {filteredTrialClasses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={filteredTrialClasses.length}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.goToPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
                variant="detailed"
                className="px-6 py-4"
              />
            </div>
          )}

          {/* Mentor Assignment Modal */}
          {showAssignmentModal && selectedTrialClass && (
            <MentorAssignmentModal
              isOpen={showAssignmentModal}
              onClose={() => {
                setShowAssignmentModal(false);
                setSelectedTrialClass(null);
              }}
              onAssign={handleMentorAssignment}
              trialClass={selectedTrialClass}
              loading={loading}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default TrialClassesManagement;