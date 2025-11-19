import { createAsyncThunk } from "@reduxjs/toolkit";
import { studentTrialApi } from "./studentTrialApi";

import type {
  TrialClassRequest,
  FeedbackRequest,
  TrialClassResponse,
  Grade,
  Subject,
} from "../../../types/trialTypes";

export const requestTrialClass = createAsyncThunk<
  TrialClassResponse,
  TrialClassRequest,
  { rejectValue: string }
>(
  "studentTrial/requestTrialClass",
  async (data: TrialClassRequest, { rejectWithValue }) => {
    try {
      return await studentTrialApi.requestTrialClass(data);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to request trial class"
      );
    }
  }
);

export const fetchStudentTrialClasses = createAsyncThunk<
  TrialClassResponse[],
  void,
  { rejectValue: string }
>("studentTrial/fetchStudentTrialClasses", async (_, { rejectWithValue }) => {
  try {
    return await studentTrialApi.getStudentTrialClasses();
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch trial classes"
    );
  }
});

export const fetchTrialClassById = createAsyncThunk<
  TrialClassResponse,
  string,
  { rejectValue: string }
>(
  "studentTrial/fetchTrialClassById",
  async (trialClassId: string, { rejectWithValue }) => {
    try {
      return await studentTrialApi.getTrialClassById(trialClassId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch trial class"
      );
    }
  }
);

export const submitTrialFeedback = createAsyncThunk<
  TrialClassResponse,
  { trialClassId: string; feedback: FeedbackRequest },
  { rejectValue: string }
>(
  "studentTrial/submitFeedback",
  async (
    {
      trialClassId,
      feedback,
    }: { trialClassId: string; feedback: FeedbackRequest },
    { rejectWithValue }
  ) => {
    try {
      return await studentTrialApi.submitFeedback(trialClassId, feedback);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit feedback"
      );
    }
  }
);

export const cancelTrialClass = createAsyncThunk<
  TrialClassResponse,
  string,
  { rejectValue: string }
>(
  "studentTrial/cancelTrialClass",
  async (trialClassId: string, { rejectWithValue }) => {
    try {
      return await studentTrialApi.cancelTrialClass(trialClassId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel trial class"
      );
    }
  }
);

export const fetchGradeByEducationType = createAsyncThunk<
  Grade[],
  string,
  { rejectValue: string }
>(
  "studentTrial/fetchGradesByEducationType",
  async (educationType: string, { rejectWithValue }) => {
    try {
      return await studentTrialApi.getGradesByEducationType(educationType);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.message || "Failed to fetch grades"
      );
    }
  }
);

export const fetchGrades = createAsyncThunk<
  Grade[],
  void,
  { rejectValue: string }
>("studentTrial/fetchGrades", async (_, { rejectWithValue }) => {
  try {
    return await studentTrialApi.getGrades();
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch grades"
    );
  }
});

export const fetchSubjectsByGrade = createAsyncThunk<
  Subject[],
  string,
  { rejectValue: string }
>(
  "studentTrial/fetchSubjectsByGrade",
  async (gradeId: string, { rejectWithValue }) => {
    try {
      return await studentTrialApi.getSubjectsByGrade(gradeId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch subjects"
      );
    }
  }
);

export const fetchSubjectsByGradeAndSyllabus = createAsyncThunk<
  Subject[], 
  { grade: number; syllabus: string }, 
  { rejectValue: string } 
>(
  'studentTrial/fetchSubjectsByGradeAndSyllabus',
  async ({ grade, syllabus }, { rejectWithValue }) => {
    try {
      return await studentTrialApi.getSubjectsByGradeAndSyllabus(grade, syllabus);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch subjects'
      );
    }
  }
);


export const updateTrialClass = createAsyncThunk<
  TrialClassResponse,
  { trialClassId: string; updates: Partial<TrialClassRequest> },
  { rejectValue: string }
>(
  "studentTrial/updateTrialClass",
  async ({ trialClassId, updates }, { rejectWithValue }) => {
    try {
      return await studentTrialApi.updateTrialClass(trialClassId, updates);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update trial class"
      );
    }
  }
);