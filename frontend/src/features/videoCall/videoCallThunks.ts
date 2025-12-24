import { createAsyncThunk } from '@reduxjs/toolkit';
import { videoCallApi } from './videoCallApi';
import type { RootState } from '../../app/store';

interface JoinCallPayload {
  trialClassId: string;
  userId: string;
  userType: 'student' | 'mentor';
}

interface EndCallPayload {
  trialClassId: string;
  userId: string;
}

/**
 * Initialize a video call
 */
export const initializeVideoCall = createAsyncThunk<
  { roomId: string; token: string; [key: string]: unknown },
  JoinCallPayload,
  { state: RootState }
>(
  'videoCall/initialize',
  async (payload) => {
    const response = await videoCallApi.initializeCall(
      payload.trialClassId,
      payload.userId,
      payload.userType
    );
    return response;
  }
);

/**
 * Fetch call status
 */
export const fetchCallStatus = createAsyncThunk<
  { status: 'active' | 'ended' | 'scheduled'; [key: string]: unknown },
  string,
  { state: RootState }
>(
  'videoCall/fetchStatus',
  async (trialClassId) => {
    const response = await videoCallApi.getCallStatus(trialClassId);
    return response;
  }
);

/**
 * End a video call
 */
export const endVideoCall = createAsyncThunk<
  { success: boolean; [key: string]: unknown },
  EndCallPayload,
  { state: RootState }
>(
  'videoCall/end',
  async (payload) => {
    const response = await videoCallApi.endCall(
      payload.trialClassId,
      payload.userId
    );
    return response;
  }
);
