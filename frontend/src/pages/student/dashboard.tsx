import React from 'react';
import StudentLayout from '../../components/students/StudentLayout';
import AnnouncementCard from '../../components/students/dashboard/AnnouncementCard';
import EnrolledCourses from '../../components/students/dashboard/EnrolledCourses';
import AssignmentList from '../../components/students/dashboard/AssignmentList';
import ScheduleList from '../../components/students/dashboard/ScheduleList';
import UpcomingClasses from '../../components/students/dashboard/UpcomingClasses';
import ProgressCard from '../../components/students/dashboard/ProgressCard';

import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../app/store';
import { Clock, CalendarCheck } from 'lucide-react';
import { fetchStudentProfile, fetchStudentAssignments } from '../../features/student/studentThunk';
import { fetchStudentTrialClasses } from '../../features/trial/student/studentTrialThunk';



const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
   const { profile, enrollments } = useSelector((state: RootState) => state.student);
   const { user } = useSelector((state: RootState) => state.auth);
   const { trialClasses } = useSelector((state: RootState) => state.studentTrial);

   React.useEffect(() => {
       dispatch(fetchStudentProfile());
       
       // Only fetch trial classes if profile is complete (needs weight 3)
       if (profile?.isProfileCompleted || user?.isProfileComplete) {
           dispatch(fetchStudentTrialClasses());
       }
       
       // Only fetch assignments if student has paid (needs weight 6)
       if (profile?.hasPaid || user?.hasPaid) {
           dispatch(fetchStudentAssignments());
       }
   }, [dispatch, profile?.isProfileCompleted, user?.isProfileComplete, profile?.hasPaid, user?.hasPaid]);

  const isProcessingPayment = !!(profile && profile.hasPaid && enrollments.length === 0);
  
  // Check if student is in TRIAL_BOOKED state
  // Primary: Check trial classes for pending status
  // Fallback: Use onboardingStatus from profile if trialClasses haven't loaded
  const trialClassesList = Array.isArray(trialClasses) ? trialClasses : [];
  const pendingTrial = trialClassesList.find(t => t.status === 'requested' || t.status === 'approved');
  const assignedTrial = trialClassesList.find(t => t.status === 'assigned');
  
  // Use profile.onboardingStatus as fallback when trialClasses are empty
  const onboardingStatus = profile?.onboardingStatus;
  const isTrialPending = (!!pendingTrial && !assignedTrial) || 
    (trialClassesList.length === 0 && onboardingStatus === 'trial_booked');

  return (
    <StudentLayout title="Dashboard">
      <DashboardContent 
        isProcessingPayment={isProcessingPayment} 
        isTrialPending={isTrialPending}
        pendingTrial={pendingTrial}
        assignedTrial={assignedTrial}
        onboardingStatus={onboardingStatus}
      />
    </StudentLayout>
  );
};

import type { TrialClass } from '../../types/trial.types';

interface DashboardContentProps {
    isProcessingPayment?: boolean;
    isTrialPending?: boolean;
    pendingTrial?: TrialClass;
    assignedTrial?: TrialClass;
    onboardingStatus?: string;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ isProcessingPayment, isTrialPending, pendingTrial, assignedTrial }) => (
    <div className="w-full space-y-6 animate-in fade-in duration-700">
        {/* Trial Booked - Pending Mentor Assignment Banner */}
        {isTrialPending && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mb-6">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-3 flex items-center gap-3">
                        <CalendarCheck size={32} /> Trial Class Booked!
                    </h2>
                    <p className="text-amber-100 max-w-2xl text-lg">
                        Your free trial class has been requested. Our team is currently assigning the best mentor for you. 
                        You'll receive a notification once your trial is confirmed with a mentor and meeting link.
                    </p>
                    {pendingTrial && (
                        <div className="mt-4 text-sm text-amber-200">
                            <strong>Subject:</strong> {typeof pendingTrial.subject === 'object' ? pendingTrial.subject.subjectName : pendingTrial.subject} • 
                            <strong> Preferred Date:</strong> {new Date(pendingTrial.preferredDate).toLocaleDateString()} • 
                            <strong> Time:</strong> {pendingTrial.preferredTime}
                        </div>
                    )}
                    <div className="mt-6 flex gap-4">
                        <div className="px-4 py-2 bg-white/20 rounded-xl text-sm font-bold flex items-center gap-2">
                           <Clock size={16} /> Waiting for mentor assignment...
                        </div>
                    </div>
                </div>
                <div className="absolute right-[-5%] top-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
        )}

        {/* Trial Assigned - Ready to Join Banner */}
        {assignedTrial && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mb-6">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-3">🎉 Your Trial Class is Ready!</h2>
                    <p className="text-green-100 max-w-2xl text-lg">
                        A mentor has been assigned to your trial class. Check your upcoming classes below to join!
                    </p>
                    <div className="mt-4 text-sm text-green-200">
                        <strong>Subject:</strong> {typeof assignedTrial.subject === 'object' ? assignedTrial.subject.subjectName : assignedTrial.subject} • 
                        <strong> Date:</strong> {new Date(assignedTrial.preferredDate).toLocaleDateString()} • 
                        <strong> Time:</strong> {assignedTrial.preferredTime}
                    </div>
                </div>
                <div className="absolute right-[-5%] top-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
        )}

        {isProcessingPayment && (
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mb-6">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black mb-3">Your dashboard will be ready soon! 🚀</h2>
                    <p className="text-indigo-100 max-w-2xl text-lg">
                        Thank you for subscribing! Our academic team is currently matching you with the best mentors for your selected subjects. 
                        This usually takes less than 24 hours. You'll receive a notification as soon as your classroom is ready.
                    </p>
                    <div className="mt-6 flex gap-4">
                        <div className="px-4 py-2 bg-white/20 rounded-xl text-sm font-bold flex items-center gap-2">
                           <Clock size={16} /> Matching in progress...
                        </div>
                    </div>
                </div>
                <div className="absolute right-[-5%] top-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <AnnouncementCard />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                   <EnrolledCourses />
                   <ProgressCard />
                </div>
                
                <AssignmentList />
            </div>

            <div className="space-y-6">
                <ScheduleList />
                <UpcomingClasses />
            </div>
        </div>
    </div>
);

export default Dashboard;
