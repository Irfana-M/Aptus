import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { 
  fetchTrialClassDetails,
  updateTrialClassStatus,
  assignMentorToTrialClass
} from '../../features/admin/adminThunk';
import { selectAdminLoading, selectTrialClassDetails } from '../../features/admin/adminSelectors';
import { Sidebar } from '../../components/admin/Sidebar';
import { Topbar } from '../../components/admin/Topbar';
import { MentorAssignmentModal } from '../../components/admin/MentorAssignmentModal';
import { showToast } from '../../utils/toast';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  User,
  BookOpen,
  Calendar,
  Video,
  Mail,
  Edit3
} from 'lucide-react';
import type { TrialClassResponse } from '../../types/trialTypes';

export const TrialClassDetailsPage: React.FC = () => {
  const { trialClassId } = useParams<{ trialClassId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectAdminLoading);
  const trialClass = useSelector(selectTrialClassDetails) as TrialClassResponse | null;
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Trial Classes");
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    if (trialClassId) {
      dispatch(fetchTrialClassDetails(trialClassId));
    }
  }, [trialClassId, dispatch]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'assigned':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'assigned':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'completed':
        return "bg-green-100 text-green-800 border-green-200";
      case 'cancelled':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleAssignMentor = async (mentorId: string, scheduledDate: string, scheduledTime: string) => {
    if (!trialClassId) return;

    try {
      const loadingToastId = showToast.loading("Assigning mentor...");

      await dispatch(assignMentorToTrialClass({
        trialClassId,
        mentorId,
        scheduledDate,
        scheduledTime
      })).unwrap();

      showToast.success("Mentor assigned successfully!");
      showToast.dismiss(loadingToastId);
      setShowAssignmentModal(false);
      
      
      dispatch(fetchTrialClassDetails(trialClassId));
      
    } catch (error: any) {
      showToast.dismiss();
      const errorMessage = error?.message || "Failed to assign mentor";
      showToast.error(errorMessage);
      console.error("Failed to assign mentor:", error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!trialClassId) return;

    try {
      const loadingToastId = showToast.loading("Updating status...");

      await dispatch(updateTrialClassStatus({
        trialClassId,
        status: newStatus
      })).unwrap();

      showToast.success(`Status updated to ${newStatus}`);
      showToast.dismiss(loadingToastId);
      
      // Refresh the trial class details
      dispatch(fetchTrialClassDetails(trialClassId));
      
    } catch (error: any) {
      showToast.dismiss();
      const errorMessage = error?.message || "Failed to update status";
      showToast.error(errorMessage);
      console.error("Failed to update status:", error);
    }
  };

  if (loading && !trialClass) {
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
            <p className="text-gray-600">Loading trial class details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trialClass) {
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
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Trial Class Not Found</h2>
            <p className="text-gray-600 mb-4">The requested trial class could not be found.</p>
            <button
              onClick={() => navigate('/admin/trial-classes')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Trial Classes
            </button>
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
          title="Trial Class Details"
          user={{
            name: "Admin User",
            email: "admin@mentora.com",
          }}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/trial-classes')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trial Class Details</h1>
                <p className="text-gray-600">ID: {trialClassId}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {getStatusIcon(trialClass.status)}
              <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(trialClass.status)}`}>
                {trialClass.status.charAt(0).toUpperCase() + trialClass.status.slice(1)}
              </span>
              
              {trialClass.status === 'requested' && (
                <button
                  onClick={() => setShowAssignmentModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <User size={16} />
                  <span>Assign Mentor</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-purple-600" />
                  Student Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-900">{trialClass.student.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {trialClass.student.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="font-medium text-gray-900">{trialClass.student.id}</p>
                  </div>
                </div>
              </div>

              {/* Subject & Schedule Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                  Class Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Subject Information</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Subject</p>
                        <p className="font-medium">{trialClass.subject.subjectName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Syllabus</p>
                        <p className="font-medium">{trialClass.subject.syllabus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Grade Level</p>
                        <p className="font-medium">Grade {trialClass.subject.grade}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                      Schedule
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Preferred Date</p>
                        <p className="font-medium">
                          {new Date(trialClass.preferredDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Preferred Time</p>
                        <p className="font-medium">{trialClass.preferredTime}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {trialClass.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">Additional Notes</p>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{trialClass.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Mentor & Actions */}
            <div className="space-y-6">
              {/* Mentor Information */}
              {trialClass.mentor ? (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Assigned Mentor
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{trialClass.mentor.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{trialClass.mentor.email}</p>
                    </div>
                    {trialClass.meetLink && (
                      <div>
                        <p className="text-sm text-gray-500">Meeting Link</p>
                        <a
                          href={trialClass.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Mentor Assignment</h2>
                  <p className="text-gray-600 mb-4">No mentor assigned yet.</p>
                  <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <User size={16} />
                    <span>Assign Mentor</span>
                  </button>
                </div>
              )}

              {/* Actions Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  {trialClass.status === 'requested' && (
                    <button
                      onClick={() => handleStatusUpdate('cancelled')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={16} />
                      <span>Cancel Request</span>
                    </button>
                  )}
                  
                  {trialClass.status === 'assigned' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate('completed')}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={16} />
                        <span>Mark as Completed</span>
                      </button>
                      <button
                        onClick={() => setShowAssignmentModal(true)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit3 size={16} />
                        <span>Reassign Mentor</span>
                      </button>
                    </>
                  )}
                  
                  {(trialClass.status === 'completed' || trialClass.status === 'cancelled') && (
                    <button
                      onClick={() => handleStatusUpdate('requested')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Clock size={16} />
                      <span>Reopen Request</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {new Date(trialClass.createdAt).toLocaleDateString()} at{' '}
                      {new Date(trialClass.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">
                      {new Date(trialClass.updatedAt).toLocaleDateString()} at{' '}
                      {new Date(trialClass.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mentor Assignment Modal */}
      {showAssignmentModal && (
        <MentorAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          onAssign={handleAssignMentor}
          trialClass={trialClass}
          loading={loading}
        />
      )}
    </div>
  );
};

export default TrialClassDetailsPage;