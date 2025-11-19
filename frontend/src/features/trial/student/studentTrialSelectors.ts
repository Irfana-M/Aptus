import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';


export const selectStudentTrialState = (state: RootState) => state.studentTrial;

export const selectStudentTrialClasses = (state: RootState) => 
  state.studentTrial.trialClasses;

export const selectCurrentTrialClass = (state: RootState) => 
  state.studentTrial.currentTrialClass;

export const selectStudentTrialLoading = (state: RootState) => 
  state.studentTrial.loading;

export const selectStudentTrialError = (state: RootState) => 
  state.studentTrial.error;

export const selectBookingStatus = (state: RootState) => 
  state.studentTrial.bookingStatus;

export const selectFeedbackStatus = (state: RootState) => 
  state.studentTrial.feedbackStatus;


export const selectTrialClassesByStatus = createSelector(
  [selectStudentTrialClasses, (_state: RootState, status: string) => status],
  (trialClasses, status) => trialClasses.filter(tc => tc.status === status)
);

export const selectUpcomingTrialClasses = createSelector(
  [selectStudentTrialClasses],
  (trialClasses) => trialClasses.filter(tc => 
    tc.status === 'requested' || tc.status === 'assigned'
  )
);

export const selectCompletedTrialClasses = createSelector(
  [selectStudentTrialClasses],
  (trialClasses) => trialClasses.filter(tc => tc.status === 'completed')
);

export const selectHasUpcomingTrialClasses = createSelector(
  [selectUpcomingTrialClasses],
  (upcomingClasses) => upcomingClasses.length > 0
);

export const selectEducationTypes = (state: RootState) => 
  state.studentTrial.educationTypes;

export const selectSelectedEducationType = (state: RootState) => 
  state.studentTrial.selectedEducationType;

export const selectGrades = (state: RootState) => state.studentTrial.grades;
export const selectSubjects = (state: RootState) => state.studentTrial.subjects;
export const selectSelectedGrade = (state: RootState) => state.studentTrial.selectedGrade;
export const selectGradesLoading = (state: RootState) => state.studentTrial.gradesLoading;
export const selectSubjectsLoading = (state: RootState) => state.studentTrial.subjectsLoading;


