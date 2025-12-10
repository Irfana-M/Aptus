import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { submitCourseRequest } from '../studentThunk';
import type { AppDispatch, RootState } from '../../../app/store'; // Corrected path based on profile setup
import FormField from '../../../components/ui/FormField';

import { useNavigate } from 'react-router-dom';

interface CustomTimeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: string;
}

const CustomTimeRequestModal: React.FC<CustomTimeRequestModalProps> = ({
  isOpen,
  onClose,
  initialSubject = '',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { courseRequestStatus } = useSelector((state: RootState) => state.student); // Removed error

  const [formData, setFormData] = useState({
    subject: initialSubject,
    mentoringMode: 'one-to-one', // Default
    preferredDay: '',
    startTime: '',
    endTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.preferredDay || !formData.startTime || !formData.endTime) {
      alert("Please fill in all required fields.");
      return;
    }

    const timeRange = `${formData.startTime} - ${formData.endTime}`;
    
    await dispatch(submitCourseRequest({
      subject: formData.subject,
      mentoringMode: formData.mentoringMode,
      preferredDay: formData.preferredDay,
      timeRange: timeRange,
      timezone: formData.timezone
    }));
    
    onClose();
    navigate('/student/subscription-plans');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-800">Request Custom Time</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Subject"
            type="text"
            value={formData.subject}
            onChange={(val) => handleChange('subject', val)}
            required
            placeholder="e.g. Mathematics"
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mentoring Mode
            </label>
            <select
              value={formData.mentoringMode}
              onChange={(e) => handleChange('mentoringMode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="one-to-one">One-on-One</option>
              {/* Add other modes if available */}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Day
            </label>
            <select
              value={formData.preferredDay}
              onChange={(e) => handleChange('preferredDay', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select a day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Start Time"
              type="time"
              value={formData.startTime}
              onChange={(val) => handleChange('startTime', val)}
              required
            />
            <FormField
              label="End Time"
              type="time"
              value={formData.endTime}
              onChange={(val) => handleChange('endTime', val)}
              required
            />
          </div>

          <div className="text-sm text-gray-500 mb-4">
            Timezone: {formData.timezone}
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition duration-200 font-semibold"
            disabled={courseRequestStatus === 'loading'}
          >
            {courseRequestStatus === 'loading' ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomTimeRequestModal;
