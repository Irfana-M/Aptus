import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface VideoCallState {
  isInCall: boolean;
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  error: string | null;
  loading: boolean;
  currentCallId: string | null;
  remoteUserId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

const initialState: VideoCallState = {
  isInCall: false,
  isConnected: false,
  isMuted: false,
  isVideoOff: false,
  error: null,
  loading: false,
  currentCallId: null,
  remoteUserId: null,
  localStream: null,
  remoteStream: null,
};

const videoCallSlice = createSlice({
  name: 'videoCall',
  initialState,
  reducers: {
    setCallStarted: (state, action: PayloadAction<string>) => {
      state.isInCall = true;
      state.currentCallId = action.payload;
      state.error = null;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setLocalStream: (state, action: PayloadAction<MediaStream | null>) => {
      // Note: MediaStream is not serializable, but we'll handle it carefully
      // In practice, we won't persist this to Redux DevTools
      state.localStream = action.payload as any;
    },
    setRemoteStream: (state, action: PayloadAction<MediaStream | null>) => {
      state.remoteStream = action.payload as any;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleVideo: (state) => {
      state.isVideoOff = !state.isVideoOff;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setRemoteUserId: (state, action: PayloadAction<string>) => {
      state.remoteUserId = action.payload;
    },
    endCall: () => {
      // Reset to initial state but keep streams null
      return { ...initialState };
    },
  },
});

export const {
  setCallStarted,
  setConnected,
  setLocalStream,
  setRemoteStream,
  toggleMute,
  toggleVideo,
  setError,
  clearError,
  setRemoteUserId,
  endCall,
} = videoCallSlice.actions;

export default videoCallSlice.reducer;
