import api from '../../api/api';
import { API_ROUTES } from '../../constants/apiRoutes';

export const videoCallApi = {
 
  initializeCall: async (trialClassId: string, userId: string, userRole: 'mentor' | 'student') => {
    const response = await api.post(API_ROUTES.VIDEO_CALL.INITIALIZE, {
      trialClassId,
      userId,
      userRole,
    });
    return response.data;
  },

  
  getCallStatus: async (trialClassId: string) => {
    const response = await api.get(API_ROUTES.VIDEO_CALL.STATUS.replace(":trialClassId", trialClassId));
    return response.data;
  },

  endCall: async (trialClassId: string, userId: string) => {
    const response = await api.post(API_ROUTES.VIDEO_CALL.END, {
      trialClassId,
      userId,
    });
    return response.data;
  },
};
