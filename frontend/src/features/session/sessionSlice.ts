import { createSlice } from '@reduxjs/toolkit';
import { fetchStudentUpcomingSessions, fetchMentorUpcomingSessions, reportAbsence, cancelSession, resolveRescheduling } from './sessionThunk';
import type { Session } from '../../types/scheduling.types';

interface SessionState {
  sessions: Session[];
  totalSessions: number;
  loading: boolean;
  error: string | null;
}

const initialState: SessionState = {
  sessions: [],
  totalSessions: 0,
  loading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    clearSessions: (state) => {
      state.sessions = [];
      state.totalSessions = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Student Upcoming
      .addCase(fetchStudentUpcomingSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentUpcomingSessions.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || action.payload;
        state.sessions = payload.items || payload;
        state.totalSessions = payload.total || payload.pagination?.totalItems || 0;
      })
      .addCase(fetchStudentUpcomingSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Mentor Upcoming
      .addCase(fetchMentorUpcomingSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMentorUpcomingSessions.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || action.payload;
        state.sessions = payload.items || payload;
        state.totalSessions = payload.total || payload.pagination?.totalItems || 0;
      })
      .addCase(fetchMentorUpcomingSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Status updates
      .addCase(reportAbsence.fulfilled, (state, action) => {
        const session = state.sessions.find(s => s.id === action.payload.sessionId);
        if (session) {
          session.status = 'cancelled'; // Or specific status
          session.cancelledBy = 'student';
        }
      })
      .addCase(cancelSession.fulfilled, (state, action) => {
        const session = state.sessions.find(s => s.id === action.payload.sessionId);
        if (session) {
          session.status = 'rescheduling';
          session.cancelledBy = 'mentor';
        }
      })
      .addCase(resolveRescheduling.fulfilled, (state, action) => {
        // Typically we'd re-fetch, but we can optimistically update
        state.sessions = state.sessions.filter(s => s.id !== action.payload.sessionId);
      });
  },
});

export const { clearSessions } = sessionSlice.actions;
export default sessionSlice.reducer;
