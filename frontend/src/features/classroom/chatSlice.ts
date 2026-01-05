import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { chatApi, type ChatMessage } from '@/api/chatApi';

export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  activeSessionId: string | null;
}

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
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch history');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ sessionId, content }: { sessionId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await chatApi.sendMessage(sessionId, content);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      // Avoid duplicates
      if (!state.messages.some(m => m._id === action.payload._id)) {
        state.messages.push(action.payload);
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
        // We'll trust the socket event for adding the message to the list usually,
        // but adding it here optimistically or as a fallback is also fine.
        // However, to avoid double messages, we check in addMessage reducer.
        if (!state.messages.some(m => m._id === action.payload._id)) {
          state.messages.push(action.payload);
        }
      });
  }
});

export const { addMessage, setActiveSession, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
