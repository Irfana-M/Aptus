import type { RootState } from "../../app/store";
import { createSelector } from "@reduxjs/toolkit";

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
  [selectAllStudents, (_state: RootState, searchTerm: string) => searchTerm, (_state: RootState, _searchTerm: string, filters: any) => filters],
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

export const selectAvailableMentors = (state: RootState) => {
  const availableMentors = state.admin.availableMentors;
  return Array.isArray(availableMentors) ? availableMentors : [];
};

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