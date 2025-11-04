import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MentorProfile } from "../mentor/mentorSlice";
import {
  adminLoginThunk,
  fetchMentorProfileAdmin,
  approveMentorAdmin,
  rejectMentorAdmin,
  fetchAllMentorsAdmin,
  fetchAllStudentsAdmin,
  refreshAdminToken,
} from "./adminThunk";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import type { StudentBaseResponseDto } from "../../types/studentTypes";

interface Admin {
  role: "admin";
  _id: string;
  email: string;
}

interface AdminState {
  admin: Admin | null;
  accessToken: string | null;
  refreshToken: string | null;
  mentorProfile: MentorProfile | null;
  loading: boolean;
  error: string | null;
  mentorsList: MentorProfile[];
  studentsList: StudentBaseResponseDto[];
  selectedStudent: StudentBaseResponseDto | null;
}

const initialState: AdminState = {
  admin: null,
  accessToken: null,
  refreshToken: null,
  mentorProfile: null,
  mentorsList: [],
  studentsList: [],
  selectedStudent: null,
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
      state.mentorsList = [];
      state.studentsList = [];
      state.selectedStudent = null;
      state.error = null;
    },
    clearMentorProfile(state) {
      state.mentorProfile = null;
      state.error = null;
    },
    setSelectedStudent(
      state,
      action: PayloadAction<StudentBaseResponseDto | null>
    ) {
      state.selectedStudent = action.payload;
    },
    clearStudentsList(state) {
      state.studentsList = [];
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshAdminToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        refreshAdminToken.fulfilled,
        (state, action: PayloadAction<AdminLoginResponse>) => {
          state.loading = false;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          if (action.payload.admin) {
            state.admin = { ...action.payload.admin, role: "admin" };
          }
        }
      )
      .addCase(refreshAdminToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.accessToken = null;
        state.refreshToken = null;
      });
    builder
      .addCase(adminLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        adminLoginThunk.fulfilled,
        (state, action: PayloadAction<AdminLoginResponse>) => {
          state.loading = false;
          state.admin = { ...action.payload.admin, role: "admin" };
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
        }
      )
      .addCase(adminLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchMentorProfileAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMentorProfileAdmin.fulfilled,
        (state, action: PayloadAction<MentorProfile>) => {
          state.loading = false;
          state.mentorProfile = action.payload;
        }
      )
      .addCase(fetchMentorProfileAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchAllMentorsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllMentorsAdmin.fulfilled,
        (state, action: PayloadAction<MentorProfile[]>) => {
          state.loading = false;
          state.mentorsList = action.payload;
        }
      )
      .addCase(fetchAllMentorsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchAllStudentsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllStudentsAdmin.fulfilled,
        (state, action: PayloadAction<StudentBaseResponseDto[]>) => {
          state.loading = false;
          state.studentsList = action.payload;
        }
      )
      .addCase(fetchAllStudentsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(approveMentorAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveMentorAdmin.fulfilled, (state) => {
        if (state.mentorProfile)
          state.mentorProfile.approvalStatus = "approved";
        state.loading = false;
      })
      .addCase(approveMentorAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(rejectMentorAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectMentorAdmin.fulfilled, (state) => {
        if (state.mentorProfile)
          state.mentorProfile.approvalStatus = "rejected";
        state.loading = false;
      })
      .addCase(rejectMentorAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  logoutAdmin,
  clearMentorProfile,
  setSelectedStudent,
  clearStudentsList,
  clearError,
} = adminSlice.actions;
export default adminSlice.reducer;
