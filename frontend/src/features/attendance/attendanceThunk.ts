import { createAsyncThunk } from "@reduxjs/toolkit";
import { attendanceApi } from "./attendanceApi";

export const fetchAttendanceHistory = createAsyncThunk(
    "attendance/fetchHistory",
    async (_, { rejectWithValue }) => {
        try {
            const response = await attendanceApi.getHistory();
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(response.message || "Failed to fetch history");
        } catch {
            return rejectWithValue("Failed to fetch history");
        }
    }
);

export const markPresent = createAsyncThunk(
    "attendance/markPresent",
    async (sessionId: string, { rejectWithValue, dispatch }) => {
        try {
            const response = await attendanceApi.markPresent(sessionId);
            if (response.success) {
                dispatch(fetchAttendanceHistory());
                return response.data;
            }
            return rejectWithValue(response.message || "Failed to mark present");
        } catch {
            return rejectWithValue("Failed to mark present");
        }
    }
);

export const markAbsent = createAsyncThunk(
    "attendance/markAbsent",
    async ({ sessionId, reason }: { sessionId: string; reason?: string }, { rejectWithValue, dispatch }) => {
        try {
            const response = await attendanceApi.markAbsent(sessionId, reason);
            if (response.success) {
                dispatch(fetchAttendanceHistory());
                return response.data;
            }
            return rejectWithValue(response.message || "Failed to mark absent");
        } catch {
            return rejectWithValue("Failed to mark absent");
        }
    }
);

export const fetchAllAttendanceAdmin = createAsyncThunk(
    "attendance/fetchAllAdmin",
    async (_, { rejectWithValue }) => {
        try {
            const response = await attendanceApi.getAllAttendanceAdmin();
            if (response.success) {
                return response.data;
            }
            return rejectWithValue(response.message || "Failed to fetch admin history");
        } catch {
            return rejectWithValue("Failed to fetch admin history");
        }
    }
);
