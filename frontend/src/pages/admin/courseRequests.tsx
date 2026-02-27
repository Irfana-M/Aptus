import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchAllCourseRequestsAdmin, updateCourseRequestStatusAdmin } from '../../features/admin/adminThunk';
import type { CourseRequest } from "../../types/studentTypes";
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTo12Hour } from '../../utils/timeFormat';

import FindMatchModal from './components/FindMatchModal';

interface AdminCourseRequestsPageProps {
    onCreateCourse?: (request: CourseRequest) => void;
}

const AdminCourseRequestsPage: React.FC<AdminCourseRequestsPageProps> = ({ onCreateCourse }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { courseRequests, courseRequestsLoading, courseRequestsError } = useSelector((state: RootState) => state.admin);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<CourseRequest | null>(null);

    useEffect(() => {
        dispatch(fetchAllCourseRequestsAdmin());
    }, [dispatch]);

    const handleStatusUpdate = async (requestId: string, status: string) => {
        try {
            const resultAction = await dispatch(updateCourseRequestStatusAdmin({ requestId, status }));
            if (updateCourseRequestStatusAdmin.fulfilled.match(resultAction)) {
                toast.success(`Request ${status} successfully`);
                dispatch(fetchAllCourseRequestsAdmin()); // Refresh list
            } else {
                toast.error(`Failed to ${status} request`);
            }
        } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
             toast.error("An unexpected error occurred");
        }
    };

    const handleOpenMatchModal = (request: CourseRequest) => {
        setSelectedRequest(request);
        setIsMatchModalOpen(true);
    };

    const handleMatchConfirmed = () => {
        // Refresh requests or update status to 'fulfilled' if backend doesn't do it automatically
        dispatch(fetchAllCourseRequestsAdmin());
        // Could also explicitly update status here if needed
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

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Course Requests</h1>

            {courseRequestsLoading && (
                 <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            )}

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

            {!courseRequestsLoading && !courseRequestsError && (
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
                                {courseRequests.map((request: CourseRequest) => (
                                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {typeof request.student === 'object' ? request.student.fullName : 'Unknown Student'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {typeof request.student === 'object' ? request.student.email : ''}
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
                                ))}
                            </tbody>
                        </table>
                        {courseRequests.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No course requests found.
                            </div>
                        )}
                    </div>
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
