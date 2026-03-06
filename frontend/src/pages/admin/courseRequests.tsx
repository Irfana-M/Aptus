import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchCourseRequestsPaginated, updateCourseRequestStatusAdmin } from '../../features/admin/adminThunk';
import { setCourseRequestsPagination } from "../../features/admin/adminSlice";
import type { CourseRequest } from "../../types/student.types";
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTo12Hour } from '../../utils/timeFormat';
import { useDebounce } from "../../hooks/useDebounce";
import { Pagination } from "../../components/ui/Pagination";
import { SearchAndFilters, type FilterConfig } from "../../components/ui/SearchAndFilters";
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';

import FindMatchModal from './components/FindMatchModal';

interface AdminCourseRequestsPageProps {
    onCreateCourse?: (request: CourseRequest) => void;
}

const AdminCourseRequestsPage: React.FC<AdminCourseRequestsPageProps> = ({ onCreateCourse }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { 
        courseRequests, 
        courseRequestsLoading, 
        courseRequestsError, 
        courseRequestsPagination 
    } = useSelector((state: RootState) => state.admin);
    
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<CourseRequest | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { currentPage, totalPages, totalStudents } = courseRequestsPagination;

    useEffect(() => {
        dispatch(fetchCourseRequestsPaginated({ 
            page: currentPage, 
            limit: itemsPerPage, 
            search: debouncedSearch, 
            status: statusFilter 
        }));
    }, [dispatch, currentPage, itemsPerPage, debouncedSearch, statusFilter]);

    const handlePageChange = (page: number) => {
        dispatch(setCourseRequestsPagination({ currentPage: page }));
    };

    const handleItemsPerPageChange = (limit: number) => {
        setItemsPerPage(limit);
        dispatch(setCourseRequestsPagination({ currentPage: 1 }));
    };

    const handleStatusUpdate = async (requestId: string, status: string) => {
        try {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter
            };
            const resultAction = await dispatch(updateCourseRequestStatusAdmin({ requestId, status, params }));
            if (updateCourseRequestStatusAdmin.fulfilled.match(resultAction)) {
                toast.success(`Request ${status} successfully`);
            } else {
                toast.error(`Failed to ${status} request`);
            }
        } catch (_error) {
             toast.error("An unexpected error occurred");
        }
    };

    const handleOpenMatchModal = (request: CourseRequest) => {
        setSelectedRequest(request);
        setIsMatchModalOpen(true);
    };

    const handleMatchConfirmed = () => {
        dispatch(fetchCourseRequestsPaginated({ 
            page: currentPage, 
            limit: itemsPerPage, 
            search: debouncedSearch, 
            status: statusFilter 
        }));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
            case 'approved':
            case 'reviewed': 
                return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Check size={12} /> Approved</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><X size={12} /> Rejected</span>;
            case 'fulfilled':
                return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Check size={12} /> Course Created</span>;
            default:
                return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
        }
    };

    const filterConfigs: FilterConfig[] = [
        {
            key: "status",
            label: "All Statuses",
            options: [
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "Course Created", value: "fulfilled" },
            ],
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Course Requests</h1>
            </div>

            <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={(value) => {
                    setSearchTerm(value);
                    dispatch(setCourseRequestsPagination({ currentPage: 1 }));
                }}
                filters={{ status: statusFilter }}
                onFilterChange={(_key, value) => {
                    setStatusFilter(value);
                    dispatch(setCourseRequestsPagination({ currentPage: 1 }));
                }}
                filterConfigs={filterConfigs}
                searchPlaceholder="Search by student, subject..."
            />

            {courseRequestsError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">Error loading requests: {courseRequestsError}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {courseRequestsLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <Loader size="md" text="Loading requests..." color="teal" />
                                    </td>
                                </tr>
                            ) : courseRequests.length > 0 ? (
                                courseRequests.map((request: CourseRequest) => (
                                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {request.student && typeof request.student === 'object' ? request.student.fullName : 'Unknown Student'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {request.student && typeof request.student === 'object' ? request.student.email : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {request.subject} <br/>
                                            <span className="text-xs text-gray-500">{request.grade} - {request.mentoringMode}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                    <Clock size={14} className="text-indigo-500" />
                                                    {request.timeSlot === "MORNING" ? "Morning Batch (9AM - 1PM)" : 
                                                     request.timeSlot === "AFTERNOON" ? "Afternoon Batch (2PM - 6PM)" :
                                                     request.timeSlot && request.timeSlot !== "FLEXIBLE" 
                                                        ? request.timeSlot.split('-').map(t => formatTo12Hour(t.trim())).join(' - ') 
                                                        : 'Flexible'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                    <span className="font-semibold bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600">
                                                        {request.preferredDays?.join(', ')}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 capitalize">{request.timezone}</span>
                                            </div>
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {request.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 p-1 rounded transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            )}
                                             {(request.status === 'approved' || request.status === 'reviewed') && (
                                                <div className='flex gap-2'>
                                                     <button 
                                                        className="text-teal-600 hover:text-teal-900 text-xs bg-teal-50 px-3 py-1 rounded-full transition-colors font-semibold"
                                                        onClick={() => onCreateCourse ? onCreateCourse(request) : handleOpenMatchModal(request)}
                                                    >
                                                        Find Match
                                                    </button>
                                                </div>
                                             )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <EmptyState 
                                            icon={Clock} 
                                            title="No requests found" 
                                            description="No course requests found matching your criteria." 
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
            
            <FindMatchModal 
                isOpen={isMatchModalOpen}
                onClose={() => setIsMatchModalOpen(false)}
                request={selectedRequest}
                onMatchConfirmed={handleMatchConfirmed}
            />
        </div>
    );
};

export default AdminCourseRequestsPage;
            

