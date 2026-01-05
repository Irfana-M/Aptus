import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchStudentProfile, fetchAllEnrollmentsAdmin, assignMentorToStudent, reassignMentorToStudent } from "../../features/admin/adminThunk";
import { Sidebar } from "../../components/admin/Sidebar";
import { Topbar } from "../../components/admin/Topbar";
import FindMatchModal from "./components/FindMatchModal";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  ArrowLeft,
} from "lucide-react";

export const StudentProfilePage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { selectedStudentProfile: profile, studentProfileLoading: loading } = useSelector(
    (state: RootState) => state.admin
  );

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [activeNav, setActiveNav] = React.useState("Students");
  const [isMatchModalOpen, setIsMatchModalOpen] = React.useState(false);
  const [matchRequest, setMatchRequest] = React.useState<any>(null);

  const handleOpenMatchModal = (pref: any) => {
    if (!profile) return;
    const subjectId = typeof pref.subjectId === 'object' ? pref.subjectId._id : pref.subjectId;
    const subjectName = typeof pref.subjectId === 'object' ? pref.subjectId.subjectName : `Subject ID: ${pref.subjectId}`;
    
      const isReassign = pref.status === 'mentor_assigned' || profile.enrollments?.some((e: any) => 
      (e.course?.subject?._id === subjectId || e.course?.subject === subjectId) && 
      e.status === 'active'
    );

    setMatchRequest({
      _id: `pref-${subjectId}`,
      subject: subjectId,
      subjectName: subjectName,
      grade: typeof profile.gradeId === 'object' ? (profile.gradeId as any)._id : profile.gradeId,
      preferredDays: pref.slots.map((s: any) => s.day),
      timeSlot: pref.slots.length > 0 ? `${pref.slots[0].startTime} - ${pref.slots[0].endTime}` : "",
      student: {
        _id: profile._id,
        fullName: profile.fullName
      },
      plan: profile.subscription?.plan,
      status: isReassign ? 'active' : pref.status
    });
    setIsMatchModalOpen(true);
  };


  
  const handleMatchConfirmed = () => {
    if (studentId) {
      dispatch(fetchStudentProfile(studentId));
      dispatch(fetchAllEnrollmentsAdmin());
      toast.success("Course booked and profile updated!");
    }
  };

  useEffect(() => {
    if (studentId) {
      dispatch(fetchStudentProfile(studentId));
    }
  }, [dispatch, studentId]);

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
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading student profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
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
            <p className="text-gray-600">Student not found</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (isVerified: boolean, isBlocked?: boolean) => {
    if (isBlocked) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircle className="w-4 h-4 mr-1" />
          Blocked
        </span>
      );
    }
    if (isVerified) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-4 h-4 mr-1" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </span>
    );
  };

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
          title="Student Profile"
          user={{ name: "Admin User", email: "admin@mentora.com" }}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {/* Back Button */}
          <button
            onClick={() => navigate("/admin/students")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Students
          </button>

          {/* Profile Header */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-start gap-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">
                      {profile.fullName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "U"}
                    </span>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.fullName}
                  </h1>
                  {getStatusBadge(profile.isVerified || false, profile.isBlocked || false)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {profile.email}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {profile.phoneNumber || "N/A"}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Joined{" "}
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) : "N/A"}
                  </div>
                  {profile.isPaid && (
                    <div className="flex items-center text-blue-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Paid Student
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-600" />
                Personal Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Age
                  </label>
                  <p className="text-gray-900">{profile.age || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Gender
                  </label>
                  <p className="text-gray-900 capitalize">
                    {profile.gender || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </label>
                  <p className="text-gray-900">
                    {profile.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                Contact Information
              </h2>
              <div className="space-y-3">
                {profile.contactInfo?.parentInfo && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Parent Name
                      </label>
                      <p className="text-gray-900">
                        {profile.contactInfo.parentInfo.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Parent Email
                      </label>
                      <p className="text-gray-900">
                        {profile.contactInfo.parentInfo.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Parent Phone
                      </label>
                      <p className="text-gray-900">
                        {profile.contactInfo.parentInfo.phoneNumber || "N/A"}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Address
                  </label>
                  <p className="text-gray-900">
                    {profile.contactInfo?.address || "N/A"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Country
                    </label>
                    <p className="text-gray-900">
                      {profile.contactInfo?.country || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Postal Code
                    </label>
                    <p className="text-gray-900">
                      {profile.contactInfo?.postalCode || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-purple-600" />
                Academic Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Institution
                  </label>
                  <p className="text-gray-900">
                    {profile.academicDetails?.institutionName || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Grade
                  </label>
                  <p className="text-gray-900">
                    {typeof profile.gradeId === 'object' ? (profile.gradeId as any).name : (profile.academicDetails?.grade || "N/A")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Syllabus
                  </label>
                  <p className="text-gray-900">
                    {profile.academicDetails?.syllabus || "N/A"}
                  </p>
                </div>
                {profile.goal && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Goals
                    </label>
                    <p className="text-gray-900">{profile.goal}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />
                Account Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Email Verified
                  </span>
                  {profile.isVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Profile Complete
                  </span>
                  {profile.isProfileCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Paid Status
                  </span>
                  {profile.hasPaid || profile.isPaid ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Trial Completed
                  </span>
                  {profile.isTrialCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-purple-600" />
                Subscription Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Current Plan
                  </label>
                  <p className="text-gray-900 capitalize">
                    {profile.subscription?.plan || "No active plan"}
                  </p>
                </div>
                {profile.subscription && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Start Date
                      </label>
                      <p className="text-gray-900">
                        {new Date(profile.subscription.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Expiration Date
                      </label>
                      <p className="text-gray-900">
                        {new Date(profile.subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize mt-1 ${
                        profile.subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {profile.subscription.status}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Course Preferences & Availability */}
          {profile.preferencesCompleted && profile.preferredTimeSlots && profile.preferredTimeSlots.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                Course Preferences & Availability
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.preferredTimeSlots.map((pref, idx) => {
                  // Skip if it doesn't have slots (legacy format)
                  if (!pref.slots) return null;
                  
                  return (
                    <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-gray-900">
                          {typeof pref.subjectId === 'object' ? pref.subjectId.subjectName : `Subject ID: ${pref.subjectId}`}
                        </h3>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded">
                          {pref.slots.length} Slots
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  (pref as any).status === 'mentor_requested' ? 'bg-yellow-100 text-yellow-800' :
                                  (pref as any).status === 'mentor_assigned' ? 'bg-green-100 text-green-800' :
                                  (pref as any).status === 'active' ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                                  {(pref as any).status ? (pref as any).status.replace('_', ' ') : 'Preferences Submitted'}
                              </span>
                          </div>
                          {pref.slots.map((slot, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-100 shadow-sm">
                              <span className="font-medium text-gray-700">{slot.day}</span>
                              <span className="text-gray-500">{slot.startTime} - {slot.endTime}</span>
                            </div>
                          ))}
                          
                          {/* Display Assigned Mentor if available */}
                          {(pref as any).assignedMentorId && (
                            <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-100">
                                <span className="text-xs text-purple-600 font-bold block mb-1">ASSIGNED MENTOR</span>
                                <div className="text-sm font-medium text-gray-800">
                                    {typeof (pref as any).assignedMentorId === 'object' 
                                        ? (pref as any).assignedMentorId.fullName 
                                        : 'Mentor Assigned'}
                                </div>
                            </div>
                          )}
                        </div>

                        {/* Improved State Display */}
                        {(() => {
                           const subjectIdStr = typeof (pref as any).subjectId === 'object' 
                               ? (pref as any).subjectId._id 
                               : (pref as any).subjectId;
                           
                           const hasActiveEnrollment = profile.enrollments?.some((e: any) => 
                               (e.course?.subject?._id === subjectIdStr || e.course?.subject === subjectIdStr) && 
                               e.status === 'active'
                           );

                           const isMentorAssigned = 
                               (pref as any).status === 'mentor_assigned' || 
                               hasActiveEnrollment || 
                               profile.onboardingStatus === 'mentor_assigned';

                           if (isMentorAssigned) {
                               return (
                                 <div className="space-y-3">
                                   <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-xs font-bold shadow-sm">
                                      <CheckCircle size={14} />
                                      MENTOR ASSIGNED
                                   </div>
                                   
                                   <button
                                      onClick={() => handleOpenMatchModal(pref)}
                                      className="w-full py-2 bg-white text-indigo-600 border border-indigo-200 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                                   >
                                      <Clock size={14} />
                                      Reassign Mentor
                                   </button>
                                 </div>
                               );
                           }

                           return (
                             <button
                               onClick={() => handleOpenMatchModal(pref)}
                               className={`w-full py-2 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                                   (pref as any).status === 'mentor_requested' ? 'bg-green-600 hover:bg-green-700' :
                                   'bg-slate-900 hover:bg-slate-800'
                               }`}
                             >
                               <BookOpen size={14} />
                               {(pref as any).status === 'mentor_requested' ? 'Assign Mentor' : 'Find Mentor & Book'}
                             </button>
                           );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trial Classes */}
          {profile.trialClasses && profile.trialClasses.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                Trial Classes ({profile.trialClasses.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mentor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Preferred Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profile.trialClasses.map((trial, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(typeof trial.subject === 'object' ? trial.subject.subjectName : trial.subject) || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(typeof trial.mentor === 'object' ? trial.mentor.fullName : trial.assignedMentor) || "Not Assigned"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              trial.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : trial.status === "assigned"
                                ? "bg-blue-100 text-blue-800"
                                : trial.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {trial.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {trial.preferredDate ? new Date(trial.preferredDate).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Enrollments */}
          {profile.enrollments && profile.enrollments.length > 0 && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                Course Enrollments ({profile.enrollments.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mentor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Enrollment Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {profile.enrollments.map((enrollment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {enrollment.course?.subject?.subjectName || "N/A"}
                            </div>
                            <div className="text-gray-500">
                              {enrollment.course?.grade?.name || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {enrollment.course?.mentor?.fullName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              enrollment.status === "active"
                                ? "bg-green-100 text-green-800"
                                : enrollment.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <FindMatchModal 
          isOpen={isMatchModalOpen}
          onClose={() => setIsMatchModalOpen(false)}
          request={matchRequest}
          onMatchConfirmed={handleMatchConfirmed}
          onSubmit={async (data) => {
              if (studentId && matchRequest) {
                  if (matchRequest.status === 'active') {
                      await dispatch(reassignMentorToStudent({
                          studentId,
                          subjectId: matchRequest.subject,
                          newMentorId: data.mentorId,
                          reason: "Admin reassignment via profile",
                          days: data.days,
                          timeSlot: data.timeSlot
                      })).unwrap();
                      toast.success("Mentor reassigned successfully");
                  } else {
                      await dispatch(assignMentorToStudent({
                          studentId,
                          subjectId: matchRequest.subject,
                          mentorId: data.mentorId,
                          preferredDate: new Date().toISOString(),
                          days: data.days,
                          timeSlot: data.timeSlot
                      })).unwrap();
                      toast.success("Mentor assigned successfully");
                  }
                 // Refresh profile to show updated status
                 dispatch(fetchStudentProfile(studentId));
             }
          }}
        />
      </main>
    </div>
  );
};

export default StudentProfilePage;
