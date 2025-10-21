import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi, type AdminLoginDto } from "./adminApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import { adminMentorApi } from "./adminApi";
import type { RootState } from "../../app/store";
import type { MentorProfile } from "../mentor/mentorSlice";

export const adminLoginThunk = createAsyncThunk<
  AdminLoginResponse,
  AdminLoginDto,
  { rejectValue: string }
>("admin/login", async (payload, { rejectWithValue }) => {
  try {
    const response = await adminApi.login(payload);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Login failed");
  }
});


export const fetchMentorProfileAdmin = createAsyncThunk<
  MentorProfile,
  string,
  { state: RootState }
>("admin/fetchMentorProfile", async (mentorId, thunkAPI) => {
  try {
    const { data } = await adminMentorApi.fetchMentorProfile(mentorId);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch mentor");
  }
});


export const approveMentorAdmin = createAsyncThunk<
  { message: string },
  string,
  { state: RootState }
>("admin/approveMentor", async (mentorId, thunkAPI) => {
  try {
    const { data } = await adminMentorApi.approveMentor(mentorId);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to approve mentor");
  }
});



export const rejectMentorAdmin = createAsyncThunk<
  { message: string },
  { mentorId: string; reason: string },
  { state: RootState }
>("admin/rejectMentor", async ({ mentorId, reason }, thunkAPI) => {
  try {
    const { data } = await adminMentorApi.rejectMentor(mentorId, reason);
    return data;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to reject mentor");
  }
});