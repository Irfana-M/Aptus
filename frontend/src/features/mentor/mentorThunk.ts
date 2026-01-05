import { createAsyncThunk } from "@reduxjs/toolkit";
import { mentorApi } from "./mentorApi";
import type { MentorProfile } from "./mentorSlice";
import type { RootState } from "../../app/store";
import type { TrialClass } from "../../types/studentTypes";

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
  TrialClass[],
  void,
  { state: RootState }
>("mentor/fetchTrialClasses", async () => {
  const data = await mentorApi.getMentorTrialClasses();
  return data;
});

export const updateTrialClassStatus = createAsyncThunk<
  TrialClass,
  { id: string; status: string },
  { state: RootState }
>("mentor/updateTrialClassStatus", async ({ id, status }, { dispatch }) => {
  const data = await mentorApi.updateTrialClassStatus(id, status);
  dispatch(fetchMentorTrialClasses()); // Refresh list
  return data;
});

export const fetchMentorCourses = createAsyncThunk<
  any[], // Using any[] for now, will refine if needed
  void,
  { state: RootState }
>("mentor/fetchCourses", async () => {
  const data = await mentorApi.getMentorCourses();
  return data;
});
