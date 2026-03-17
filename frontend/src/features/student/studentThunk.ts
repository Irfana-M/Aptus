import { createAsyncThunk } from "@reduxjs/toolkit";
import * as studentApi from "./studentApi";
import { getErrorMessage } from "../../utils/errorUtils";



export const fetchStudentProfile = createAsyncThunk(
  "student/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      console.log('📡 [Thunk] Fetching student profile...');
      const response = await studentApi.getStudentProfile();
      console.log('✅ [Thunk] Student profile fetched successfully');
      return response;
    } catch (error: unknown) {
      console.error('❌ [Thunk] Error fetching student profile:', error);
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  "student/updateProfile",
  async (data: FormData, { rejectWithValue }) => {
    try {
      console.log('🚀 [Thunk] Updating student profile...');
      const response = await studentApi.updateStudentProfile(data);
      console.log('✅ [Thunk] Student profile updated successfully');
      return response;
    } catch (error: unknown) {
      console.error('❌ [Thunk] Error updating student profile:', error);
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchAvailableCourses = createAsyncThunk(
  "student/fetchAvailableCourses",
  async (filters: Record<string, unknown>, { rejectWithValue }) => {
    try {
      console.log('📡 [Thunk] Fetching available courses...', filters);
      const response = await studentApi.fetchAvailableCourses(filters);
      console.log(`✅ [Thunk] Received ${response.data.length} available courses`);
      return response.data; // Assuming response.data is the array of courses
    } catch (error: unknown) {
      console.error('❌ [Thunk] Error fetching available courses:', error);
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
      console.log('📡 [Thunk] Fetching my enrollments...');
      const response = await studentApi.fetchMyEnrollments();
      console.log(`✅ [Thunk] Received ${response.data.length} enrollments`);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ [Thunk] Error fetching enrollments:', error);
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
      console.log('📡 [Thunk] Fetching student assignments...');
      const response = await studentApi.getStudentAssignments();
      console.log(`✅ [Thunk] Received ${response.data.length} assignments`);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Thunk] Error fetching assignments:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignments');
    }
  }
);
