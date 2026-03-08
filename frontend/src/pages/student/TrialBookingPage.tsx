import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  User,
  Search,
  Shield,
  Calendar as CalendarIcon,
  Clock,
  Star,
  Video,
} from "lucide-react";
import Header from "../../components/layout/Header";
import FormField from "../../components/ui/FormField";
import { Calendar } from "../../components/ui/Calendar";
import {
  requestTrialClass,
  fetchGrades,
  fetchSubjectsByGradeAndSyllabus,
  updateTrialClass,
  fetchStudentTrialClasses,
  fetchAvailableTrialSlots,
} from "../../features/trial/student/studentTrialThunk";
import {
  clearError,
  clearBookingStatus,
  setSelectedGrade,
  clearFormData,
} from "../../features/trial/student/studentTrialSlice";
import {
  selectBookingStatus,
  selectStudentTrialError,
  selectGrades,
  selectSubjects,
  selectGradesLoading,
  selectSubjectsLoading,
} from "../../features/trial/student/studentTrialSelectors";
import type { AppDispatch, RootState } from "../../app/store";
import type {
  Grade,
  TrialClassRequest,
  TrialClassResponse,
  TrialClassStudent,
} from "../../types/trial.types";
import type { User as AuthUser } from "../../types/auth.types";
import { showToast } from '../../utils/toast';

// Constants
const TIME_OPTIONS = [
  { value: "", label: "Select time", disabled: true },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  {value: "19:00", label: "7:00 PM"},
  {value: "20:00", label: "8:00 PM - 9:00 PM"},
];

const STATS = [
  { number: "95%", label: "Satisfaction Rate" },
  { number: "500+", label: "Students Helped" },
  { number: "50+", label: "Expert Mentors" },
  { number: "24/7", label: "Support" },
];

const BENEFITS = [
  {
    icon: User,
    title: "1-on-1 Expert Session",
    description: "Personalized attention from experienced mentors",
    color: "teal" as const,
  },
  {
    icon: Search,
    title: "Platform Experience",
    description: "Explore our interactive learning tools and features",
    color: "blue" as const,
  },
  {
    icon: Shield,
    title: "Zero Risk",
    description: "No commitment required, cancel anytime",
    color: "green" as const,
  },
  {
    icon: Clock,
    title: "Flexible Timing",
    description: "Choose slots that work best for your schedule",
    color: "purple" as const,
  },
];

const HOW_IT_WORKS_STEPS = [
  { step: 1, text: "Select your grade and subject" },
  { step: 2, text: "Choose date and time" },
  { step: 3, text: "Get meeting link via email" },
  { step: 4, text: "Attend 1-hour trial session" },
  { step: 5, text: "Provide your feedback" },
];

// Interfaces
interface FormData {
  studentName: string;
  email: string;
  grade: string;
  syllabus: string;
  subject: string;
  time: string;
  notes: string;
}

interface FormErrors {
  studentName?: string;
  email?: string;
  grade?: string;
  syllabus?: string;
  subject?: string;
  time?: string;
  date?: string;
}

// StudentInfo interface removed as it was unused and replaced by TrialClassStudent

interface TrialSlot {
    startTime: string;
    mentorCount: number;
}

// Helper Functions
const extractGradeNumber = (gradeName: string): number | null => {
  const match = gradeName.match(/\d+/);
  return match ? parseInt(match[0]) : null;
};

const extractStudentInfo = (booking: TrialClassResponse, currentUser: AuthUser | null): { studentName: string; studentEmail: string } => {
  let studentName = '';
  let studentEmail = '';

  if (booking.student && typeof booking.student === 'object') {
    const student = booking.student as TrialClassStudent;
    studentName = student.fullName || currentUser?.fullName || '';
    studentEmail = student.email || currentUser?.email || '';
  } else {
    studentName = currentUser?.fullName || '';
    studentEmail = currentUser?.email || '';
  }

  return { studentName, studentEmail };
};

const getAvailableDates = (): number[] => {
  const dates: number[] = [];
  const today = new Date();
  
  // Start from 0 to include today
  for (let i = 0; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    
    // Optional: You might want to allow weekends if user requested "today" specifically?
    // For now, keeping weekend exclusion but including today if it's a weekday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(date.getTime());
    }
  }
  
  return dates;
};

// Helper to filter time options based on selected date and backend availability
const getFilteredTimeOptions = (
  selectedDate: number | null,
  availableBackendSlots: TrialSlot[] = []
) => {
    if (!selectedDate) return TIME_OPTIONS;

    const now = new Date();
    const selected = new Date(selectedDate);
    
    const isToday = selected.getDate() === now.getDate() && 
                    selected.getMonth() === now.getMonth() && 
                    selected.getFullYear() === now.getFullYear();

    // Add 1 hour buffer (user can't book a slot starting in less than 1 hour)
    const currentHour = now.getHours() + 1; 

    return TIME_OPTIONS.map(option => {
        if (!option.value) return option; // "Select time" placeholder
        
        const [slotHour] = option.value.split(':').map(Number);
        
        // 1. Check if it's in the past (only for today)
        if (isToday && slotHour <= currentHour) {
            return { ...option, disabled: true, label: `${option.label} (passed)` };
        }

        // 2. Check if there's mentor availability from backend
        // Note: backend slots are like "09:00", so we can match by startTime
        const isAvailable = availableBackendSlots.some(s => s.startTime === option.value && s.mentorCount > 0);
        
        if (!isAvailable) {
            return { ...option, disabled: true, label: `${option.label} (no slots)` };
        }

        return option;
    });
};

const TrialBookingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Redux Selectors
  const { user } = useSelector((state: RootState) => state.auth);
  const bookingStatus = useSelector(selectBookingStatus);
  const trialError = useSelector(selectStudentTrialError);
  const grades = useSelector(selectGrades);
  const subjects = useSelector(selectSubjects);
  const gradesLoading = useSelector(selectGradesLoading);
  const subjectsLoading = useSelector(selectSubjectsLoading);
  const studentProfile = useSelector((state: RootState) => state.student.profile);

  // State
  const [formData, setFormData] = useState<FormData>({
    studentName: user?.fullName || "",
    email: user?.email || "",
    grade: "",
    syllabus: "",
    subject: "",
    time: "",
    notes: "",
  });

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [availableBackendSlots, setAvailableBackendSlots] = useState<TrialSlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [availableSyllabi, setAvailableSyllabi] = useState<string[]>([]);
  const [hasExistingBooking, setHasExistingBooking] = useState(false);
  const [existingBooking, setExistingBooking] = useState<TrialClassResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Derived State
  const isSubmitting = bookingStatus === "loading";

  // Core Functions
  const checkExistingBookings = useCallback(async () => {
    try {
      const trialClasses = await dispatch(fetchStudentTrialClasses()).unwrap();
      const upcomingBooking = trialClasses.find(
        (tc: TrialClassResponse) => tc.status === 'requested' || tc.status === 'assigned'
      );
      
      setHasExistingBooking(!!upcomingBooking);
      setExistingBooking(upcomingBooking || null);
    } catch (error) {
      console.error('Error checking existing bookings:', error);
    }
  }, [dispatch]);

  const resetForm = useCallback(() => {
    setFormData({
      studentName: user?.fullName || '',
      email: user?.email || '',
      grade: '',
      syllabus: '',
      subject: '',
      time: '',
      notes: ''
    });
    setSelectedDate(null);
    setErrors({});
    setAvailableSyllabi([]);
  }, [user]);

  // Initialization
  useEffect(() => {
    dispatch(fetchGrades());
    checkExistingBookings();
    
    // Safety check: ensure profile is loaded if missing (though ProtectedRoute should handle this)
    if (!studentProfile && user) {
        // dispatch(fetchStudentProfile()); // optional
    }
  }, [dispatch, checkExistingBookings, studentProfile, user]);

  // Pre-fill form from Student Profile
  useEffect(() => {
    if (studentProfile && !hasExistingBooking && !formData.grade) {
        console.log('📝 Pre-filling form from profile:', studentProfile);
        
        let targetGradeId = '';
        
        // 1. Try to find grade ID directly
        if (studentProfile.gradeId) {
            const gradeIdVal = studentProfile.gradeId as unknown as string | { _id: string };
            targetGradeId = typeof gradeIdVal === 'string' 
                ? gradeIdVal 
                : gradeIdVal._id || String(gradeIdVal);
        } 
        // 2. Try to match by grade name if no ID
        else if (studentProfile.academicDetails?.grade && grades.length > 0) {
            const gradeName = studentProfile.academicDetails.grade;
            // Try to find a grade object that matches the name
            const matchingGrade = grades.find(g => g.name === gradeName || g.name.includes(gradeName));
            if (matchingGrade) targetGradeId = matchingGrade._id;
        }

        const targetSyllabus = studentProfile.academicDetails?.syllabus || '';

        if (targetGradeId) {
            setFormData(prev => ({
                ...prev,
                studentName: studentProfile.fullName || prev.studentName,
                email: studentProfile.email || prev.email,
                grade: targetGradeId,
                syllabus: targetSyllabus
            }));
            
            // Trigger syllabus options population
            dispatch(setSelectedGrade(targetGradeId));
        }
    }
  }, [studentProfile, grades, hasExistingBooking, formData.grade, dispatch]);

  // Form Data Effects
  useEffect(() => {
    if (formData.grade) {
      const selectedGrade = grades.find((grade) => grade._id === formData.grade);
      if (selectedGrade) {
        const gradeName = selectedGrade.name;
        const syllabiForThisGrade = grades
          .filter((grade) => grade.name === gradeName)
          .map((grade) => grade.syllabus);

        const uniqueSyllabi = [...new Set(syllabiForThisGrade)];
        setAvailableSyllabi(uniqueSyllabi);
        
        // Auto-select syllabus if there's only one option and it's not set
        if (uniqueSyllabi.length === 1 && !formData.syllabus) {
             setFormData(prev => ({ ...prev, syllabus: uniqueSyllabi[0] }));
        }
      }
    } else {
      setAvailableSyllabi([]);
    }
  }, [formData.grade, grades, formData.syllabus]);

  useEffect(() => {
    if (formData.grade && formData.syllabus) {
      const selectedGrade = grades.find((grade) => grade._id === formData.grade);
      if (selectedGrade) {
        const gradeNumber = extractGradeNumber(selectedGrade.name);
         console.log("gradeName:", selectedGrade.name);
      console.log("gradeNumber:", gradeNumber);
      console.log("syllabus:", formData.syllabus);
        if (gradeNumber) {
          dispatch(
            fetchSubjectsByGradeAndSyllabus({
              grade: gradeNumber,
              syllabus: formData.syllabus,
            })
          );
        }
      }
    }
  }, [formData.grade, formData.syllabus, grades, dispatch]);

  // Fetch real-time availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (formData.subject && selectedDate) {
        try {
          setAvailabilityLoading(true);
          const d = new Date(selectedDate);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const result = await dispatch(fetchAvailableTrialSlots({ 
            subjectId: formData.subject, 
            date: dateStr 
          })).unwrap() as { slots: TrialSlot[] };
          
          setAvailableBackendSlots(result.slots || []);
        } catch (error) {
          console.error('Failed to fetch availability:', error);
          setAvailableBackendSlots([]);
          // Non-blocking error, we'll just show no slots
        } finally {
          setAvailabilityLoading(false);
        }
      } else {
        setAvailableBackendSlots([]);
      }
    };

    fetchAvailability();
  }, [formData.subject, selectedDate, dispatch]);

  // Booking Status Effects
  useEffect(() => {
    if (bookingStatus === 'success') {
      const message = isEditing 
        ? ' Trial class updated successfully! Check your email for updates.'
        : ' Trial class booked successfully! Check your email for the meeting link.';
      
      showToast.success(message);
      resetForm();
      checkExistingBookings();
      setIsEditing(false);

      setTimeout(() => {
        dispatch(clearBookingStatus());
      }, 100);
    }
    
    if (bookingStatus === 'failed' && trialError) {
      showToast.error(`❌ Failed to ${isEditing ? 'update' : 'book'} trial class: ${trialError}`);
      setTimeout(() => {
        dispatch(clearBookingStatus());
        dispatch(clearError());
      }, 100);
    }
  }, [bookingStatus, trialError, isEditing, dispatch, resetForm, checkExistingBookings]);

  // Cleanup
  useEffect(() => {
    return () => {
      dispatch(clearError());
      dispatch(clearBookingStatus());
      dispatch(clearFormData());
    };
  }, [dispatch]);



  const getUniqueGrades = (): Grade[] => {
    const uniqueGrades: Grade[] = [];
    const seenNames = new Set();

    grades.forEach((grade) => {
      if (!seenNames.has(grade.name)) {
        seenNames.add(grade.name);
        uniqueGrades.push(grade);
      }
    });
    
    return uniqueGrades;
  };

  // Event Handlers
  const handleEditBooking = () => {
    if (!existingBooking) {
      showToast.error('No existing booking found');
      return;
    }

    const { studentName, studentEmail } = extractStudentInfo(existingBooking, user);
    const matchingGrade = grades.find(grade => {
      // Use direct ID comparison now that we have gradeId
      return grade._id === existingBooking.subject.gradeId && 
             grade.syllabus === existingBooking.subject.syllabus;
    });
    

    if (matchingGrade) {
      setFormData({
        studentName,
        email: studentEmail,
        grade: matchingGrade._id,
        syllabus: existingBooking.subject.syllabus,
        subject: existingBooking.subject._id || (existingBooking.subject as any).id,
        time: existingBooking.preferredTime,
        notes: existingBooking.notes || ''
      });
      setSelectedDate(new Date(existingBooking.preferredDate).getTime());
      setIsEditing(true);
      showToast.success('Editing your existing booking. Make changes and click "Update Booking".');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast.error('Could not load booking details. Please contact support.');
      console.error('Failed to match grade. Existing booking:', existingBooking);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
    showToast.success('Edit cancelled.');
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };

      if (field === "grade") {
        newFormData.syllabus = "";
        newFormData.subject = "";
      }
      if (field === "syllabus") {
        newFormData.subject = "";
      }

      return newFormData;
    });

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGradeChange = (gradeId: string) => {
    handleInputChange("grade", gradeId);
    setFormData((prev) => ({ ...prev, subject: "" }));
    dispatch(setSelectedGrade(gradeId));
  };

  const handleSyllabusSelect = (syllabus: string) => {
    handleInputChange("syllabus", syllabus);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName = "Student name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.grade) {
      newErrors.grade = "Please select a grade";
    }

    if (!formData.syllabus) {
      newErrors.syllabus = "Please select a syllabus";
    }

    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
    }

    if (!selectedDate) {
      newErrors.date = "Please select a date";
    }

    if (!formData.time) {
      newErrors.time = "Please select a time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    dispatch(clearBookingStatus());
    dispatch(clearError());
    
    if (!validateForm()) {
      showToast.error('Please fix the errors in the form');
      return;
    }

    if (!selectedDate) {
      setErrors(prev => ({ ...prev, date: 'Please select a date' }));
      showToast.error('Please select a date');
      return;
    }

    const bookingData: TrialClassRequest = {
      studentName: formData.studentName,
      email: formData.email,
      grade: formData.grade,
      syllabus: formData.syllabus,
      subject: formData.subject,
      preferredDate: new Date(selectedDate).toISOString(),
      preferredTime: formData.time,
      notes: formData.notes
    };

    const loadingToast = showToast.loading(
      isEditing ? 'Updating your booking...' : 'Booking your trial class...'
    );

    try {
      if (isEditing && existingBooking) {
        await dispatch(updateTrialClass({
          trialClassId: existingBooking.id,
          updates: bookingData
        })).unwrap();
        await checkExistingBookings();
      } else {
        await dispatch(requestTrialClass(bookingData)).unwrap();
      }
    } catch (error: unknown) {
      showToast.dismiss(loadingToast);
      console.error('Booking error:', error);
    }
  };

  const handleLoginClick = (): void => {
    navigate("/login");
  };

  const handleGetStartedClick = (): void => {
    navigate("/register");
  };

  // Render Functions
  const renderBookingInfo = () => {
    const isJoinable = () => {
      if (!existingBooking) return false;
      
      const scheduledDate = new Date(existingBooking.preferredDate);
      const timeString = existingBooking.preferredTime;
      
      let hours, minutes;
      if (timeString.includes('M')) { // AM/PM format
        const [time, modifier] = timeString.split(' ');
        [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
      } else { // 24-hour format
        [hours, minutes] = timeString.split(':').map(Number);
      }
      
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      const diffInMinutes = (scheduledDate.getTime() - now.getTime()) / (1000 * 60);
      
      // Allow joining 15 minutes before
      return diffInMinutes <= 15 && diffInMinutes >= -60; // Allow joining up to 1 hour late
    };

    const canJoin = isJoinable();

    return (
      <div className="text-center py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Trial Class Scheduled!
          </h3>
          <div className="text-left bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm font-medium text-blue-900 mb-2">
              📅 Your upcoming trial class:
            </p>
            <div className="space-y-2">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Date:</span> {new Date(existingBooking!.preferredDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Time:</span> {existingBooking!.preferredTime}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Subject:</span> {existingBooking!.subject.subjectName}
              </p>
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Status:</span> <span className="capitalize font-medium">{existingBooking!.status}</span>
              </p>
            </div>
          </div>

          {existingBooking!.meetLink && (
            <div className="mb-6">
              <a 
                href={existingBooking!.meetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  canJoin 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={(e) => {
                  if (!canJoin) {
                    e.preventDefault();
                    showToast.error('You can join the class 15 minutes before the scheduled time.');
                  }
                }}
              >
                <Video className="w-5 h-5" />
                Join Class
              </a>
              {!canJoin && (
                <p className="text-xs text-gray-500 mt-2">
                  Button will be enabled 15 minutes before class time
                </p>
              )}
            </div>
          )}

          <p className="text-green-700 text-sm mb-4">
            Your trial class is all set. You can edit the details if needed, 
            or wait for the scheduled time to join the session.
          </p>
          <button
            onClick={handleEditBooking}
            className="text-green-600 font-medium hover:text-green-700 hover:underline transition"
          >
            Edit Booking Details
          </button>
        </div>
      </div>
    );
  };

  const renderBookingForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          label="Student Name"
          type="text"
          value={formData.studentName}
          onChange={(value: string) => handleInputChange("studentName", value)}
          placeholder="Enter your full name"
          required
          error={errors.studentName}
        />

        <FormField
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(value: string) => handleInputChange("email", value)}
          placeholder="Enter your email"
          required
          error={errors.email}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Grade <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.grade}
          onChange={(e) => handleGradeChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          disabled={gradesLoading}
        >
          <option value="">
            {gradesLoading ? "Loading grades..." : "Select your grade"}
          </option>
          {getUniqueGrades().map((grade) => (
            <option key={grade._id} value={grade._id}>
              {grade.name}
            </option>
          ))}
        </select>
        {errors.grade && (
          <p className="mt-1 text-sm text-red-500">{errors.grade}</p>
        )}
      </div>

      {formData.grade && availableSyllabi.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education Board <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.syllabus}
            onChange={(e) => handleSyllabusSelect(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
          >
            <option value="">Select education board</option>
            {availableSyllabi.map((syllabus) => (
              <option key={syllabus} value={syllabus}>
                {syllabus}
              </option>
            ))}
          </select>
          {errors.syllabus && (
            <p className="mt-1 text-sm text-red-500">{errors.syllabus}</p>
          )}
        </div>
      )}

      {formData.grade && formData.syllabus && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.subject}
            onChange={(e) => handleInputChange("subject", e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
            disabled={subjectsLoading || subjects.length === 0}
          >
            <option value="">
              {subjectsLoading
                ? "Loading subjects..."
                : subjects.length === 0
                ? "No subjects available for this combination"
                : "Select a subject"}
            </option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.subjectName}
              </option>
            ))}
          </select>
          {errors.subject && (
            <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date <span className="text-red-500">*</span>
          </label>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            availableDates={getAvailableDates()}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-500">{errors.date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Time <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.time}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleInputChange("time", e.target.value)
            }
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none cursor-pointer"
          >
            {getFilteredTimeOptions(selectedDate, availableBackendSlots).map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled || availabilityLoading}
                className={option.disabled ? "text-gray-400 bg-gray-100 placeholder:text-gray-400" : ""}
              >
                {option.label}
              </option>
            ))}
          </select>
          {availabilityLoading && (
            <p className="mt-1 text-xs text-teal-600 animate-pulse font-medium">
              Checking available mentors...
            </p>
          )}
          {errors.time && (
            <p className="mt-1 text-sm text-red-500">{errors.time}</p>
          )}
        </div>
      </div>

      <FormField
        label="Additional Notes (Optional)"
        type="textarea"
        value={formData.notes}
        onChange={(value: string) => handleInputChange("notes", value)}
        placeholder="Any specific topics you want to cover? Learning goals? Questions for the mentor?"
        rows={4}
      />

      <div className="space-y-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 px-6 rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {isEditing ? 'Updating Booking...' : 'Booking Your Class...'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <Video className="w-5 h-5" />
              {isEditing ? 'Update Booking' : 'Book Free Trial Class'}
            </span>
          )}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="w-full bg-gray-500 text-white py-3 px-6 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <p className="text-center text-sm text-gray-500">
        📧 You'll receive a confirmation email with the meeting link
        immediately after booking.
      </p>
    </form>
  );

  const renderMainContent = () => {
    const shouldShowBookingInfo = hasExistingBooking && !isEditing;
    return shouldShowBookingInfo ? renderBookingInfo() : renderBookingForm();
  };

  const renderHeaderContent = () => {
    if (hasExistingBooking && !isEditing) {
      return {
        title: "Your Trial Class Booking",
        description: "You have an upcoming trial class. You can edit your booking details if needed."
      };
    } else if (isEditing) {
      return {
        title: "Update Your Trial Class",
        description: "Update your trial class details below"
      };
    } else {
      return {
        title: "Schedule Your Trial Class",
        description: "Fill in your details to book a 1-hour free session"
      };
    }
  };

  const headerContent = renderHeaderContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Header
        onLoginClick={handleLoginClick}
        onGetStartedClick={handleGetStartedClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="p-4 bg-teal-500 rounded-2xl shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-3">
                Book Your Free Trial Class
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Experience personalized 1-on-1 learning with our expert mentors.
                Discover your potential with zero commitment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mt-12">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-teal-600">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
                <CalendarIcon className="w-7 h-7 text-teal-500" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {headerContent.title}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {headerContent.description}
                  </p>

                  {isEditing && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-900">
                            ✏️ Editing your booking
                          </p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Make your changes and click "Update Booking" below
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="ml-4 px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition"
                        >
                          Cancel Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {renderMainContent()}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-teal-500" />
                Why Choose Trial Class?
              </h3>
              <div className="space-y-5">
                {BENEFITS.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition group"
                  >
                    <div
                      className={`p-2 bg-${benefit.color}-100 rounded-lg group-hover:scale-110 transition`}
                    >
                      <benefit.icon
                        className={`w-4 h-4 text-${benefit.color}-600`}
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {benefit.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">How It Works</h3>
              <div className="space-y-4">
                {HOW_IT_WORKS_STEPS.map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white text-teal-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {item.step}
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Our support team is here to help you with any questions.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">📧</span>
                  <span>support@mentora.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">📞</span>
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">💬</span>
                  <span>Live Chat Available</span>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200">
              <div className="text-center">
                <Shield className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <h4 className="font-semibold text-teal-900">100% Secure</h4>
                <p className="text-sm text-teal-700 mt-1">
                  Your information is protected and secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBookingPage;
