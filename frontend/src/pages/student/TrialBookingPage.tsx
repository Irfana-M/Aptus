import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Search,
  Shield,
  Calendar as CalendarIcon,
  Clock,
  Video,
} from "lucide-react";
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
import StudentLayout from "../../components/students/StudentLayout";

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

    // Add 1 hour buffer
    const currentHour = now.getHours() + 1; 

    return TIME_OPTIONS.map(option => {
        if (!option.value) return option;
        
        const [slotHour] = option.value.split(':').map(Number);
        
        if (isToday && slotHour <= currentHour) {
            return { ...option, disabled: true, label: `${option.label} (passed)` };
        }

        const isAvailable = availableBackendSlots.some(s => s.startTime === option.value && s.mentorCount > 0);
        
        if (!isAvailable) {
            return { ...option, disabled: true, label: `${option.label} (no slots)` };
        }

        return option;
    });
};

const TrialBookingPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Redux Selectors
  const { user } = useSelector((state: RootState) => state.auth);
  const bookingStatus = useSelector(selectBookingStatus);
  const trialError = useSelector(selectStudentTrialError);
  const grades = useSelector(selectGrades);
  const subjects = useSelector(selectSubjects);
  const gradesLoading = useSelector(selectGradesLoading);
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
  }, [dispatch, checkExistingBookings]);

  // Pre-fill form from Student Profile
  useEffect(() => {
    if (studentProfile && !hasExistingBooking && !formData.grade) {
        let targetGradeId = '';
        
        if (studentProfile.gradeId) {
            const gradeIdVal = studentProfile.gradeId as unknown as string | { _id: string };
            targetGradeId = typeof gradeIdVal === 'string' 
                ? gradeIdVal 
                : gradeIdVal._id || String(gradeIdVal);
        } else if (studentProfile.academicDetails?.grade && grades.length > 0) {
            const gradeName = studentProfile.academicDetails.grade;
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
            dispatch(setSelectedGrade(targetGradeId));
        }
    }
  }, [studentProfile, grades, hasExistingBooking, formData.grade, dispatch]);

  // Form Data Effects
  useEffect(() => {
    if (formData.grade) {
      const selectedGrade = grades.find((grade) => grade.id === formData.grade);
      if (selectedGrade) {
        const gradeName = selectedGrade.name;
        const syllabiForThisGrade = grades
          .filter((grade) => grade.name === gradeName)
          .map((grade) => grade.syllabus);

        const uniqueSyllabi = [...new Set(syllabiForThisGrade)];
        setAvailableSyllabi(uniqueSyllabi);
        
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
      const selectedGrade = grades.find((grade) => grade.id === formData.grade);
      if (selectedGrade) {
        const gradeNumber = extractGradeNumber(selectedGrade.name);
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
    if (!existingBooking) return;

    const { studentName, studentEmail } = extractStudentInfo(existingBooking, user);
    const matchingGrade = grades.find(grade => {
      return grade.id === existingBooking.subject.gradeId && 
             grade.syllabus === existingBooking.subject.syllabus;
    });

    if (matchingGrade) {
      setFormData({
        studentName,
        email: studentEmail,
        grade: matchingGrade._id,
        syllabus: existingBooking.subject.syllabus,
        subject: existingBooking.subject.id,
        time: existingBooking.preferredTime,
        notes: existingBooking.notes || ''
      });
      setSelectedDate(new Date(existingBooking.preferredDate).getTime());
      setIsEditing(true);
      showToast.success('Editing your existing booking.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.studentName.trim()) newErrors.studentName = "Student name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.grade) newErrors.grade = "Please select a grade";
    if (!formData.syllabus) newErrors.syllabus = "Please select a syllabus";
    if (!formData.subject) newErrors.subject = "Please select a subject";
    if (!selectedDate) newErrors.date = "Please select a date";
    if (!formData.time) newErrors.time = "Please select a time";

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

    const bookingData: TrialClassRequest = {
      studentName: formData.studentName,
      email: formData.email,
      grade: formData.grade,
      syllabus: formData.syllabus,
      subject: formData.subject,
      preferredDate: new Date(selectedDate!).toISOString(),
      preferredTime: formData.time,
      notes: formData.notes
    };

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
      console.error('Booking error:', error);
    }
  };

  // Render Functions
  const renderBookingInfo = () => {
    const isJoinable = () => {
      if (!existingBooking) return false;
      
      const scheduledDate = new Date(existingBooking.preferredDate);
      const timeString = existingBooking.preferredTime;
      
      let hours, minutes;
      if (timeString.includes('M')) {
        const [time, modifier] = timeString.split(' ');
        [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
      } else {
        [hours, minutes] = timeString.split(':').map(Number);
      }
      
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      const diffInMinutes = (scheduledDate.getTime() - now.getTime()) / (1000 * 60);
      
      return diffInMinutes <= 15 && diffInMinutes >= -60;
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
            Your trial class is all set. You can edit the details if needed.
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
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? "Update Your Booking" : "Book Your Free Trial"}
              </h2>
              {isEditing && (
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700 font-medium transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>

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
                        {grade.name} ({grade.syllabus})
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
                    onChange={(e) => handleInputChange("syllabus", e.target.value)}
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
                  >
                    <option value="">
                      {gradesLoading ? "Loading subjects..." : "Select a subject"}
                    </option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.subjectName}
                      </option>
                    ))}
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                  )}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Choose Date <span className="text-red-500">*</span>
                  </label>
                  <Calendar
                    {...({
                      selected: selectedDate ? new Date(selectedDate) : undefined,
                      onSelect: (date: any) => setSelectedDate(date ? date.getTime() : null),
                      mode: "single"
                    } as any)}
                    className="rounded-xl border border-gray-200 p-4"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-500">{errors.date}</p>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                      disabled={availabilityLoading || !selectedDate || !formData.subject}
                    >
                      <option value="">
                        {availabilityLoading 
                          ? "Checking slots..." 
                          : (!selectedDate || !formData.subject)
                            ? "Select subject and date first"
                            : "Select a time"}
                      </option>
                      {getFilteredTimeOptions(selectedDate, availableBackendSlots).map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.time && (
                      <p className="mt-1 text-sm text-red-500">{errors.time}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                       Special Requirements (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition resize-none"
                      placeholder="Tell us about your learning goals or any specific topics you want to cover..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:scale-95 ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                  }`}
                >
                  {isSubmitting
                    ? isEditing ? "Updating..." : "Processing..."
                    : isEditing ? "Update Booking" : "Confirm Trial Booking"}
                </button>
                <p className="text-center text-xs text-gray-500 mt-4">
                  By booking, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </form>
        </div>
    </div>
  );

  return (
    <StudentLayout title="Book Free Trial">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Column - Benefits & Info */}
          <div className="lg:col-span-5 space-y-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                Start Your Journey to <span className="text-teal-600">Success</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Experience world-class personalized tutoring. Book your free
                trial class today and see the difference our expert mentors can
                make.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {BENEFITS.map((benefit) => (
                <div key={benefit.title} className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${benefit.color}-50 flex items-center justify-center`}>
                    <benefit.icon className={`w-6 h-6 text-${benefit.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{benefit.title}</h3>
                    <p className="mt-1 text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Booking System */}
          <div className="lg:col-span-7">
            {hasExistingBooking && !isEditing 
                ? renderBookingInfo() 
                : renderBookingForm()
            }
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default TrialBookingPage;

