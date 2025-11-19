import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "../../app/store";
import { 
  fetchAllMentorsAdmin, 
  blockMentorAdmin, 
  unblockMentorAdmin,
  addMentorAdmin,
  updateMentorAdmin
} from "../../features/admin/adminThunk";
import {
  selectAllMentors,
  selectAdminLoading,
} from "../../features/admin/adminSelectors";
import type { MentorProfile } from "../../features/mentor/mentorSlice";
import { MentorModal } from "../../components/admin/MentorModal";
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
  XCircle,
  Clock,
  Ban,
  Check,
} from "lucide-react";
import { showToast } from "../../utils/toast";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

export const MentorsManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const mentors = useSelector(selectAllMentors);
  const loading = useSelector(selectAdminLoading);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Mentors");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    subject: "",
  });
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<{id: string, name: string, action: 'block' | 'unblock'} | null>(null);
  const [selectedMentorForEdit, setSelectedMentorForEdit] = useState<MentorProfile | null>(null);

  const pagination = usePagination({
    totalItems: mentors.length,
    initialPage: 1,
    initialItemsPerPage: 10,
  });

  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "All Status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
    },
    {
      key: "subject",
      label: "All Subjects",
      options: [
        { label: "Mathematics", value: "Mathematics" },
        { label: "Physics", value: "Physics" },
        { label: "Chemistry", value: "Chemistry" },
        { label: "Biology", value: "Biology" },
        { label: "Computer Science", value: "Computer Science" },
        { label: "English", value: "English" },
      ],
    },
  ];

  useEffect(() => {
    dispatch(fetchAllMentorsAdmin());
  }, [dispatch]);

  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      const matchesSearch =
        searchTerm === "" ||
        mentor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.subjectProficiency && mentor.subjectProficiency.some((subj) =>
          subj.subject.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      const matchesStatus =
        filters.status === "" || mentor.approvalStatus === filters.status;

      const matchesSubject =
        filters.subject === "" ||
        (mentor.subjectProficiency && mentor.subjectProficiency.some(
          (subj) => subj.subject === filters.subject
        ));

      return matchesSearch && matchesStatus && matchesSubject;
    });
  }, [mentors, searchTerm, filters]);

  useEffect(() => {
    pagination.goToPage(1);
  }, [searchTerm, filters]);

  const paginatedMentors = pagination.paginatedData(filteredMentors);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Block/Unblock handlers
  const handleBlockClick = (mentorId: string, mentorName: string) => {
    setSelectedMentor({ id: mentorId, name: mentorName, action: 'block' });
    setShowBlockModal(true);
  };

  const handleUnblockClick = (mentorId: string, mentorName: string) => {
    setSelectedMentor({ id: mentorId, name: mentorName, action: 'unblock' });
    setShowBlockModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedMentor) return;

    try {
      const loadingToastId = showToast.loading(
        `${selectedMentor.action === 'block' ? 'Blocking' : 'Unblocking'} ${selectedMentor.name}...`
      );

      if (selectedMentor.action === 'block') {
        await dispatch(blockMentorAdmin(selectedMentor.id)).unwrap();
        showToast.success(`${selectedMentor.name} has been blocked successfully`);
      } else {
        await dispatch(unblockMentorAdmin(selectedMentor.id)).unwrap();
        showToast.success(`${selectedMentor.name} has been unblocked successfully`);
      }

      showToast.dismiss(loadingToastId);
      setShowBlockModal(false);
      setSelectedMentor(null);
      
    } catch (error: any) {
      showToast.dismiss();
      const action = selectedMentor.action === 'block' ? 'block' : 'unblock';
      const errorMessage = error?.message || `Failed to ${action} ${selectedMentor.name}`;
      showToast.error(errorMessage);
      console.error(`Failed to ${action} mentor:`, error);
    }
  };

  // Mentor add/edit handlers
  const handleEditMentor = (mentor: MentorProfile) => {
    setSelectedMentorForEdit(mentor);
    setShowMentorModal(true);
  };

  const handleAddMentor = () => {
    setSelectedMentorForEdit(null);
    setShowMentorModal(true);
  };

  const handleCloseMentorModal = () => {
    setShowMentorModal(false);
    setSelectedMentorForEdit(null);
  };

  const handleSaveMentor = async (mentorData: any) => {
    try {
      if (selectedMentorForEdit) {
        await dispatch(updateMentorAdmin({
          mentorId: selectedMentorForEdit._id,
          data: mentorData
        })).unwrap();
        showToast.success("Mentor updated successfully");
      } else {
        await dispatch(addMentorAdmin(mentorData)).unwrap();
        showToast.success("Mentor added successfully");
      }
      
      handleCloseMentorModal();
    } catch (error: any) {
      const action = selectedMentorForEdit ? "update" : "add";
      const errorMessage = error?.message || `Failed to ${action} mentor`;
      showToast.error(errorMessage);
      console.error(`Failed to ${action} mentor:`, error);
    }
  };

  const columns: Column<MentorProfile>[] = [
    {
      header: "Mentor",
      accessor: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {row.fullName.split(" ").map((n) => n[0]).join("")}
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
          <p className="text-gray-900">{row.phoneNumber}</p>
          {row.location && <p className="text-gray-500">{row.location}</p>}
        </div>
      ),
    },
    {
      header: "Subjects",
      accessor: (row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {row.subjectProficiency?.slice(0, 2).map((subject, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
            >
              {subject.subject}
            </span>
          ))}
          {row.subjectProficiency && row.subjectProficiency.length > 2 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              +{row.subjectProficiency.length - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(row.approvalStatus)}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.approvalStatus)}`}>
            {row.approvalStatus.charAt(0).toUpperCase() + row.approvalStatus.slice(1)}
          </span>
          {row.isBlocked && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              Blocked
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
          {new Date(row.createdAt).toLocaleDateString("en-US", {
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/admin/mentor/${row._id}`);
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
              handleEditMentor(row);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit Mentor"
          >
            <Edit2 size={16} />
          </button>
          {row.isBlocked ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUnblockClick(row._id, row.fullName);
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title="Unblock Mentor"
            >
              <Check size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBlockClick(row._id, row.fullName);
              }}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200"
              title="Block Mentor"
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
    setFilters({ status: "", subject: "" });
  };

  const handleSort = (
    column: keyof MentorProfile,
    direction: "asc" | "desc"
  ) => {
    console.log(`Sort by ${String(column)} ${direction}`);
  };

  if (loading) {
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
            <div className="w-16 h-16 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading mentors...</p>
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
          title="Mentors Management"
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
                  <p className="text-gray-600 text-sm font-medium">Total Mentors</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{mentors.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Approved</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {mentors.filter((m) => m.approvalStatus === "approved").length}
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
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {mentors.filter((m) => m.approvalStatus === "pending").length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Blocked</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {mentors.filter((m) => m.isBlocked).length}
                  </p>
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
            searchPlaceholder="Search mentors by name, email, or subject..."
            className="mb-6"
          />

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Mentors</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Showing {paginatedMentors.length} of {filteredMentors.length} mentors
                  {filteredMentors.length !== mentors.length && ` (filtered from ${mentors.length} total)`}
                </p>
              </div>

              <button
                onClick={handleAddMentor}
                className="flex items-center justify-center space-x-2 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 font-medium"
              >
                <Plus size={20} />
                <span>Add Mentor</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <DataTable<MentorProfile>
              columns={columns}
              data={paginatedMentors}
              loading={loading}
              onSort={handleSort}
              onRowClick={(mentor) => navigate(`/admin/mentor/${mentor._id}`)}
              variant="bordered"
              emptyMessage={
                searchTerm || Object.values(filters).some((f) => f !== "")
                  ? "No mentors match your search criteria"
                  : "No mentors have been added yet"
              }
            />
          </div>

          {filteredMentors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={filteredMentors.length}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.goToPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
                variant="detailed"
                className="px-6 py-4"
              />
            </div>
          )}

          {/* Confirmation Modal for Block/Unblock */}
          {showBlockModal && selectedMentor && (
            <ConfirmationModal
              isOpen={showBlockModal}
              onClose={() => {
                setShowBlockModal(false);
                setSelectedMentor(null);
              }}
              onConfirm={handleConfirmAction}
              title={`Confirm ${selectedMentor.action === 'block' ? 'Block' : 'Unblock'}`}
              message={`Are you sure you want to ${selectedMentor.action} ${selectedMentor.name}? ${
                selectedMentor.action === 'block' 
                  ? 'They will not be able to access the platform.' 
                  : 'They will regain access to the platform.'
              }`}
              confirmText={selectedMentor.action === 'block' ? 'Block' : 'Unblock'}
              variant="danger"
              isLoading={loading}
            />
          )}

          {/* Mentor Modal for Add/Edit */}
          {showMentorModal && (
            <MentorModal
              mentor={selectedMentorForEdit}
              onClose={handleCloseMentorModal}
              onSave={handleSaveMentor}
              isOpen={showMentorModal}
              loading={loading}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default MentorsManagement;