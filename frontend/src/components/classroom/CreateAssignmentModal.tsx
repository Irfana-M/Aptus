import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { createAssignment } from '../../api/classroomApi';
import type { Course } from '../../types/courseTypes';
import { toast } from 'react-hot-toast';
import api from '../../api/api';

interface CreateAssignmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

import type { Student, CourseGroup } from '../../types/classroom.types';

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupKey, setSelectedGroupKey] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch mentor's courses
        const enrollmentsRes = await api.get('/mentor/me/courses');
        const courses: Course[] = enrollmentsRes.data.data || enrollmentsRes.data || [];
        
        const groupsMap = new Map<string, CourseGroup>();

        courses.forEach(course => {
          // Robustness check for essential fields
          if (!course.subject || !course.grade) return;
          
          // Legacy/Fallback handling if grade is just a string ID (though type says object)
          // The type definition says grade: { _id, name, syllabus }, so we trust it but add checks
          const subjectId = typeof course.subject === 'object' ? course.subject._id : course.subject as string;
          const subjectName = typeof course.subject === 'object' ? course.subject.subjectName : 'Unknown Subject';
          
          const gradeId = typeof course.grade === 'object' ? course.grade._id : course.grade as string;
          const gradeName = typeof course.grade === 'object' ? course.grade.name : 'Unknown Grade';
          const syllabus = typeof course.grade === 'object' ? course.grade.syllabus : '';

          const key = `${subjectId}_${gradeId}`;

          if (!groupsMap.has(key)) {
            groupsMap.set(key, {
              key,
              subjectId,
              subjectName,
              gradeId,
              gradeName,
              syllabus,
              students: []
            });
          }

          const group = groupsMap.get(key)!;

          // Collect students from this course
          const studentsToAdd: Student[] = [];

          // 1-to-1 Course
          if (course.student) {
             const s = course.student;
             studentsToAdd.push({
               _id: s._id,
               fullName: s.fullName,
               email: s.email || ''
             });
          }

          // Group Course
          if (course.enrolledStudentsList && course.enrolledStudentsList.length > 0) {
             course.enrolledStudentsList.forEach(s => {
               studentsToAdd.push({
                 _id: s._id,
                 fullName: s.fullName,
                 email: s.email || ''
               });
             });
          }

          // Add unique students to group
          studentsToAdd.forEach(s => {
            if (!group.students.some(existing => existing._id === s._id)) {
              group.students.push(s);
            }
          });
        });

        const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => 
          a.subjectName.localeCompare(b.subjectName) || a.gradeName.localeCompare(b.gradeName)
        );

        setCourseGroups(sortedGroups);

      } catch (error) {
        console.error('Failed to load courses', error);
        toast.error('Failed to load courses');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroupKey = e.target.value;
    setSelectedGroupKey(newGroupKey);
    // Clear selected students when group changes to avoid mixing students from different groups
    setSelectedStudents([]);
  };

  const getStudentsForSelectedGroup = () => {
    const group = courseGroups.find(g => g.key === selectedGroupKey);
    return group ? group.students : [];
  };

  const displayedStudents = getStudentsForSelectedGroup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find the subjectId from the selected group
    const group = courseGroups.find(g => g.key === selectedGroupKey);
    
    if (!title || !description || !group || !dueDate || selectedStudents.length === 0 || !file) {
      toast.error('Please fill in all fields and select at least one student');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('subjectId', group.subjectId); // Send the actual Subject ID
      formData.append('dueDate', dueDate);
      formData.append('assignedTo', JSON.stringify(selectedStudents));
      formData.append('allowLateSubmission', String(allowLateSubmission));
      formData.append('file', file);

      await createAssignment(formData);
      toast.success('Assignment created successfully!');
      onSuccess();
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'response' in error 
        ? ((error as { response: { data: { message: string } } }).response?.data?.message || 'Failed to create assignment')
        : (error instanceof Error ? error.message : 'Failed to create assignment');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === displayedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(displayedStudents.map(s => s._id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
          <h2 className="text-xl font-black text-slate-900">Create Assignment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Assignment Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Chapter 5 Practice Problems"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Instructions</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the assignment, expectations, and grading criteria..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
            />
          </div>

          {/* Subject/Class & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Class / Subject</label>
              <select
                value={selectedGroupKey}
                onChange={handleGroupChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                disabled={loadingData}
              >
                <option value="">Select Class</option>
                {courseGroups.map(group => (
                  <option key={group.key} value={group.key}>
                    {group.subjectName} - {group.gradeName} {group.syllabus ? `(${group.syllabus})` : ''}
                  </option>
                ))}
              </select>
              {courseGroups.length === 0 && !loadingData && (
                <p className="text-xs text-amber-600 mt-1">No active courses found.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Due Date & Time</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Students */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700">Assign To</label>
              <button
                type="button"
                onClick={selectAllStudents}
                disabled={!selectedGroupKey}
                className="text-xs text-indigo-600 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {displayedStudents.length > 0 && selectedStudents.length === displayedStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {loadingData ? (
              <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
            ) : !selectedGroupKey ? (
               <div className="h-20 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-medium">Select a class to view students</p>
               </div>
            ) : displayedStudents.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 bg-slate-50 rounded-xl">
                {displayedStudents.map(student => (
                  <label
                    key={student._id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedStudents.includes(student._id) ? 'bg-indigo-100' : 'hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => toggleStudent(student._id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{student.fullName}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm p-3 bg-slate-50 rounded-xl">No students found in this class</p>
            )}
            
             {/* Selected Count Indicator */}
             {selectedGroupKey && (
                 <p className="text-xs text-slate-400 mt-2 text-right">
                     {selectedStudents.length} of {displayedStudents.length} students selected
                 </p>
             )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Assignment File</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                file ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <input
                type="file"
                onChange={e => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
                className="hidden"
                id="assignment-file"
              />
              <label htmlFor="assignment-file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-3 text-indigo-600">
                    <FileText size={24} />
                    <span className="font-bold">{file.name}</span>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Upload size={32} className="mx-auto mb-2" />
                    <p className="font-bold">Click to upload or drag and drop</p>
                    <p className="text-xs mt-1">PDF, DOC, DOCX, PPT, PPTX, JPG, PNG</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Allow Late Submission */}
          <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={allowLateSubmission}
              onChange={e => setAllowLateSubmission(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
            />
            <span className="text-sm font-bold text-slate-700">Allow late submissions</span>
          </label>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Assignment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
