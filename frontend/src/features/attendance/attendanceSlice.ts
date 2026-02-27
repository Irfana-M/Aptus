import { createSlice } from "@reduxjs/toolkit";
import type { AttendanceState } from "../../types/attendanceTypes";
import { fetchAttendanceHistory, fetchAllAttendanceAdmin } from "./attendanceThunk";

const initialState: AttendanceState = {
    history: [],
    loading: false,
    error: null,
};

const attendanceSlice = createSlice({
    name: "attendance",
    initialState,
    reducers: {
        clearAttendanceError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAttendanceHistory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchAttendanceHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchAllAttendanceAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllAttendanceAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchAllAttendanceAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
