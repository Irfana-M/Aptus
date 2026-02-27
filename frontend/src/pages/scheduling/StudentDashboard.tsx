import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentUpcomingSessions } from '../../api/userApi';
import type { Session } from '../../types/schedulingTypes';
import { fetchStudentProfile } from '../../features/student/studentThunk';
import type { RootState, AppDispatch } from '../../app/store';

const StudentDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profile } = useSelector((state: RootState) => state.student); 
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile && user?._id) {
        dispatch(fetchStudentProfile(user._id));
    }
    
    getStudentUpcomingSessions()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [dispatch, profile, user]);

  // Compute assigned mentor from profile
  const assignedMentorSlot = profile?.preferredTimeSlots?.find(slot => slot.status === 'mentor_assigned');

  const handleJoinSession = (session: Session) => {
      if (session.meetingLink && (session.meetingLink.startsWith('http') || session.meetingLink.startsWith('https'))) {
          window.open(session.meetingLink, '_blank');
      } else {
          // Placeholder for internal video call or missing link
          console.log("Join session clicked:", session.id);
          alert("Classroom feature for regular sessions is coming soon!");
      }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Assigned Mentor Card */}
      {assignedMentorSlot && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
           <h2 className="text-lg font-bold text-gray-900 mb-2">Your Mentor</h2>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                 {assignedMentorSlot.assignedMentorId?.fullName?.charAt(0) || 'M'}
              </div>
              <div>
                 <p className="font-bold text-lg">{assignedMentorSlot.assignedMentorId?.fullName || "Assigned Mentor"}</p>
                 <p className="text-sm text-gray-500">{assignedMentorSlot.subjectId?.subjectName || "Subject"}</p>
                 <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1 inline-block">
                    Mentor Assigned
                 </span>
              </div>
           </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">Your Upcoming Sessions</h2>
        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length > 0 ? (
          <div className="grid gap-4">
            {sessions.map(session => (
              <div key={session.id} className="p-4 rounded-lg border bg-white shadow-sm border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-indigo-600 font-medium mt-1">
                        {typeof session.subjectId === 'object' ? session.subjectId.name : 'Session'}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleJoinSession(session)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming sessions found.</p>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
