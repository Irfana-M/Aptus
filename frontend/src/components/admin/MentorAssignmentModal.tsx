import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { fetchAvailableMentors, assignMentorToTrialClass } from '../../features/admin/adminThunk';
import { selectAvailableMentors, selectMentorAssignmentLoading } from '../../features/admin/adminSelectors';
import { User, Calendar, Clock } from 'lucide-react';

interface TrialClass {
  id: string;
  student: { fullName: string; email: string };
  subject: { id: string; subjectName: string; syllabus: string; grade: number };
  preferredDate: string;
  preferredTime: string;
}

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

  useEffect(() => {
    if (isOpen && trialClass) {
      dispatch(fetchAvailableMentors({
        subjectId: trialClass.subject.id,
        preferredDate: trialClass.preferredDate, // optional, but safe to send
      }));
      // Reset form
      setSelectedMentorId('');
      setScheduledDate('');
      setScheduledTime('');
    }
  }, [isOpen, trialClass, dispatch]);

  const handleAssign = async () => {
    if (!selectedMentorId || !scheduledDate || !scheduledTime) {
      alert('Please select mentor, date, and time');
      return;
    }

    const result = await dispatch(assignMentorToTrialClass({
      trialClassId: trialClass.id,
      mentorId: selectedMentorId,
      scheduledDate,
      scheduledTime,
    }));

    if (assignMentorToTrialClass.fulfilled.match(result)) {
      alert('Mentor assigned successfully!');
      onClose();
    } else {
      alert('Failed to assign mentor: ' + (result.payload || 'Unknown error'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Assign Mentor</h2>
          <p className="text-gray-600 mt-1">
            {trialClass.student.fullName} • {trialClass.subject.subjectName} (Grade {trialClass.subject.grade})
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
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedMentorId === mentor._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {mentor.fullName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold">{mentor.fullName}</p>
                          <p className="text-sm text-gray-600">{mentor.email}</p>
                          <div className="flex gap-2 mt-2">
                            {mentor.subjectProficiency?.map((sp, i) => (
                              <span
                                key={i}
                                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                              >
                                {sp.subject} • Level {sp.level}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {selectedMentorId === mentor._id && (
                        <span className="text-blue-600 font-medium">Selected</span>
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
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          {/* Summary */}
          {selectedMentorId && scheduledDate && scheduledTime && (
            <div className="bg-blue-50 border border border-blue-200 rounded-lg p-4">
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
            {loading ? (
              <>Assigning...</>
            ) : (
              <>Assign Mentor</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};