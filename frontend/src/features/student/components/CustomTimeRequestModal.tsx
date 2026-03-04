import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { submitCourseRequest } from '../studentThunk';
import { ROUTES } from '../../../constants/routes.constants';
import { showToast } from '../../../utils/toast';
import { studentApi } from '../studentApi';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from "../../../app/hooks";

interface Subject {
  _id?: string;
  subjectName: string;
}

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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { profile, courseRequestStatus } = useAppSelector((state) => state.student);
  const [subjects, setSubjects] = useState<Subject[]>([]); // Store fetched subjects
  
  // Get student's current grade (e.g. "Grade 10")
  const studentGradeName = profile?.academicDetails?.grade || '';
  
  // State for multiple requests
  const [requests, setRequests] = useState([
    {
      subject: initialSubject,
      mentoringMode: 'one-to-one', 
      preferredDays: [] as string[],
      startTime: '',
      endTime: '',
    }
  ]);

  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch subjects on mount
  useEffect(() => {
    if (isOpen) {
        // Fetch subjects for the student's grade
        const fetchSubjects = async () => {
            try {
                const gradeId = typeof profile?.gradeId === 'object' ? profile.gradeId._id : profile?.gradeId;
                const response = await studentApi.fetchSubjectsByGrade(gradeId || 'all');
                setSubjects(response.data || []);
            } catch (error) {
                console.error("Failed to fetch subjects", error);
            }
        };
        fetchSubjects();
    }
  }, [isOpen, profile?.gradeId]);

  if (!isOpen) return null;

  const handleRequestChange = (index: number, field: string, value: string | string[]) => {
    const newRequests = [...requests];
    newRequests[index] = { ...newRequests[index], [field]: value };
    setRequests(newRequests);
  };

  const toggleDay = (index: number, day: string) => {
    const newRequests = [...requests];
    const currentDays = newRequests[index].preferredDays;
    
    if (currentDays.includes(day)) {
        newRequests[index].preferredDays = currentDays.filter(d => d !== day);
    } else {
        newRequests[index].preferredDays = [...currentDays, day];
    }
    setRequests(newRequests);
  };

  const addRequest = () => {
    setRequests([...requests, {
      subject: '',
      mentoringMode: 'one-to-one', 
      preferredDays: [] as string[],
      startTime: '',
      endTime: '',
    }]);
  };

  const removeRequest = (index: number) => {
    if (requests.length > 1) {
        setRequests(requests.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all
    const gradeId = typeof profile?.gradeId === 'object' ? profile.gradeId._id : profile?.gradeId;
    const finalGrade = studentGradeName || gradeId;

    for (const req of requests) {
        if (!req.subject || req.preferredDays.length === 0 || !req.startTime || !req.endTime || !finalGrade) {
            showToast.error("Please fill in all required fields. Ensure your grade is set in your profile.");
            return;
        }
    }

    try {
        // Submit all requests in parallel
        await Promise.all(requests.map(req => 
            dispatch(submitCourseRequest({
                subject: req.subject,
                grade: String(finalGrade || ''), 
                mentoringMode: req.mentoringMode,
                preferredDays: req.preferredDays,
                timeSlot: `${req.startTime}-${req.endTime}`,
                timezone: timezone
            }))
        ));
        
        onClose();
        navigate(ROUTES.STUDENT.SUBSCRIPTION_PLANS);
    } catch (error) {
        console.error("Error submitting requests", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-800">Request Custom Time</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {requests.map((req, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                {requests.length > 1 && (
                    <button
                        type="button"
                        onClick={() => removeRequest(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                    >
                        Remove
                    </button>
                )}
                
                <h3 className="font-medium text-gray-700 mb-3">Subject {index + 1}</h3>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    {subjects.length > 0 ? (
                        <select
                            value={req.subject}
                            onChange={(e) => handleRequestChange(index, 'subject', e.target.value)}
                            className="w-full p-2 border rounded-md"
                            required
                        >
                            <option value="">Select Subject</option>
                             {subjects.map((sub) => (
                                <option key={sub._id || sub.subjectName} value={sub.subjectName}>
                                    {sub.subjectName}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={req.subject}
                            onChange={(e) => handleRequestChange(index, 'subject', e.target.value)}
                            className="w-full p-2 border rounded-md"
                            placeholder="e.g. Mathematics"
                            required
                        />
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Days</label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(index, day)}
                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                    req.preferredDays.includes(day)
                                        ? 'bg-teal-500 text-white border-teal-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                {day.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="mb-4">
                         <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                        type="time"
                        value={req.startTime}
                        onChange={(e) => handleRequestChange(index, 'startTime', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                        type="time"
                        value={req.endTime}
                        onChange={(e) => handleRequestChange(index, 'endTime', e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                        />
                    </div>
                </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addRequest}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors"
          >
            + Add Another Subject
          </button>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition duration-200 font-semibold mt-4"
            disabled={courseRequestStatus === 'loading'}
          >
            {courseRequestStatus === 'loading' ? 'Submitting...' : 'Submit Request(s)'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomTimeRequestModal;
