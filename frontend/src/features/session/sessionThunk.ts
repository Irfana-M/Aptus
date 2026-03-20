import { createAsyncThunk } from '@reduxjs/toolkit';
import { sessionApi } from './sessionApi';
import { toast } from 'react-hot-toast';

export const fetchStudentUpcomingSessions = createAsyncThunk(
  'session/fetchStudentUpcoming',
  async (filter: { from?: string; to?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await sessionApi.fetchStudentUpcomingSessions(filter);
      return response.data; // { items: Session[], total: number }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sessions');
    }
  }
);

export const fetchMentorUpcomingSessions = createAsyncThunk(
  'session/fetchMentorUpcoming',
  async (filter: { from?: string; to?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await sessionApi.fetchMentorUpcomingSessions(filter);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sessions');
    }
  }
);

export const reportAbsence = createAsyncThunk(
  'session/reportAbsence',
  async ({ sessionId, reason }: { sessionId: string; reason: string }, { rejectWithValue }) => {
    try {
      await sessionApi.reportAbsence(sessionId, reason);
      toast.success('Absence reported successfully');
      return { sessionId };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to report absence');
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const cancelSession = createAsyncThunk(
  'session/cancel',
  async ({ sessionId, reason }: { sessionId: string; reason: string }, { rejectWithValue }) => {
    try {
      await sessionApi.cancelSession(sessionId, reason);
      toast.success('Session cancelled successfully');
      return { sessionId };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel session');
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const resolveRescheduling = createAsyncThunk(
  'session/resolveRescheduling',
  async ({ sessionId, newTimeSlotId, slotDetails }: { sessionId: string; newTimeSlotId?: string; slotDetails?: any }, { rejectWithValue }) => {
    try {
      await sessionApi.resolveRescheduling(sessionId, newTimeSlotId, slotDetails);
      toast.success('Session rescheduled successfully');
      return { sessionId };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reschedule');
      return rejectWithValue(error.response?.data?.message);
    }
  }
);
export const fetchSessionById = createAsyncThunk(
  'session/fetchById',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await sessionApi.getSessionById(sessionId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch session');
    }
  }
);
