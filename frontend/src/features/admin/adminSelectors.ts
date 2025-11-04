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

    return {
      total,
      verified,
      paid,
      blocked,
      profileComplete,
    };
  }
);

export const selectStudentById = createSelector(
  [selectAllStudents, (_state: RootState, studentId: string) => studentId],
  (students, studentId) => students.find((student) => student.id === studentId)
);

export const selectFilteredStudents = createSelector(
  [selectAllStudents, (_state: RootState, searchTerm: string) => searchTerm],
  (students, searchTerm) => {
    if (!searchTerm) return students;

    const searchLower = searchTerm.toLowerCase();
    return students.filter(
      (student) =>
        student.fullName?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.id?.toString().includes(searchTerm) ||
        student.phoneNumber?.includes(searchTerm)
    );
  }
);
