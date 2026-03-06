import { createAsyncThunk } from "@reduxjs/toolkit";
import * as studentApi from "./studentApi";
import { getErrorMessage } from "../../utils/errorUtils";



export const fetchStudentProfile = createAsyncThunk(
  "student/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getStudentProfile();
      return response;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  "student/updateProfile",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await studentApi.updateStudentProfile(data);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchAvailableCourses = createAsyncThunk(
  "student/fetchAvailableCourses",
  async (filters: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchAvailableCourses(filters);
      return response.data; // Assuming response.data is the array of courses
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

import type { CourseRequestData } from "../../types/dto/student.dto";

export const submitCourseRequest = createAsyncThunk(
  "student/submitCourseRequest",
  async (data: CourseRequestData, { rejectWithValue }) => {
    try {
      const response = await studentApi.createCourseRequest(data);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchMyEnrollments = createAsyncThunk(
  "student/fetchMyEnrollments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchMyEnrollments();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const requestMentor = createAsyncThunk(
  "student/requestMentor",
  async (data: { subjectId: string; mentorId: string }, { rejectWithValue }) => {
    try {
      const response = await studentApi.requestMentor(data);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchStudentAssignments = createAsyncThunk(
  'student/fetchAssignments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getStudentAssignments();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }
);
