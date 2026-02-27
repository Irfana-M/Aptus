import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  submitProfileForApproval,
  fetchMentorProfile,
  approveMentor,
  rejectMentor,
  updateMentorProfile,
  fetchMentorTrialClasses,
  fetchMentorCourses,
} from "./mentorThunk";
import type { TrialClass } from "../../types/studentTypes";
import type { Course } from "../../types/courseTypes";

export interface MentorProfile {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  location?: string;
  bio?: string;

  academicQualifications: {
    institutionName: string;
    institution?: string;
    degree: string;
    graduationYear: string;
    year?: string | number;
  }[];
  experiences: {
    institution?: string;
    company?: string;
    jobTitle: string;
    role?: string;
    duration: string;
  }[];
  certification: {
    name: string;
    issuingOrganization: string;
  }[];
  subjectProficiency: {
    subject: string;
    level: "basic" | "intermediate" | "expert";
  }[];
  profilePicture?: string;
  profileImageUrl?: string;
  profileImageKey?: string;
  availability?: {
    day: string;
    slots: {
      startTime: string;
      endTime: string;
    }[];
    timezone?: string;
  }[];
  rating?: number;
  totalRatings?: number;
  expertise?: string[];
  maxStudentsPerWeek?: number;
  currentWeeklyBookings?: number;
  isActive?: boolean;
  isVerified?: boolean;
  isProfileComplete?: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  isBlocked?: boolean;
  createdAt: string;
}

interface MentorState {
  profile: MentorProfile | null;
  pendingMentors: MentorProfile[];
  trialClasses: TrialClass[];
  courses: Course[]; 
  loading: boolean;
  error: string | null;
}

const initialState: MentorState = {
  profile: null,
  pendingMentors: [],
  trialClasses: [],
  courses: [],
  loading: false,
  error: null,
};

export const mentorSlice = createSlice({
  name: "mentor",
  initialState,
  reducers: {
    clearMentorState: (state) => {
      state.profile = null;
      state.pendingMentors = [];
      state.trialClasses = [];
      state.courses = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMentorProfile.fulfilled,
        (state, action: PayloadAction<MentorProfile>) => {
          state.loading = false;
          state.profile = action.payload;
        }
      )
      .addCase(fetchMentorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch mentor profile";
      });

    builder
      .addCase(updateMentorProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateMentorProfile.fulfilled,
        (state, action: PayloadAction<MentorProfile>) => {
          state.loading = false;
          state.profile = action.payload;
        }
      )
      .addCase(updateMentorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update mentor profile";
      });

    builder
      .addCase(submitProfileForApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        submitProfileForApproval.fulfilled,
        (state, action: PayloadAction<MentorProfile>) => {
          state.loading = false;
          state.profile = action.payload;
        }
      )
      .addCase(submitProfileForApproval.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to submit profile for approval";
      });

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

    builder
      .addCase(fetchMentorTrialClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMentorTrialClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.trialClasses = action.payload || [];
      })
      .addCase(fetchMentorTrialClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch trial classes";
      });

    builder
      .addCase(fetchMentorCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMentorCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload || [];
      })
      .addCase(fetchMentorCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch courses";
      });

    // Automatically clear mentor state on auth logout
    builder.addMatcher(
      (action) =>
        action.type === "auth/logout" ||
        action.type === "auth/logoutUser/fulfilled" ||
        action.type === "auth/adminLogin/fulfilled",
      (state) => {
        state.profile = null;
        state.pendingMentors = [];
        state.trialClasses = [];
        state.courses = [];
        state.loading = false;
        state.error = null;
      }
    );
  },
});

export default mentorSlice.reducer;
