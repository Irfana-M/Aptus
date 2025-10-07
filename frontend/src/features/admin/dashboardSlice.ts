// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// interface DashboardState {
//   totalStudents: number;
//   totalMentors: number;
//   recentStudents: any[];
//   recentMentors: any[];
//   loading: boolean;
//   error?: string | null;
// }

// const initialState: DashboardState = {
//   totalStudents: 0,
//   totalMentors: 0,
//   recentStudents: [],
//   recentMentors: [],
//   loading: false,
//   error: null,
// };

// export const fetchDashboardData = createAsyncThunk(
//   "dashboard/fetchDashboardData",
//   async (_, { rejectWithValue }) => {
//     try {
//       const { data } = await axios.get(
//         `${import.meta.env.VITE_API_BASE_URL}/admin/dashboard`
//       );
//       // ✅ Unwrap nested `data`
//       return data.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard data");
//     }
//   }
// );

// const dashboardSlice = createSlice({
//   name: "dashboard",
//   initialState,
//   reducers: {},
//   extraReducers: builder => {
//     builder
//       .addCase(fetchDashboardData.pending, state => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchDashboardData.fulfilled, (state, action) => {
//         state.loading = false;
//         // ✅ directly update the values
//         state.totalStudents = action.payload.totalStudents;
//         state.totalMentors = action.payload.totalMentors;
//         state.recentStudents = action.payload.recentStudents;
//         state.recentMentors = action.payload.recentMentors;
//       })
//       .addCase(fetchDashboardData.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       });
//   },
// });

// export default dashboardSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import api from '../../api/api';

export interface Stat {
  id: string;
  name: string;
  role: 'student' | 'mentor';
}

export interface DashboardState {
  totalStudents: number;
  totalMentors: number;
  recentStudents: any[];
  recentMentors: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
 totalStudents: 0,
  totalMentors: 0,
  recentStudents: [],
  recentMentors: [],
  loading: false,
  error: null,
};

// Fetch dashboard data (students + mentors)
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/admin/dashboard');
      console.log(response.data);
      // Assuming backend returns { success: true, data: [...] }
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchDashboardData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.totalStudents = action.payload.totalStudents;
        state.totalMentors = action.payload.totalMentors;
        state.recentStudents = action.payload.recentStudents;
        state.recentMentors = action.payload.recentMentors; 
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const selectDashboard = (state: RootState) => state.dashboard;

export default dashboardSlice.reducer;

