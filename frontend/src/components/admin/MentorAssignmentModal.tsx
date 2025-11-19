import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { fetchAvailableMentors } from '../../features/admin/adminThunk';
import { selectAvailableMentors } from '../../features/admin/adminSelectors';
import { Calendar, Clock, User } from 'lucide-react';
import type { AvailableMentor } from '../../types/adminTypes';

interface TrialClass {
  id: string;
  student: {
    fullName: string;
    email: string;
  };
  subject: {
    id: string;
    subjectName: string;
    syllabus: string;
    grade: number;
  };
  preferredDate: string;
  preferredTime: string;
}

interface MentorAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (mentorId: string, scheduledDate: string, scheduledTime: string) => void;
  trialClass: TrialClass;
  loading: boolean;
}

export const MentorAssignmentModal: React.FC<MentorAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  trialClass,
  loading
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const availableMentors = useSelector(selectAvailableMentors);
  
  const [selectedMentor, setSelectedMentor] = useState<AvailableMentor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    if (isOpen && trialClass) {
      console.log('🔄 Fetching available mentors for:', {
        subjectId: trialClass.subject.id,
        preferredDate: trialClass.preferredDate
      });
      
      dispatch(fetchAvailableMentors({
        subjectId: trialClass.subject.id,
        preferredDate: trialClass.preferredDate
      }));
    }
  }, [isOpen, trialClass, dispatch]);

  // Add debugging
  console.log('🔍 Available mentors:', availableMentors);
  console.log('🔍 Is array?', Array.isArray(availableMentors));
  console.log('🔍 Length:', availableMentors?.length);

  // Safe mapping
  const safeAvailableMentors = Array.isArray(availableMentors) ? availableMentors : [];

  const handleAssign = () => {
    if (selectedMentor && selectedDate && selectedTime) {
      // SIMPLE: Just use the _id directly - no conversion needed!
      onAssign(selectedMentor._id, selectedDate, selectedTime);
    }
  };

  // Helper functions that use AvailableMentor type
  const getAvailableDates = (mentor: AvailableMentor) => {
    const dates: { date: string; display: string }[] = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const hasAvailability = mentor.availability?.some(avail => 
        avail.dayOfWeek === dayOfWeek
      );
      
      if (hasAvailability) {
        dates.push({
          date: date.toISOString().split('T')[0],
          display: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    }
    
    return dates;
  };

  const getAvailableTimeSlots = () => {
    if (!selectedMentor || !selectedDate) return [];
    
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    
    const availability = selectedMentor.availability?.find(avail => 
      avail.dayOfWeek === dayOfWeek
    );
    
    return availability ? availability.timeSlots : [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Mentor</h2>
              <p className="text-gray-600 mt-1">
                Assign a mentor for {trialClass.student.fullName}'s trial class
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Trial Class Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Trial Class Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Student</p>
                <p className="font-medium">{trialClass.student.fullName}</p>
                <p className="text-sm text-gray-500">{trialClass.student.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium">
                  {trialClass.subject.subjectName} - Grade {trialClass.subject.grade}
                </p>
                <p className="text-sm text-gray-500">{trialClass.subject.syllabus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Preferred Date & Time</p>
                <p className="font-medium">
                  {new Date(trialClass.preferredDate).toLocaleDateString()} at {trialClass.preferredTime}
                </p>
              </div>
            </div>
          </div>

          {/* Available Mentors */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Available Mentors</h3>
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {safeAvailableMentors.length > 0 ? (
                safeAvailableMentors.map((mentor) => (
                  <div
                    key={mentor._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedMentor?._id === mentor._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedMentor(mentor);
                      setSelectedDate('');
                      setSelectedTime('');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{mentor.fullName}</p>
                          <p className="text-sm text-gray-500">{mentor.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Rating: {mentor.rating || 'N/A'}/5
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {mentor.subjectProficiency?.[0]?.subject || 'No subjects'}
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              Level: {mentor.subjectProficiency?.[0]?.level || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Available days: {mentor.availability?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No available mentors found for this subject</p>
                  <p className="text-sm">Try adjusting the date or check mentor availability</p>
                </div>
              )}
            </div>
          </div>

          {/* Date and Time Selection */}
          {selectedMentor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a date</option>
                  {getAvailableDates(selectedMentor).map((dateObj) => (
                    <option key={dateObj.date} value={dateObj.date}>
                      {dateObj.display}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={!selectedDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Choose a time</option>
                  {getAvailableTimeSlots().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Selected Mentor Summary */}
          {selectedMentor && selectedDate && selectedTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Assignment Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900">{selectedMentor.fullName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900">
                    {new Date(selectedDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900">{selectedTime}</span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                A Google Meet link will be generated and sent to both student and mentor.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedMentor || !selectedDate || !selectedTime || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4" />
                <span>Assign Mentor</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};