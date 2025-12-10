import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store'; // Correct path to store
import { fetchAllCourseRequestsAdmin, updateCourseRequestStatusAdmin } from '../../features/admin/adminThunk';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminCourseRequestsPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { courseRequests, courseRequestsLoading, courseRequestsError } = useSelector((state: RootState) => state.admin);

    useEffect(() => {
        dispatch(fetchAllCourseRequestsAdmin());
    }, [dispatch]);

    const handleStatusUpdate = async (requestId: string, status: string) => {
        try {
            const resultAction = await dispatch(updateCourseRequestStatusAdmin({ requestId, status }));
            if (updateCourseRequestStatusAdmin.fulfilled.match(resultAction)) {
                toast.success(`Request ${status} successfully`);
            } else {
                toast.error(`Failed to ${status} request`);
            }
        } catch (error) {
             toast.error("An unexpected error occurred");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Clock size={12} /> Pending</span>;
            case 'approved':
                return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><Check size={12} /> Approved</span>;
            case 'rejected':
                return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit"><X size={12} /> Rejected</span>;
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {courseRequests.map((request: any) => (
                                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{request.student?.fullName || 'Unknown Student'}</div>
                                                    <div className="text-sm text-gray-500">{request.student?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {request.subject} <br/>
                                            <span className="text-xs text-gray-500">{request.grade} - {request.mentoringMode}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {request.preferredDay}, {request.preferredTimeRange?.startTime} - {request.preferredTimeRange?.endTime} <br/>
                                            <span className="text-xs text-gray-400">{request.timezone}</span>
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
                                                        onClick={() => handleStatusUpdate(request._id, 'approved')}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusUpdate(request._id, 'rejected')}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 p-1 rounded transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            )}
                                             {request.status === 'approved' && (
                                                <button 
                                                    className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-3 py-1 rounded-full transition-colors"
                                                    onClick={() => { /* Navigate to Create Course with pre-filled data */ }}
                                                >
                                                    Create Course
                                                </button>
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
        </div>
    );
};

export default AdminCourseRequestsPage;
