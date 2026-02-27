import type { RootState } from "../../app/store";
import { createSelector } from "@reduxjs/toolkit";
import type { Course } from "../../types/courseTypes";

export interface Grade {
  _id: string;
  name: string;
  syllabus?: string;
}

export const selectAdmin = (state: RootState) => state.admin.admin;
export const selectAccessToken = (state: RootState) => state.admin.accessToken;
export const selectRefreshToken = (state: RootState) =>
  state.admin.refreshToken;

export const selectAllMentors = (state: RootState) => {
  const mentors = state.admin.mentorsList;
  if (Array.isArray(mentors)) {
    return mentors;
  }
  return [];
};

export const selectMentorProfile = (state: RootState) =>
  state.admin.mentorProfile;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectStudentsLoading = (state: RootState) => state.admin.studentsLoading;
export const selectMentorsLoading = (state: RootState) => state.admin.mentorsLoading;
export const selectMentorProfileLoading = (state: RootState) => state.admin.mentorProfileLoading;
export const selectTrialClassesLoading = (state: RootState) => state.admin.trialClassesLoading;
export const selectTrialClassDetailsLoading = (state: RootState) => state.admin.trialClassDetailsLoading;
export const selectCoursesLoading = (state: RootState) => state.admin.coursesLoading;
export const selectStudentProfileLoading = (state: RootState) => state.admin.studentProfileLoading;
export const selectAdminError = (state: RootState) => state.admin.error;
export const selectAdminSuccess = (state: RootState) => state.admin.success;

export const selectAllStudents = (state: RootState) => {
  const students = state.admin.studentsList;
  if (Array.isArray(students)) {
    return students;
  }
  return [];
};

export const selectSelectedStudent = (state: RootState) =>
  state.admin.selectedStudent;

export const selectStudentStats = createSelector(
  [selectAllStudents],
  (students) => {
    const total = students.length;
    const verified = students.filter((student) => student.isVerified).length;
    const paid = students.filter((student) => student.isPaid).length;
    const blocked = students.filter((student) => student.isBlocked).length;
    const profileComplete = students.filter(
      (student) => student.isProfileComplete
    ).length;
    const totalTrialClasses = students.reduce((sum, student) => 
      sum + (student.totalTrialClasses || 0), 0);
    const pendingTrialClasses = students.reduce((sum, student) => 
      sum + (student.pendingTrialClasses || 0), 0);
    const studentsWithTrialClasses = students.filter(student => 
      (student.totalTrialClasses || 0) > 0).length;

    return {
      total,
      verified,
      paid,
      blocked,
      profileComplete,
      totalTrialClasses,
      pendingTrialClasses,
      studentsWithTrialClasses,
    };
  }
);

export const selectStudentById = createSelector(
  [selectAllStudents, (_state: RootState, studentId: string) => studentId],
  (students, studentId) => students.find((student) => student.id === studentId)
);

export const selectFilteredStudents = createSelector(
  [selectAllStudents, (_state: RootState, searchTerm: string) => searchTerm, (_state: RootState, _searchTerm: string, filters: Record<string, string>) => filters],
  (students, searchTerm, filters = {}) => {
    if (!searchTerm && !filters.status && !filters.verification) return students;

    const searchLower = searchTerm.toLowerCase() || '';
    return students.filter(
      (student) =>{
       const matchesSearch = 
        !searchTerm ||
        student.fullName?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.id?.toString().includes(searchTerm) ||
        student.phoneNumber?.includes(searchTerm);

     
      const matchesStatus = 
        !filters.status || 
        (filters.status === 'active' && !student.isBlocked) ||
        (filters.status === 'blocked' && student.isBlocked);

      
      const matchesVerification = 
        !filters.verification ||
        (filters.verification === 'verified' && student.isVerified) ||
        (filters.verification === 'pending' && !student.isVerified);

        const matchesTrialClasses =
        !filters.trialClasses ||
        (filters.trialClasses === 'with_trial' && (student.totalTrialClasses || 0) > 0) ||
        (filters.trialClasses === 'pending' && (student.pendingTrialClasses || 0) > 0) ||
        (filters.trialClasses === 'none' && (student.totalTrialClasses || 0) === 0);

      return matchesSearch && matchesStatus && matchesVerification && matchesTrialClasses;
    });
  }
);



export const selectMentorAssignmentLoading = (state: RootState) => 
  state.admin.loading;


export const selectMentorAssignmentError = (state: RootState) => 
  state.admin.error;

export const selectAllTrialClasses = (state: RootState) => {
  const trialClasses = state.admin.trialClasses;
  return Array.isArray(trialClasses) ? trialClasses : [];
};

export const selectTrialClassDetails = (state: RootState) => state.admin.trialClassDetails;

export const selectStudentTrialClasses = createSelector(
  [selectAllTrialClasses, (_state: RootState, studentId?: string) => studentId],
  (trialClasses, studentId) => {
    if (!studentId) {
      return []; 
    }
    trialClasses.filter(trialClass => 
      trialClass.student?.id === studentId 
    );
  }
);

export const selectAvailableMentors = createSelector(
  [(state: RootState) => state.admin.availableMentors],
  (availableMentors) => {
    if (availableMentors && 'matches' in availableMentors) {
      return availableMentors.matches || [];
    }
    return Array.isArray(availableMentors) ? availableMentors : [];
  }
);

export const selectAlternateMentors = createSelector(
  [(state: RootState) => state.admin.availableMentors],
  (availableMentors) => {
    if (availableMentors && 'alternates' in availableMentors) {
      return availableMentors.alternates || [];
    }
    return [];
  }
);

// adminSelectors.ts
export const selectAvailableMentorsForCourse = (state: RootState) =>
  state.admin.availableMentorsForCourse;

export const selectCourseCreationLoading = (state: RootState) =>
  state.admin.courseCreationLoading;

export const selectCourseCreationError = (state: RootState) =>
  state.admin.courseCreationError;

export const selectCourseCreationSuccess = (state: RootState) =>
  state.admin.courseCreationSuccess;

// Update these selectors with proper type checking

export const selectAllCourses = createSelector(
  [(state: RootState) => state.admin.coursesList],
  (coursesList) => {
    // Handle undefined/null cases first
    if (coursesList == null) {
      return [];
    }
    
    // If it's already an array, return it
    if (Array.isArray(coursesList)) {
      return coursesList;
    }
    
    // Check if it's an object (not array) and try to access data property
    if (typeof coursesList === 'object' && coursesList !== null) {
      const coursesObj = coursesList as unknown as { data?: Course[] };
      
      if (Array.isArray(coursesObj.data)) {
        return coursesObj.data;
      }
      
      const values = Object.values(coursesObj);
      if (values.length > 0) {
        return Array.isArray(values[0]) ? values[0] : (values as unknown as Course[]);
      }
    }
    
    // Default to empty array
    return [];
  }
);

export const selectGrades = createSelector(
  [(state: RootState) => state.admin.grades],
  (grades) => {
    // Handle undefined/null cases first
    if (grades == null) {
      return [];
    }
    
    // If it's already an array, return it
    if (Array.isArray(grades)) {
      return grades;
    }
    
    // Check if it's an object (not array) and try to access data property
    if (typeof grades === 'object' && grades !== null) {
      const gradesObj = grades as unknown as { data?: Grade[] };
      
      if (Array.isArray(gradesObj.data)) {
        return gradesObj.data;
      }
      
      const values = Object.values(gradesObj);
      if (values.length > 0) {
        return Array.isArray(values[0]) ? values[0] : (values as unknown as Grade[]);
      }
    }
    
    // Default to empty array
    return [];
  }
);
export const selectGradesLoading = (state: RootState) => state.admin.gradesLoading;
// adminSelectors.ts
export const selectSubjectsByGrade = (gradeId: string) => 
  createSelector(
    [(state: RootState) => state.admin.subjects],
    (subjects) => {
      return subjects[gradeId] || [];
    }
  );
export const selectSubjectsLoading = (state: RootState) => state.admin.subjectsLoading;
