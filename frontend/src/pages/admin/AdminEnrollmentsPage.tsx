import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchEnrollmentsPaginated } from "../../features/admin/adminThunk";
import { setEnrollmentsPagination } from "../../features/admin/adminSlice";
import { DataTable } from "../../components/ui/DataTable";
import { SearchAndFilters, type FilterConfig } from "../../components/ui/SearchAndFilters";
import { CheckCircle, Clock, XCircle, User, Calendar } from "lucide-react";
import type { Enrollment } from "../../types/enrollmentTypes";
import { useDebounce } from "../../hooks/useDebounce";
import { Pagination } from "../../components/ui/Pagination";

const AdminEnrollmentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    enrollmentsList, 
    enrollmentsLoading, 
    enrollmentsError,
    enrollmentsPagination 
  } = useSelector((state: RootState) => state.admin);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { currentPage, totalPages, totalStudents } = enrollmentsPagination;

  useEffect(() => {
    dispatch(fetchEnrollmentsPaginated({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        status: statusFilter
    }));
  }, [dispatch, currentPage, itemsPerPage, debouncedSearch, statusFilter]);

  const handlePageChange = (page: number) => {
    dispatch(setEnrollmentsPagination({ currentPage: page }));
  };

  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit);
    dispatch(setEnrollmentsPagination({ currentPage: 1 }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending_payment":
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "pending_payment":
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const columns = [
    {
      header: "Student",
      accessor: (row: Enrollment) => (
        <div className="flex items-center gap-3">
          {(row.student?.profilePicture || (row.student as any)?.profileImage) ? (
            <img
              src={row.student?.profilePicture || (row.student as any)?.profileImage}
              alt={row.student?.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <User size={14} />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{row.student?.fullName || "N/A"}</div>
            <div className="text-xs text-gray-500">{row.student?.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Course",
      accessor: (row: Enrollment) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.course?.subject?.subjectName || "Unknown Subject"}
          </div>
          <div className="text-xs text-gray-500">
            {row.course?.grade?.name || "Unknown Grade"}
          </div>
        </div>
      ),
    },
    {
      header: "Mentor",
      accessor: (row: Enrollment) => (
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-700">
            {row.course?.mentor?.fullName || "Not Assigned"}
          </p>
        </div>
      ),
    },
    {
      header: "Enrollment Date",
      accessor: (row: Enrollment) => (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={14} />
          {new Date(row.enrollmentDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (row: Enrollment) => (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
            row.status
          )}`}
        >
          {getStatusIcon(row.status)}
          {row.status.replace("_", " ").charAt(0).toUpperCase() + row.status.replace("_", " ").slice(1)}
        </div>
      ),
    },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: "All Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Pending Payment", value: "pending_payment" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
  ];

  if (enrollmentsError) {
    return (
      <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex items-center gap-3 text-red-700">
        <XCircle className="w-5 h-5" />
        <p>{enrollmentsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Enrollment Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Displaying all student enrollments and their subscription status.
          </p>
        </div>
      </div>

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          dispatch(setEnrollmentsPagination({ currentPage: 1 }));
        }}
        filters={{ status: statusFilter }}
        onFilterChange={(_key, value) => {
            setStatusFilter(value);
            dispatch(setEnrollmentsPagination({ currentPage: 1 }));
        }}
        filterConfigs={filterConfigs}
        onClearFilters={() => {
          setSearchTerm("");
          setStatusFilter("");
          dispatch(setEnrollmentsPagination({ currentPage: 1 }));
        }}
        searchPlaceholder="Search by student, subject, or mentor..."
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable<Enrollment>
          columns={columns}
          data={enrollmentsList}
          loading={enrollmentsLoading}
          emptyMessage="No enrollments found matching your criteria."
        />
      </div>

      {totalPages > 0 && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalStudents}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            variant="detailed"
          />
        </div>
      )}
    </div>
  );
};

export default AdminEnrollmentsPage;
