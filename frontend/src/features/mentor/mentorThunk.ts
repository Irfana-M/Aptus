import { createAsyncThunk } from "@reduxjs/toolkit";
import { mentorApi } from "./mentorApi";
import type { MentorProfile } from "./mentorSlice";
import type { RootState } from "../../app/store";

export const updateMentorProfile = createAsyncThunk<
  MentorProfile,
  FormData,
  { state: RootState }
>("mentor/updateProfile", async (formData) => {
  const data = await mentorApi.updateMentorProfile(formData);
  return data;
});

export const submitProfileForApproval = createAsyncThunk<
  MentorProfile,
  void,
  { state: RootState }
>("mentor/submitProfileForApproval", async () => {
  const data = await mentorApi.submitProfileForApproval();
  return data;
});

export const fetchMentorProfile = createAsyncThunk<
  MentorProfile,
  void,
  { state: RootState }
>("mentor/fetchProfile", async () => {
  const data = await mentorApi.getMentorProfile();
  return data;
});

export const approveMentor = createAsyncThunk<
  { message: string },
  string,
  { state: RootState }
>("mentor/approveMentor", async (mentorId: string) => {
  const data = await mentorApi.approveMentor(mentorId);
  return data;
});

export const rejectMentor = createAsyncThunk<
  { message: string },
  { mentorId: string; reason: string },
  { state: RootState }
>("mentor/rejectMentor", async ({ mentorId, reason }) => {
  const data = await mentorApi.rejectMentor(mentorId, reason);
  return data;
});

export const fetchMentorTrialClasses = createAsyncThunk<
  any[],
  void,
  { state: RootState }
>("mentor/fetchTrialClasses", async () => {
  const data = await mentorApi.getMentorTrialClasses();
  return data;
});
