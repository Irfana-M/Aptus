import authApi from '../../api/authApi';

export const videoCallApi = {
 
  initializeCall: async (trialClassId: string, userId: string, userRole: 'mentor' | 'student') => {
    const response = await authApi.post('/video-call/initialize', {
      trialClassId,
      userId,
      userRole,
    });
    return response.data;
  },

  
  getCallStatus: async (trialClassId: string) => {
    const response = await authApi.get(`/video-call/status/${trialClassId}`);
    return response.data;
  },

  endCall: async (trialClassId: string, userId: string) => {
    const response = await authApi.post('/video-call/end', {
      trialClassId,
      userId,
    });
    return response.data;
  },
};
