import { createAsyncThunk } from "@reduxjs/toolkit";
import * as studentApi from "./studentApi";


export const fetchStudentProfile = createAsyncThunk(
  "student/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await studentApi.getStudentProfile();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch profile");
    }
  }
);

export const updateStudentProfile = createAsyncThunk(
  "student/updateProfile",
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await studentApi.updateStudentProfile(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update profile");
    }
  }
);

export const fetchAvailableCourses = createAsyncThunk(
  "student/fetchAvailableCourses",
  async (filters: any, { rejectWithValue }) => {
    try {
      const response = await studentApi.fetchAvailableCourses(filters);
      return response.data; // Assuming response.data is the array of courses
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch courses");
    }
  }
);

export const submitCourseRequest = createAsyncThunk(
  "student/submitCourseRequest",
  async (data: studentApi.CourseRequestData, { rejectWithValue }) => {
    try {
      const response = await studentApi.createCourseRequest(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit course request");
    }
  }
);
