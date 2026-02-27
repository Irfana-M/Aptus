import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { fetchAvailableMentors, assignMentorToTrialClass } from '../../features/admin/adminThunk';
import { selectAvailableMentors, selectMentorAssignmentLoading } from '../../features/admin/adminSelectors';
import { User, Calendar, Clock, Search } from 'lucide-react';
import { showToast } from '../../utils/toast';
import { createDefaultTimeRange } from '../../utils/timeUtils';

import type { TrialClassResponse as TrialClass } from '../../types/trialTypes';

interface MentorAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialClass: TrialClass;
}

export const MentorAssignmentModal: React.FC<MentorAssignmentModalProps> = ({
  isOpen,
  onClose,
  trialClass,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const mentors = useSelector(selectAvailableMentors);
  const loading = useSelector(selectMentorAssignmentLoading);

  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');

  const [minDate, setMinDate] = useState<string>('');
  
  useEffect(() => {
    // Set min date to today
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    setMinDate(formattedToday);
  }, []);

  useEffect(() => {
    if (isOpen && trialClass) {
      dispatch(fetchAvailableMentors({
        subjectId: trialClass.subject.id,
        preferredDate: trialClass.preferredDate, // optional, but safe to send
      }));
      // Pre-fill form with student preferences
      // Format preferredDate to YYYY-MM-DD
      const date = new Date(trialClass.preferredDate);
      const formattedDate = !isNaN(date.getTime()) 
        ? date.toISOString().split('T')[0] 
        : '';
        
      // Extract start time from range (e.g. "09:00-10:00" -> "09:00")
      const startTime = trialClass.preferredTime 
        ? trialClass.preferredTime.split('-')[0] 
        : '';

      setSelectedMentorId('');
      setScheduledDate(formattedDate);
      setScheduledTime(startTime);
    }
  }, [isOpen, trialClass, dispatch]);

  const handleAssign = async () => {
    if (!selectedMentorId || !scheduledDate || !scheduledTime) {
      showToast.error('Please select mentor, date, and time');
      return;
    }

    const result = await dispatch(assignMentorToTrialClass({
      trialClassId: trialClass.id,
      mentorId: selectedMentorId,
      scheduledDate,
      scheduledTime,
    }));

    if (assignMentorToTrialClass.fulfilled.match(result)) {
      showToast.success('Mentor assigned successfully!');
      onClose();
    } else {
      showToast.error('Failed to assign mentor: ' + (result.payload || 'Unknown error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Assign Mentor</h2>
          <p className="text-gray-600 mt-1">
            {trialClass.student?.fullName || 'N/A'} • {trialClass.subject.subjectName} (Grade {trialClass.subject.gradeId || trialClass.subject.grade})
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Mentor List */}
          <div>
            <h3 className="font-semibold mb-3">Available Mentors ({mentors.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mentors.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No mentors found for <strong>{trialClass.subject.subjectName}</strong>
                </p>
              ) : (
                mentors.map((mentor) => (
                  <div
                    key={mentor._id}
                    onClick={() => setSelectedMentorId(mentor._id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                      selectedMentorId === mentor._id
                        ? 'border-blue-600 bg-blue-50 shadow-sm ring-1 ring-blue-600'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                           selectedMentorId === mentor._id 
                            ? 'bg-blue-600' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {mentor.fullName.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <p className={`font-bold text-base ${selectedMentorId === mentor._id ? 'text-blue-900' : 'text-gray-900'}`}>
                            {mentor.fullName}
                          </p>
                          <p className="text-sm text-gray-500">{mentor.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {mentor.subjectProficiency?.map((sp, i) => (
                              <span
                                key={i}
                                className="text-xs font-medium bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-md"
                              >
                                {sp.subject} • Level {sp.level}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {selectedMentorId === mentor._id && (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Schedule Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                min={minDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="flex items-end gap-2">
               <div className="flex-grow">
                <label className="block text-sm font-medium mb-1">Scheduled Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  min={scheduledDate === minDate ? new Date().toTimeString().slice(0, 5) : undefined}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
               </div>
               <button
                  type="button"
                  onClick={() => {
                     if (!trialClass?.subject?.id || !scheduledDate) {
                        showToast.error("Please select a date first");
                        return;
                     }
                     
                     // Construct time slot assuming 1 hour duration if time is present
                     let timeSlotRange: string | undefined = undefined;
                     if (scheduledTime) {
                         timeSlotRange = createDefaultTimeRange(scheduledTime);
                     }

                     dispatch(fetchAvailableMentors({
                        subjectId: trialClass.subject.id,
                        preferredDate: scheduledDate,
                        timeSlot: timeSlotRange
                     }));
                     setSelectedMentorId(''); // Reset selection
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center mb-[1px]"
                  title="Search for mentors available at this time"
               >
                  <Search size={18} />
               </button>
            </div>
          </div>

          {/* Assignment Summary */}
          {selectedMentorId && scheduledDate && scheduledTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-blue-900">Assignment Ready</p>
              <div className="flex items-center gap-6 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{mentors.find(m => m._id === selectedMentorId)?.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{scheduledTime}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedMentorId || !scheduledDate || !scheduledTime || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Assigning...' : 'Assign Mentor'}
          </button>
        </div>
      </div>
    </div>
  );
};
