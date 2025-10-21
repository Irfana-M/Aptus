import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MentorProfile } from "../mentor/mentorSlice";
import { adminLoginThunk, fetchMentorProfileAdmin, approveMentorAdmin, rejectMentorAdmin } from "./adminThunk";

interface Admin {
  _id: string;
  email: string;
}

interface AdminState {
  // login info
  admin: Admin | null;
  accessToken: string | null;
  refreshToken: string | null;

  // mentor approval info
  mentorProfile: MentorProfile | null;

  // loading & error
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  admin: null,
  accessToken: null,
  refreshToken: null,
  mentorProfile: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    logoutAdmin(state) {
      state.admin = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.mentorProfile = null;
      state.error = null;
    },
    clearMentorProfile(state) {
      state.mentorProfile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        adminLoginThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            admin: Admin;
            accessToken: string;
            refreshToken: string;
          }>
        ) => {
          state.loading = false;
          state.admin = action.payload.admin;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
        }
      )
      .addCase(adminLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchMentorProfileAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMentorProfileAdmin.fulfilled, (state, action: PayloadAction<MentorProfile>) => {
        state.loading = false;
        state.mentorProfile = action.payload;
      })
      .addCase(fetchMentorProfileAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

   
    builder
      .addCase(approveMentorAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveMentorAdmin.fulfilled, (state) => {
        if (state.mentorProfile) state.mentorProfile.approvalStatus = "approved";
        state.loading = false;
        
      })
      .addCase(approveMentorAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ===== Reject mentor =====
    builder
      .addCase(rejectMentorAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectMentorAdmin.fulfilled, (state) => {
        if (state.mentorProfile) state.mentorProfile.approvalStatus = "rejected";
        state.loading = false;
      })
      .addCase(rejectMentorAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logoutAdmin, clearMentorProfile } = adminSlice.actions;
export default adminSlice.reducer;
