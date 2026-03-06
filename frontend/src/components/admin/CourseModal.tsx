import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGradesAdmin,
  fetchSubjectsByGradeAdmin,
  fetchAvailableMentorsForCourse,
  createCourseThunk,
  searchStudentsAdminThunk,
  enrollStudentToCourseThunk,
  unenrollStudentFromCourseThunk,
} from "../../features/admin/adminThunk";
import {
  selectGrades,
  selectSubjectsLoading,
  selectAvailableMentorsForCourse,
  selectCourseCreationLoading,
  selectCourseCreationError,
} from "../../features/admin/adminSelectors";
import type { AppDispatch, RootState } from "../../app/store";
import type { StudentBaseResponseDto } from "../../types/student.types";
import { Users, CheckCircle, Search, UserPlus, X } from "lucide-react";
import { showToast } from "../../utils/toast";
import { getErrorMessage } from "../../utils/errorUtils";
import type { Course } from "../../types/course.types";
import type { Grade } from "../../features/admin/adminSelectors";
import type { Subject } from "../../types/admin.types";
import { Loader } from "../ui/Loader";

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
    subjectName?: string;
    syllabus?: string;
    dayOfWeek?: number | string;
    selectedDays?: string[];
    timeSlot?: string;
    mentorId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    courseType?: "one-to-one" | "group";
    maxStudents?: number;
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
    courseType?: "one-to-one" | "group";
    maxStudents?: number;
    startDate: string;
    endDate: string;
    fee: number;
  }) => Promise<void>;
  loading?: boolean;
}

interface EnrolledStudent {
  _id?: string;
  id?: string;
  fullName: string;
  email?: string;
  profilePicture?: string;
  profileImageUrl?: string;
}

export const CourseModal: React.FC<CourseModalProps> = ({ course, initialValues, isOpen, onClose, onSave }) => {
  const dispatch = useDispatch<AppDispatch>();

  const [form, setForm] = useState({
    gradeId: "",
    subjectId: "",
    selectedDays: [] as string[],
    timeSlot: "",
    saturdaySlot: "", 
    sundaySlot: "",   
    mentorId: "",
    studentId: "",
    startDate: "",
    endDate: "",
    courseType: "one-to-one" as "one-to-one" | "group",
    maxStudents: 1,
    fee: "",
  });

  // Student Search State
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<StudentBaseResponseDto[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>(course?.enrolledStudentsList || []);

  useEffect(() => {
    if (course?.enrolledStudentsList) {
      setEnrolledStudents(course.enrolledStudentsList);
    }
  }, [course?.enrolledStudentsList]);

  // Debounced Student Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (studentSearchQuery.trim().length >= 2) {
        setIsSearchingStudents(true);
        try {
          const result = await dispatch(searchStudentsAdminThunk(studentSearchQuery)).unwrap();
          // Filter out already enrolled students
          const filteredResults = result.filter((s) => 
             !enrolledStudents.some(es => es._id === (s._id || s.id)) &&
             s.id !== form.studentId && s._id !== form.studentId
          );
          setStudentSearchResults(filteredResults);
        } catch (err) {
          console.error("Failed to search students:", err);
        } finally {
          setIsSearchingStudents(false);
        }
      } else {
        setStudentSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [studentSearchQuery, enrolledStudents, dispatch, form.studentId]);

  const handleEnrollStudent = async (student: StudentBaseResponseDto) => {
    if (!course?._id) return;
    try {
      if (course.courseType === 'one-to-one' && enrolledStudents.length >= 1) {
        showToast.warning("One-to-one courses can only have one student. Please remove the existing student first.");
        return;
      }

      await dispatch(enrollStudentToCourseThunk({ 
        courseId: course._id, 
        studentId: student.id || student._id || ""
      })).unwrap();
      
      showToast.success(`Student ${student.fullName} added successfully`);
      setStudentSearchQuery("");
      // Local update to avoid waiting for parent refresh if any
      setEnrolledStudents(prev => [...prev, student]);
    } catch (err: unknown) {
      showToast.error(getErrorMessage(err));
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!course?._id) return;
    try {
      await dispatch(unenrollStudentFromCourseThunk({ 
        courseId: course._id, 
        studentId 
      })).unwrap();
      
      showToast.success("Student removed successfully");
      setEnrolledStudents(prev => prev.filter(s => s._id !== studentId));
    } catch (err: unknown) {
      showToast.error(getErrorMessage(err));
    }
  };

  const rawGrades = useSelector(selectGrades);
  const grades = useMemo(() => (Array.isArray(rawGrades) ? rawGrades : []) as Grade[], [rawGrades]);
  
  const subjectsMap = useSelector((state: RootState) => state.admin.subjects);
  const subjects = useMemo<Subject[]>(() => {
    return (form.gradeId ? subjectsMap[form.gradeId] || [] : []) as Subject[];
  }, [form.gradeId, subjectsMap]);
  
  const subjectsLoading = useSelector(selectSubjectsLoading);
  const mentors = useSelector(selectAvailableMentorsForCourse);
  const creating = useSelector(selectCourseCreationLoading);
  const error = useSelector(selectCourseCreationError);

  const [selectedSyllabus, setSelectedSyllabus] = useState<string>("");

  useEffect(() => {
    if (form.gradeId && grades.length > 0) {
      const selectedGrade = grades.find((g: Grade) => g._id === form.gradeId);
      if (selectedGrade && selectedGrade.syllabus) {
        setSelectedSyllabus(selectedGrade.syllabus);
      }
    }
  }, [form.gradeId, grades]);

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

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchGradesAdmin());
    }
  }, [isOpen, dispatch]);

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
          courseType: (course as Course)?.courseType || "one-to-one",
          maxStudents: (course as Course)?.maxStudents || 1,
          fee: course?.fee?.toString() || "",
          saturdaySlot: (course?.courseType === "group" && course?.schedule?.timeSlot?.includes("|")) ? course.schedule.timeSlot.split("|")[0] : "",
          sundaySlot: (course?.courseType === "group" && course?.schedule?.timeSlot?.includes("|")) ? course.schedule.timeSlot.split("|")[1] : "",
        });
        if (course?.grade?.syllabus) {
          setSelectedSyllabus(course.grade.syllabus);
        }
      } else if (initialValues) {
         setForm({
          gradeId: initialValues?.gradeId || "",
          subjectId: initialValues?.subjectId || "",
          selectedDays: initialValues.selectedDays || (initialValues?.dayOfWeek !== undefined ? [DAYS[Number(initialValues.dayOfWeek)]] : []),
          timeSlot: initialValues?.timeSlot || "",
          mentorId: initialValues?.mentorId || "",
          studentId: initialValues?.studentId || "",
          startDate: initialValues?.startDate || new Date().toISOString().split('T')[0],
          endDate: initialValues?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          courseType: initialValues?.courseType || "one-to-one",
          maxStudents: initialValues?.maxStudents || (initialValues?.courseType === "group" ? 10 : 1),
          fee: initialValues?.fee?.toString() || "0",
          saturdaySlot: "",
          sundaySlot: "",
        });
        if (initialValues.syllabus) {
            setSelectedSyllabus(initialValues.syllabus);
        }
      } else {
        setForm({
            gradeId: "",
            subjectId: "",
            selectedDays: [],
            timeSlot: "",
            mentorId: "",
            studentId: "",
            startDate: "",
            endDate: "",
            courseType: "one-to-one",
            maxStudents: 1,
            fee: "",
            saturdaySlot: "",
            sundaySlot: "",
        });
        setSelectedSyllabus("");
      }
    }
  }, [isOpen, course, initialValues]);

  useEffect(() => {
    if (form.gradeId) {
      dispatch(fetchSubjectsByGradeAdmin(form.gradeId));
    }
  }, [form.gradeId, dispatch]);

  useEffect(() => {
    if (isOpen && initialValues?.subjectName && subjects.length > 0) {
      const isCurrentIdValid = subjects.some(s => s._id === form.subjectId);
      
      if (!form.subjectId || !isCurrentIdValid) {
        const match = subjects.find(s => 
          s.name?.trim().toLowerCase() === initialValues.subjectName?.trim().toLowerCase()
        );
        if (match) {
          setForm(prev => ({ ...prev, subjectId: match._id }));
        }
      }
    }
  }, [subjects, initialValues?.subjectName, form.subjectId, isOpen]);

  useEffect(() => {
    if (form.subjectId && form.gradeId) {
      const payload: {
        gradeId: string;
        subjectId: string;
        days: string[];
        timeSlot?: string;
        excludeCourseId?: string;
      } = {
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
  }, [form.gradeId, form.subjectId, form.selectedDays, form.timeSlot, dispatch, course?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.selectedDays.length === 0) {
        showToast.warning("Please select at least one day.");
        return;
      }
      if (form.courseType === "group") {
        if (!form.saturdaySlot || !form.sundaySlot) {
          showToast.warning("Please select both Saturday and Sunday time slots for the group class.");
          return;
        }
      }

      const courseData = {
        gradeId: form.gradeId,
        subjectId: form.subjectId,
        mentorId: form.mentorId,
        studentId: form.studentId || undefined, 
        schedule: {
            days: form.selectedDays,
            timeSlot: form.courseType === "group" 
              ? `${form.saturdaySlot}|${form.sundaySlot}` 
              : form.timeSlot || undefined,
        },
        startDate: form.startDate,
        endDate: form.endDate,
        courseType: form.courseType,
        maxStudents: form.courseType === "group" ? Number(form.maxStudents) : 1,
        fee: Number(form.fee),
      };

      if (onSave) {
        await onSave(courseData);
      } else {
        await dispatch(createCourseThunk(courseData)).unwrap();
        showToast.success("Course created successfully!");
      }
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string };
      showToast.error(err?.message || "Failed to save course");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{course ? "Edit Course" : "Create New Course"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl" type="button">✕</button>
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
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Course Type Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Type</label>
                <div className="flex p-1 bg-gray-100 rounded-lg">
                  <button type="button" onClick={() => setForm({ ...form, courseType: "one-to-one", maxStudents: 1 })} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.courseType === "one-to-one" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>One-to-One</button>
                  <button type="button" onClick={() => setForm({ ...form, courseType: "group", maxStudents: 10 })} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${form.courseType === "group" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}>Group Class</button>
                </div>
              </div>
              {form.courseType === "group" && (
                <div className="animate-in slide-in-from-left duration-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Students</label>
                  <input type="number" min="2" max="50" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                </div>
              )}
            </div>

            {/* Subject Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value, mentorId: "" })} disabled={!form.gradeId || subjectsLoading || creating} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50" required>
                <option value="">Select Subject</option>
                {Array.isArray(subjects) && (subjects as Subject[]).map(s => {
                  const subjectId = s._id || s.id;
                  const subjectName = s.subjectName || s.name;
                  return (
                    <option key={subjectId} value={subjectId}>{subjectName}</option>
                  );
                })}
              </select>
            </div>

            {/* Available Mentors */}
            {form.subjectId && (
              <div className="border-t pt-6 pb-6">
                <h3 className="font-semibold mb-4">Available Mentors ({(mentors.matches?.length || 0) + (mentors.alternates?.length || 0)})</h3>
                <div className="grid gap-3 max-h-60 overflow-y-auto p-2">
                  {course?.mentor && !mentors.matches?.some(m => m._id === course.mentor._id) && !mentors.alternates?.some(m => m._id === course.mentor._id) && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-tight">Currently Assigned Mentor</p>
                      <label className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-20">
                        <input type="radio" name="mentor" value={course.mentor._id} checked={form.mentorId === course.mentor._id} onChange={e => setForm({ ...form, mentorId: e.target.value })} className="w-4 h-4 text-blue-600" disabled={creating} required />
                        <img src={course.mentor.profileImageUrl || course.mentor.profilePicture || "/avatar.png"} alt={course.mentor.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div className="flex-1">
                           <p className="font-bold text-gray-900">{course.mentor.fullName} (Current)</p>
                           <p className="text-xs text-blue-600 font-medium">Mentor for this course</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {Array.isArray(mentors.matches) && mentors.matches.map(m => {
                    const isCurrent = course?.mentor?._id === m._id;
                    return (
                      <label key={m._id} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${form.mentorId === m._id ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200"} ${isCurrent ? "ring-1 ring-blue-400" : ""}`}>
                        <input type="radio" name="mentor" value={m._id} checked={form.mentorId === m._id} onChange={e => setForm({ ...form, mentorId: e.target.value })} className="w-4 h-4 text-blue-600" disabled={creating} required />
                        <img src={m.profileImageUrl || m.profilePicture || "/avatar.png"} alt={m.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">{m.fullName} {isCurrent && <span className="text-blue-600 text-xs font-bold underline decoration-blue-200 ml-1">(CURRENT)</span>}</p>
                            {m.hasConflict && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">RESERVED</span>}
                          </div>
                          <p className="text-sm text-gray-600">★ {m.rating?.toFixed(1) || 'N/A'}{m.hasConflict && <span className="text-red-500 ml-2 text-xs"> (Slot already booked)</span>}</p>
                        </div>
                      </label>
                    );
                  })}

                  {Array.isArray(mentors.alternates) && mentors.alternates.map(m => (
                    <label key={m._id} className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${form.mentorId === m._id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                      <input type="radio" name="mentor" value={m._id} checked={form.mentorId === m._id} onChange={e => setForm({ ...form, mentorId: e.target.value })} className="w-4 h-4 text-blue-600" disabled={creating} required />
                      <img src={m.profileImageUrl || m.profilePicture || "/avatar.png"} alt={m.fullName} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{m.fullName}</p>
                          {m.hasConflict && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">RESERVED</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                  
                  {!subjectsLoading && !mentors.matches?.length && !mentors.alternates?.length && !course?.mentor && (
                    <p className="text-gray-500 text-center py-4">No mentors available for this subject</p>
                  )}
                </div>
              </div>
            )}

            {/* Enrolled Students Section - Only in Edit Mode */}
            {course && (
              <div className="border-t pt-6 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users size={18} className="text-blue-600" />
                    Enrolled Students ({enrolledStudents.length}/{form.maxStudents})
                  </h3>
                </div>

                {/* Student Search Bar */}
                <div className="relative mb-4">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students to add..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-blue-100 rounded-lg bg-blue-50/30 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                  />
                  {isSearchingStudents && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader size="sm" color="text-blue-500" />
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {studentSearchResults.length > 0 && (
                  <div className="mb-6 border rounded-xl overflow-hidden shadow-lg border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Search Results</span>
                      <button type="button" onClick={() => setStudentSearchResults([])} className="text-blue-400 hover:text-blue-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
              <div className="max-h-48 overflow-y-auto bg-white">
                {studentSearchResults.map((s) => (
                  <div key={s.id || s._id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-0 transition-colors">
                    <div className="flex items-center gap-3">
                      {s.profileImageUrl || s.profilePicture ? (
                        <img src={s.profileImageUrl || s.profilePicture} alt={s.fullName} className="w-8 h-8 rounded-full border border-gray-100 object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {s.fullName?.charAt(0) || 'S'}
                        </div>
                      )}
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{s.fullName}</p>
                              <p className="text-xs text-gray-500">{s.email}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEnrollStudent(s)}
                            className="bg-blue-100 text-blue-600 p-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Add Student"
                          >
                            <UserPlus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enrolled Students List */}
                <div className="grid gap-3">
                  {enrolledStudents.length > 0 ? (
                    enrolledStudents.map((s) => (
                      <div key={s.id || s._id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl group hover:border-blue-200 hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                          {s.profileImageUrl || s.profilePicture ? (
                            <img src={s.profileImageUrl || s.profilePicture} alt={s.fullName} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                              {s.fullName?.charAt(0) || 'S'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{s.fullName}</p>
                            <p className="text-xs text-gray-500">{s.email || "No email provided"}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUnenrollStudent(s.id || s._id || '')}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Remove Student"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Users size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No students enrolled yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Day Select */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Days <span className="text-gray-400 font-normal lowercase">(Selected {form.selectedDays.length}/3)</span>
                </label>
                {form.timeSlot && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 shadow-sm">Slot: {form.timeSlot}</span>}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(form.courseType === "group" ? ["Saturday", "Sunday"] : DAYS).map((day) => {
                    const isSelected = form.selectedDays.includes(day);
                    return (
                      <label key={day} className={`relative flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${isSelected ? "bg-blue-600 border-blue-600 text-white shadow-md transform scale-[1.02]" : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                        <input type="checkbox" className="sr-only" checked={isSelected} onChange={() => { if (isSelected) { setForm({ ...form, selectedDays: form.selectedDays.filter(d => d !== day) }); } else if (form.selectedDays.length < 3) { setForm({ ...form, selectedDays: [...form.selectedDays, day] }); } else { showToast.warning("Maximum 3 days allowed"); } }} disabled={creating} />
                        <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-900"}`}>{day}</span>
                        {isSelected && <div className="absolute top-1.5 right-1.5"><CheckCircle size={14} className="text-white fill-blue-600" /></div>}
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Group Time Slots */}
            {form.courseType === "group" && form.mentorId && (() => {
              const selectedMentor = [...(mentors.matches || []), ...(mentors.alternates || [])].find(m => m._id === form.mentorId);
              if (!selectedMentor) return null;
              
              // Get current course's time slots if editing (to show them as available)
              const currentSaturdaySlot = course?.schedule?.timeSlot?.includes('|') 
                ? course.schedule.timeSlot.split('|')[0] 
                : '';
              const currentSundaySlot = course?.schedule?.timeSlot?.includes('|') 
                ? course.schedule.timeSlot.split('|')[1] 
                : '';

              // Filter slots: show unbooked slots OR current course's slot
              const satSalots = selectedMentor.availability?.find((a) => a.day === 'Saturday')?.slots?.filter((s) => {
                const slotTime = `${s.startTime}-${s.endTime}`;
                return !s.isBooked || slotTime === currentSaturdaySlot;
              }) || [];
              
              const sunSalots = selectedMentor.availability?.find((a) => a.day === 'Sunday')?.slots?.filter((s) => {
                const slotTime = `${s.startTime}-${s.endTime}`;
                return !s.isBooked || slotTime === currentSundaySlot;
              }) || [];

              return (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Saturday Slot</label>
                    <select value={form.saturdaySlot} onChange={e => setForm({ ...form, saturdaySlot: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required disabled={creating}>
                      <option value="">Select time...</option>
                      {satSalots.map((s, i) => <option key={i} value={`${s.startTime}-${s.endTime}`}>{s.startTime} - {s.endTime}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sunday Slot</label>
                    <select value={form.sundaySlot} onChange={e => setForm({ ...form, sundaySlot: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required disabled={creating}>
                      <option value="">Select time...</option>
                      {sunSalots.map((s, i) => <option key={i} value={`${s.startTime}-${s.endTime}`}>{s.startTime} - {s.endTime}</option>)}
                    </select>
                  </div>
                </div>
              );
            })()}


            {/* 1:1 Time Slot */}
            {form.courseType === "one-to-one" && (() => {
              // Get available time slots from selected mentor
              const selectedMentor = [...(mentors.matches || []), ...(mentors.alternates || [])].find(m => m._id === form.mentorId);
              const currentCourseSlot = course?.timeSlot || course?.schedule?.timeSlot || '';
              
              let availableSlots: string[] = [];
              
              if (selectedMentor && form.selectedDays.length > 0) {
                // Collect all available slots from selected days
                const slotsSet = new Set<string>();
                
                for (const day of form.selectedDays) {
                  const daySchedule = selectedMentor.availability?.find((a) => a.day === day);
                  if (daySchedule?.slots) {
                    daySchedule.slots.forEach((s) => {
                      const slotTime = `${s.startTime}-${s.endTime}`;
                      // Include if not booked OR if it's the current course's slot
                      if (!s.isBooked || slotTime === currentCourseSlot) {
                        slotsSet.add(slotTime);
                      }
                    });
                  }
                }
                
                availableSlots = Array.from(slotsSet).sort();
              } else {
                // Fallback to predefined TIME_SLOTS if no mentor selected or no days selected
                availableSlots = TIME_SLOTS;
              }

              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slot {selectedMentor && form.selectedDays.length > 0 && <span className="text-xs text-gray-500">(Available slots for selected days)</span>}
                  </label>
                  <select 
                    value={form.timeSlot} 
                    onChange={e => setForm({ ...form, timeSlot: e.target.value })} 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    disabled={creating}
                  >
                    <option value="">Select Time Slot</option>
                    {availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                  {selectedMentor && form.selectedDays.length > 0 && availableSlots.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No available slots for selected days</p>
                  )}
                </div>
              );
            })()}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required disabled={creating} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required disabled={creating} />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button type="submit" disabled={creating || !form.mentorId || (mentors.matches?.find(m => m._id === form.mentorId)?.hasConflict)} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all font-bold flex items-center justify-center gap-2">
                {creating ? <Loader size="sm" color="text-white" text="Saving..." /> : (course ? "Update Course" : "Create Course")}
              </button>
              <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors" disabled={creating}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

