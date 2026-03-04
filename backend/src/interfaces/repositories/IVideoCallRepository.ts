import type { IVideoCallDocument } from "@/interfaces/models/videoCall.interface.js";

export interface IVideoCallRepository {
  create(videoCallData: Partial<IVideoCallDocument>): Promise<IVideoCallDocument>;
  findById(id: string): Promise<IVideoCallDocument | null>;
  findByTrialClassId(trialClassId: string): Promise<IVideoCallDocument | null>;
  updateCallStatus(
    trialClassId: string, 
    status: 'active' | 'completed' | 'cancelled' | 'failed',
    updates?: Partial<IVideoCallDocument>
  ): Promise<IVideoCallDocument | null>;
  addParticipant(
    trialClassId: string,
    participant: {
      userId: string;
      userType: 'student' | 'mentor' | 'admin';
      socketId?: string | undefined;
    }
  ): Promise<IVideoCallDocument | null>;
  removeParticipant(
    trialClassId: string,
    userId: string
  ): Promise<IVideoCallDocument | null>;
  updateCallDuration(
    trialClassId: string,
    duration: number
  ): Promise<IVideoCallDocument | null>;
  isUserInCall(trialClassId: string, userId: string): Promise<boolean>;
}