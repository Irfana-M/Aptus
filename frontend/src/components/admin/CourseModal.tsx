import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGradesAdmin,
  fetchSubjectsByGradeAdmin,
  fetchAvailableMentorsForCourse,
  createOneToOneCourse,
} from "../../features/admin/adminThunk";
import {
  selectGrades,
  selectSubjectsLoading,
  selectAvailableMentorsForCourse,
  selectCourseCreationLoading,
  selectCourseCreationError,
} from "../../features/admin/adminSelectors";
import type { AppDispatch, RootState } from "../../app/store";
import { showToast } from "../../utils/toast";
import type { Course } from "../../types/courseTypes";
import type { Grade } from "../../features/admin/adminSelectors";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "01:00 PM - 02:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM",
  "07:00 PM - 08:00 PM",
];

interface CourseModalProps {
  course?: Course | null; 
  initialValues?: {
    gradeId?: string;
    subjectId?: string;
    dayOfWeek?: number | string;
    timeSlot?: string;
    mentorId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    fee?: string | number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (courseData: {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    studentId?: string;
    schedule: {
      days: string[];
      timeSlot?: string;
    };
    startDate: string;
    endDate: string;
    fee: number;
  }) => Promise<void>;
  loading?: boolean;
}

// Grade interface removed as it is now imported from adminSelectors

export const CourseModal: React.FC<CourseModalProps> = ({ course, initialValues, isOpen, onClose, onSave }) => {
  const dispatch = useDispatch<AppDispatch>();

  // 1. DECLARE FORM STATE FIRST
  const [form, setForm] = useState({
    gradeId: "",
    subjectId: "",
    selectedDays: [] as string[],
    timeSlot: "",
    mentorId: "",
    studentId: "",
    startDate: "",
    endDate: "",
    fee: "",
  });

  // ... (selectors omitted for brevity, no changes needed there) ...
  const rawGrades = useSelector(selectGrades);
  const grades = useMemo(() => (Array.isArray(rawGrades) ? rawGrades : []) as Grade[], [rawGrades]);
  
  const subjectsMap = useSelector((state: RootState) => state.admin.subjects);
  const subjects = useMemo(() => {
    if (!form.gradeId) return [];
    return subjectsMap[form.gradeId] || [];
  }, [form.gradeId, subjectsMap]);
  
  const subjectsLoading = useSelector(selectSubjectsLoading);
  const mentors = useSelector(selectAvailableMentorsForCourse);
  const creating = useSelector(selectCourseCreationLoading);
  const error = useSelector(selectCourseCreationError);

  // 3. SEPARATE SYLLABUS STATE
  const [selectedSyllabus, setSelectedSyllabus] = useState<string>("");

  // Update syllabus when form.gradeId changes
  useEffect(() => {
    if (form.gradeId && grades.length > 0) {
      const selectedGrade = grades.find((g: Grade) => g._id === form.gradeId);
      if (selectedGrade && selectedGrade.syllabus) {
        setSelectedSyllabus(selectedGrade.syllabus);
      }
    }
  }, [form.gradeId, grades]);

  // Derived state for Syllabus and Grades
  const uniqueSyllabi = useMemo(() => {
    const syllabi = new Set(grades.map((g: Grade) => g.syllabus).filter((s): s is string => !!s));
    return Array.from(syllabi);
  }, [grades]);

  const filteredGrades = useMemo(() => {
    if (!selectedSyllabus) return [];
    return grades.filter((g: Grade) => g.syllabus === selectedSyllabus);
  }, [grades, selectedSyllabus]);

  const handleSyllabusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSyllabus = e.target.value;
    setSelectedSyllabus(newSyllabus);
    setForm(prev => ({ ...prev, gradeId: "", subjectId: "", mentorId: "" }));
  };

  // Fetch grades when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchGradesAdmin());
    }
  }, [isOpen, dispatch]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (course) {
        setForm({
          gradeId: course?.grade?._id || "",
          subjectId: course?.subject?._id || "",
          selectedDays: course?.schedule?.days || [],
          timeSlot: course?.timeSlot || course?.schedule?.timeSlot || "",
          mentorId: course?.mentor?._id || "",
          studentId: course?.student?._id || "",
          startDate: course?.startDate ? new Date(course.startDate).toISOString().split('T')[0] : "",
          endDate: course?.endDate ? new Date(course.endDate).toISOString().split('T')[0] : "",
          fee: course?.fee?.toString() || "",
        });
      } else if (initialValues) {
         setForm({
          gradeId: initialValues?.gradeId || "",
          subjectId: initialValues?.subjectId || "",
          selectedDays: initialValues?.dayOfWeek !== undefined ? [DAYS[Number(initialValues.dayOfWeek)]] : [],
          timeSlot: initialValues?.timeSlot || "",
          mentorId: initialValues?.mentorId || "",
          studentId: initialValues?.studentId || "",
          startDate: initialValues?.startDate || "",
          endDate: initialValues?.endDate || "",
          fee: initialValues?.fee?.toString() || "",
        });
      } else {
        // Reset to empty
        setForm({
            gradeId: "",
            subjectId: "",
            selectedDays: [],
            timeSlot: "",
            mentorId: "",
            studentId: "",
            startDate: "",
            endDate: "",
            fee: "",
        });
        setSelectedSyllabus("");
      }
    }
  }, [isOpen, course, initialValues]);

  // Fetch subjects when grade changes
  useEffect(() => {
    if (form.gradeId) {
      dispatch(fetchSubjectsByGradeAdmin(form.gradeId));
    }
  }, [form.gradeId, dispatch]);

  // Fetch available mentors when SUBJECT, Grade, or Schedule changes
  useEffect(() => {
    if (form.subjectId && form.gradeId) {
      const payload: any = {
        gradeId: form.gradeId,
        subjectId: form.subjectId, 
        days: form.selectedDays,
      };

      if (form.timeSlot) {
        payload.timeSlot = form.timeSlot;
      }

      if (course?._id) {
        payload.excludeCourseId = course._id;
      }

      dispatch(fetchAvailableMentorsForCourse(payload));
    }
  }, [form.gradeId, form.subjectId, form.selectedDays, form.timeSlot, dispatch, subjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.selectedDays.length === 0) {
        showToast.warning("Please select at least one day.");
        return;
      }

      const courseData = {
        gradeId: form.gradeId,
        subjectId: form.subjectId,
        mentorId: form.mentorId,
        studentId: form.studentId || undefined, 
        schedule: {
            days: form.selectedDays,
            timeSlot: form.timeSlot || undefined,
        },
        startDate: form.startDate,
        endDate: form.endDate,
        fee: Number(form.fee),
      };

      if (onSave) {
        await onSave(courseData);
      } else {
        await dispatch(createOneToOneCourse(courseData)).unwrap();
        showToast.success("Course created successfully!");
      }
      
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast.error(err?.message || "Failed to create course");
    }
  };

  if (!isOpen) return null;

  return (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
          
          <h2 className="text-2xl font-bold text-gray-900">{course ? "Edit Course" : "Create New Course"}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded mb-6">
              {typeof error === 'string' ? error : 'An error occurred'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Syllabus Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Syllabus</label>
              <select
                value={selectedSyllabus}
                onChange={handleSyllabusChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={creating}
              >
                <option value="">Select Syllabus</option>
                {uniqueSyllabi.map(syllabus => (
                  <option key={syllabus} value={syllabus as string}>{syllabus}</option>
                ))}
              </select>
            </div>

            {/* Grade Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
              <select
                value={form.gradeId}
                onChange={e => setForm({ ...form, gradeId: e.target.value, subjectId: "", mentorId: "" })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
                required
                disabled={creating || !selectedSyllabus}
              >
                <option value="">Select Grade</option>
                {filteredGrades.map((g: Grade) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {!selectedSyllabus && (
                <p className="text-xs text-gray-500 mt-1">Please select a syllabus first</p>
              )}
            </div>

            

            {/* Subject Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={form.subjectId}
                onChange={e => setForm({ ...form, subjectId: e.target.value, mentorId: "" })}
                disabled={!form.gradeId || subjectsLoading || creating}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                required
              >
                <option value="">Select Subject</option>
                {Array.isArray(subjects) && subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              {subjectsLoading && form.gradeId && (
                <p className="text-sm text-gray-500 mt-1">Loading subjects...</p>
              )}
            </div>

            {/* Available Mentors (Moved up) */}
            {form.subjectId && (
              <div className="border-t pt-6 pb-6">
                <h3 className="font-semibold mb-4">Available Mentors ({(mentors.matches?.length || 0) + (mentors.alternates?.length || 0)})</h3>
                <div className="grid gap-3 max-h-60 overflow-y-auto p-2">
                  {Array.isArray(mentors.matches) && mentors.matches.length > 0 ? (
                    mentors.matches.map(m => (
                      <label
                        key={m._id}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          form.mentorId === m._id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mentor"
                          value={m._id}
                          checked={form.mentorId === m._id}
                          onChange={e => setForm({ ...form, mentorId: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                          disabled={creating}
                          required
                        />
                        <img 
                          src={m.profileImageUrl || m.profilePicture || "/avatar.png"} 
                          alt={m.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{m.fullName}</p>
                            {m.hasConflict && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">
                                RESERVED
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                             ★ {m.rating?.toFixed(1) || 'N/A'}
                             {m.hasConflict && (
                               <span className="text-red-500 ml-2 text-xs"> (Slot already booked)</span>
                             )}
                          </p>
                        </div>
                      </label>
                    ))
                  ) : Array.isArray(mentors.alternates) && mentors.alternates.length > 0 ? (
                    mentors.alternates.map(m => (
                      <label
                        key={m._id}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          form.mentorId === m._id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                      >
                         <input
                          type="radio"
                          name="mentor"
                          value={m._id}
                          checked={form.mentorId === m._id}
                          onChange={e => setForm({ ...form, mentorId: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                          disabled={creating}
                          required
                        />
                        <img 
                          src={m.profileImageUrl || m.profilePicture || "/avatar.png"} 
                          alt={m.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{m.fullName}</p>
                            {m.hasConflict && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">
                                RESERVED
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                             ★ {m.rating?.toFixed(1) || 'N/A'} (Alternate)
                             {m.hasConflict && (
                               <span className="text-red-500 ml-2 text-xs"> (Slot already booked)</span>
                             )}
                          </p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      {subjectsLoading ? "Loading mentors..." : "No mentors available for this subject"}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Day Select (Multi-selection Checkboxes) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days <span className="text-gray-400 font-normal">(Select up to 3)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAYS.map((day) => (
                  <label 
                    key={day} 
                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                      form.selectedDays.includes(day) ? "bg-blue-50 border-blue-200 text-blue-700" : "hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded"
                      checked={form.selectedDays.includes(day)}
                      onChange={() => {
                        setForm(prev => {
                          const alreadySelected = prev.selectedDays.includes(day);
                          if (alreadySelected) {
                            return { ...prev, selectedDays: prev.selectedDays.filter(d => d !== day) };
                          } else if (prev.selectedDays.length < 3) {
                            return { ...prev, selectedDays: [...prev.selectedDays, day] };
                          } else {
                            showToast.warning("Maximum 3 days allowed");
                            return prev;
                          }
                        });
                      }}
                      disabled={creating}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            {/* Time Slot (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Slot <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <select
                value={form.timeSlot}
                onChange={e => setForm({ ...form, timeSlot: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={creating}
              >
                <option value="">Select Time Slot (Optional)</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Currently showing all mentors proficient in this subject. 
                {form.timeSlot ? " Conflict check will act on submission." : " No schedule constraints applied."}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input 
                  type="date" 
                  value={form.startDate} 
                  onChange={e => setForm({ ...form, startDate: e.target.value })} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input 
                  type="date" 
                  value={form.endDate} 
                  onChange={e => setForm({ ...form, endDate: e.target.value })} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={creating}
                />
              </div>
            </div>

            {/* Fee (Optional/Hidden - Default to 0 in backend) */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fee (₹)</label>
              <input
                type="number"
                value={form.fee}
                onChange={e => setForm({ ...form, fee: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div> */}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={creating || !form.mentorId || !form.startDate || !form.endDate || (mentors.matches?.find(m => m._id === form.mentorId)?.hasConflict || mentors.alternates?.find(m => m._id === form.mentorId)?.hasConflict)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {creating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {course ? "Updating..." : "Creating..."}
                  </span>
                ) : (mentors.matches?.find(m => m._id === form.mentorId)?.hasConflict || mentors.alternates?.find(m => m._id === form.mentorId)?.hasConflict) ? "Slot Reserved" : course ? "Update Course" : "Create Course"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
