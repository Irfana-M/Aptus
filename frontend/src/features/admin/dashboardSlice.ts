import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import adminApi from "../../api/adminApi";

export interface Stat {
  id: string;
  name: string;
  role: "student" | "mentor";
}

export interface DashboardState {
  totalStudents: number;
  totalMentors: number;
  recentStudents: Stat[];
  recentMentors: Stat[];
  finance?: {
    totalRevenue: number;
    monthlyRevenue: { month: string; amount: number }[];
    totalPayments: number;
    revenuePerStudent: { studentId: string; studentName: string; amount: number }[];
  };
  activeSessions: number;
  pendingApprovals: number;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  totalStudents: 0,
  totalMentors: 0,
  recentStudents: [],
  recentMentors: [],
  finance: undefined,
  activeSessions: 0,
  pendingApprovals: 0,
  loading: false,
  error: null,
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async (_, thunkAPI) => {
    try {
      const response = await adminApi.get("/admin/dashboard");
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
        return thunkAPI.rejectWithValue(
          axiosError.response?.data?.message || axiosError.message
        );
      }
      return thunkAPI.rejectWithValue('An unexpected error occurred');
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.totalStudents = action.payload.totalStudents;
        state.totalMentors = action.payload.totalMentors;
        state.recentStudents = action.payload.recentStudents;
        state.recentMentors = action.payload.recentMentors;
        state.finance = action.payload.finance;
        state.activeSessions = action.payload.activeSessions;
        state.pendingApprovals = action.payload.pendingApprovals;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectDashboard = (state: RootState) => state.dashboard;

export default dashboardSlice.reducer;
