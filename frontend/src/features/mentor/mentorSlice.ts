import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  submitProfileForApproval,
  fetchMentorProfile,
  approveMentor,
  rejectMentor,
  updateMentorProfile,
  fetchMentorTrialClasses,
  fetchMentorCourses,
  fetchMentorAssignments,
  fetchMentorDashboardData,
} from "./mentorThunk";
import type { 
  MentorProfile, 
  MentorState 
} from "./types";

const initialState: MentorState = {
  profile: null,
  pendingMentors: [],
  trialClasses: [],
  courses: [],
  loading: false,
  trialClassesError: null,
  assignments: [],
  assignmentsLoading: false,
  assignmentsError: null,
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
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
      state.trialClassesError = null;
      state.assignments = [];
      state.assignmentsLoading = false;
      state.assignmentsError = null;
      state.dashboardData = null;
      state.dashboardLoading = false;
      state.dashboardError = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentorProfile.pending, (state) => {
        state.loading = true;
        state.trialClassesError = null; // Use general error for profile fetch
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
        state.trialClassesError = action.error.message || "Failed to fetch mentor profile"; // Use general error for profile fetch
      });

    builder
      .addCase(updateMentorProfile.pending, (state) => {
        state.loading = true;
        state.trialClassesError = null; // Use general error for profile update
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
        state.trialClassesError = action.error.message || "Failed to update mentor profile"; // Use general error for profile update
      });

    builder
      .addCase(submitProfileForApproval.pending, (state) => {
        state.loading = true;
        state.trialClassesError = null; // Use general error for profile submission
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
        state.trialClassesError =
          action.error.message || "Failed to submit profile for approval"; // Use general error for profile submission
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
        state.trialClassesError = action.error.message || "Failed to approve mentor"; // Use general error for approval
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
        state.trialClassesError = action.error.message || "Failed to reject mentor"; // Use general error for rejection
      });

    builder
      .addCase(fetchMentorTrialClasses.pending, (state) => {
        state.loading = true;
        state.trialClassesError = null;
      })
      .addCase(fetchMentorTrialClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.trialClasses = action.payload || [];
      })
      .addCase(fetchMentorTrialClasses.rejected, (state, action) => {
        state.loading = false; // Keep general loading for trial classes
        state.trialClassesError = action.error.message || "Failed to fetch trial classes";
      });

    // Assignments
    builder
      .addCase(fetchMentorAssignments.pending, (state) => {
        state.assignmentsLoading = true;
        state.assignmentsError = null;
      })
      .addCase(fetchMentorAssignments.fulfilled, (state, action) => {
        state.assignmentsLoading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchMentorAssignments.rejected, (state, action) => {
        state.assignmentsLoading = false;
        state.assignmentsError = (action.payload as string) || action.error.message || 'Failed to fetch assignments';
      });

    builder
      .addCase(fetchMentorCourses.pending, (state) => {
        state.loading = true;
        state.trialClassesError = null; // Use general error for courses
      })
      .addCase(fetchMentorCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload || [];
      })
      .addCase(fetchMentorCourses.rejected, (state, action) => {
        state.loading = false;
        state.trialClassesError = action.error.message || "Failed to fetch courses";
      });

    // Dashboard Data
    builder
      .addCase(fetchMentorDashboardData.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(fetchMentorDashboardData.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardData = action.payload;
      })
      .addCase(fetchMentorDashboardData.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = (action.payload as string) || action.error.message || 'Failed to fetch dashboard data';
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
        state.trialClassesError = null;
        state.assignments = [];
        state.assignmentsLoading = false;
        state.assignmentsError = null;
        state.dashboardData = null;
        state.dashboardLoading = false;
        state.dashboardError = null;
      }
    );
  },
});

export default mentorSlice.reducer;
