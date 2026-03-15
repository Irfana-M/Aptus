import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { chatApi } from '../../api/chatApi';
import type { ChatMessage } from '../../types/classroom.types';
import type { ChatState } from './types';
import { getErrorMessage } from '../../utils/errorUtils';

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
  activeSessionId: null,
};

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchHistory',
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await chatApi.getHistory(sessionId);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to fetch history');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ sessionId, content }: { sessionId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await chatApi.sendMessage(sessionId, content);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error) || 'Failed to send message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const newMsg = action.payload;

      const exists = state.messages.some(
        (m: ChatMessage) => String(m._id) === String(newMsg._id)
      );

      if (!exists) {
        state.messages.push(newMsg);
      }
    },
    setActiveSession: (state, action: PayloadAction<string | null>) => {
      state.activeSessionId = action.payload;
      if (action.payload === null) {
        state.messages = [];
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const newMsg = action.payload;

        const exists = state.messages.some(
          (m: ChatMessage) => String(m._id) === String(newMsg._id)
        );

        if (!exists) {
          state.messages.push(newMsg);
        }
      });
  }
});

export const { addMessage, setActiveSession, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
