import { createSlice } from "@reduxjs/toolkit";
import { fetchStudentProfile, updateStudentProfile, fetchAvailableCourses, submitCourseRequest } from "./studentThunk";

interface StudentState {
  profile: any | null;
  courses: any[];
  courseRequestStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  loading: boolean;
  error: string | null;
}

const initialState: StudentState = {
  profile: null,
  courses: [],
  courseRequestStatus: 'idle',
  loading: false,
  error: null,
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCourseRequestStatus: (state) => {
      state.courseRequestStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder.addCase(fetchStudentProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStudentProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload;
    });
    builder.addCase(fetchStudentProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Profile
    builder.addCase(updateStudentProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateStudentProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload;
    });
    builder.addCase(updateStudentProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Available Courses
    builder.addCase(fetchAvailableCourses.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAvailableCourses.fulfilled, (state, action) => {
      state.loading = false;
      state.courses = action.payload;
    });
    builder.addCase(fetchAvailableCourses.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Submit Course Request
    builder.addCase(submitCourseRequest.pending, (state) => {
      state.courseRequestStatus = 'loading';
      state.error = null;
    });
    builder.addCase(submitCourseRequest.fulfilled, (state) => {
      state.courseRequestStatus = 'succeeded';
    });
    builder.addCase(submitCourseRequest.rejected, (state, action) => {
      state.courseRequestStatus = 'failed';
      state.error = action.payload as string;
    });
  },
});

export const { clearError, resetCourseRequestStatus } = studentSlice.actions;
export default studentSlice.reducer;
