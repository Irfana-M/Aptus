import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  submitProfileForApproval,
  fetchMentorProfile,
  approveMentor,
  rejectMentor,
  updateMentorProfile,
} from "./mentorThunk";

export interface MentorProfile {
  _id?: string;
  personalDetails: {
    fullName: string;
    email: string;
    phoneNumber: string;
    location: string;
    briefBio: string;
  };
  academicQualifications: {
    degree: string;
    university: string;
    graduationYear: string;
  };
  experienceDetails: {
    yearsOfExperience: string;
    previousInstitutions: string;
  };
  subjectPreferences: {
    subjects: string[];
    preferredGrades: string[];
  };
  certifications: {
    title: string;
    organization: string;
    year: string;
  }[];
  profilePicture?: string; // ✅ newly added field
  isProfileComplete?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
}

interface MentorState {
  profile: MentorProfile | null;
  pendingMentors: MentorProfile[];
  loading: boolean;
  error: string | null;
}

const initialState: MentorState = {
  profile: null,
  pendingMentors: [],
  loading: false,
  error: null,
};

export const mentorSlice = createSlice({
  name: "mentor",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // ✅ Fetch Mentor Profile
    builder
      .addCase(fetchMentorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMentorProfile.fulfilled, (state, action: PayloadAction<MentorProfile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchMentorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch mentor profile";
      });

    // ✅ Update Mentor Profile
    builder
      .addCase(updateMentorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMentorProfile.fulfilled, (state, action: PayloadAction<MentorProfile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateMentorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update mentor profile";
      });

    // ✅ Submit Profile for Approval
    builder
      .addCase(submitProfileForApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitProfileForApproval.fulfilled, (state, action: PayloadAction<MentorProfile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(submitProfileForApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to submit profile for approval";
      });

    // ✅ Admin Approve Mentor
    builder
      .addCase(approveMentor.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveMentor.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(approveMentor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to approve mentor";
      });

    // ✅ Admin Reject Mentor
    builder
      .addCase(rejectMentor.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectMentor.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(rejectMentor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to reject mentor";
      });
  },
});

export default mentorSlice.reducer;
