import type { RootState } from '../../app/store';
import { createSelector } from '@reduxjs/toolkit';

// Basic selectors
export const selectIsInCall = (state: RootState) => state.videoCall.isInCall;
export const selectIsConnected = (state: RootState) => state.videoCall.isConnected;
export const selectIsMuted = (state: RootState) => state.videoCall.isMuted;
export const selectIsVideoOff = (state: RootState) => state.videoCall.isVideoOff;
export const selectCallError = (state: RootState) => state.videoCall.error;
export const selectCallLoading = (state: RootState) => state.videoCall.loading;
export const selectCurrentCallId = (state: RootState) => state.videoCall.currentCallId;
export const selectRemoteUserId = (state: RootState) => state.videoCall.remoteUserId;
export const selectLocalStream = (state: RootState) => state.videoCall.localStream;
export const selectRemoteStream = (state: RootState) => state.videoCall.remoteStream;

// Computed selectors
export const selectCallStatus = createSelector(
  [selectIsInCall, selectIsConnected],
  (isInCall, isConnected) => {
    if (!isInCall) return 'idle';
    if (isInCall && !isConnected) return 'connecting';
    if (isInCall && isConnected) return 'connected';
    return 'idle';
  }
);

export const selectHasError = createSelector(
  [selectCallError],
  (error) => error !== null
);
