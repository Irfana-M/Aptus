import { createAsyncThunk } from "@reduxjs/toolkit";
import { mentorApi } from "./mentorApi";
import type { MentorProfile } from "./mentorSlice";
import type { RootState } from "../../app/store";

// ✅ Update mentor profile
export const updateMentorProfile = createAsyncThunk<
  MentorProfile,
  FormData,
  { state: RootState }
>("mentor/updateProfile", async (formData) => {
  const data = await mentorApi.updateMentorProfile(formData);
  return data;
});

// ✅ Submit profile for approval
export const submitProfileForApproval = createAsyncThunk<
  MentorProfile,
  void,
  { state: RootState }
>("mentor/submitProfileForApproval", async () => {
  const data = await mentorApi.submitProfileForApproval();
  return data;
});

// ✅ Get mentor profile
export const fetchMentorProfile = createAsyncThunk<
  MentorProfile,
  void,
  { state: RootState }
>("mentor/fetchProfile", async () => {
  const data = await mentorApi.getMentorProfile();
  return data;
});

// ✅ Admin approve mentor
export const approveMentor = createAsyncThunk<
  { message: string },
  string,
  { state: RootState }
>("mentor/approveMentor", async (mentorId: string) => {
  const data = await mentorApi.approveMentor(mentorId);
  return data;
});

// ✅ Admin reject mentor
export const rejectMentor = createAsyncThunk<
  { message: string },
  { mentorId: string; reason: string },
  { state: RootState }
>("mentor/rejectMentor", async ({ mentorId, reason }) => {
  const data = await mentorApi.rejectMentor(mentorId, reason);
  return data;
});
