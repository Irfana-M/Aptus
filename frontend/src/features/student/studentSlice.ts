import { createSlice } from "@reduxjs/toolkit";
import { fetchStudentProfile, updateStudentProfile, fetchAvailableCourses, submitCourseRequest, fetchMyEnrollments, requestMentor } from "./studentThunk";
import type { StudentProfile } from "../../types/student.types";
import type { Course } from "../../types/courseTypes";

export interface Enrollment {
  _id: string;
  student: string; // Renamed from studentId to match backend if needed, but 'course' is more critical
  course: Course; // Populated course
  enrollmentDate: string; // Renamed from enrolledAt to match backend
  status: 'pending_payment' | 'active' | 'cancelled'; // Updated to match backend enum
  progress?: number;
}

interface StudentState {
  profile: StudentProfile | null;
  courses: Course[];
  enrollments: Enrollment[];
  courseRequestStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  loading: boolean;
  error: string | null;
}

const initialState: StudentState = {
  profile: null,
  courses: [],
  enrollments: [],
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

    // Request Mentor
    builder.addCase(requestMentor.pending, (state) => {
      state.courseRequestStatus = 'loading'; // Using same status for simplicity or add specific
      state.error = null;
    });
    builder.addCase(requestMentor.fulfilled, (state) => {
      state.courseRequestStatus = 'succeeded';
      // Ideally update profile locally to reflect 'mentor_requested' status
    });
    builder.addCase(requestMentor.rejected, (state, action) => {
      state.courseRequestStatus = 'failed';
      state.error = action.payload as string;
    });

    // Fetch My Enrollments
    builder.addCase(fetchMyEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
    });
    builder.addCase(fetchMyEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments = action.payload;
    });
    builder.addCase(fetchMyEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
    });
  },
});

export const { clearError, resetCourseRequestStatus } = studentSlice.actions;
export default studentSlice.reducer;
