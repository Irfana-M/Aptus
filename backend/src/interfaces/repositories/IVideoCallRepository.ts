import type { IVideoCallDocument } from "@/interfaces/models/videoCall.interface.js";

export interface IVideoCallRepository {
  create(videoCallData: Partial<IVideoCallDocument>): Promise<IVideoCallDocument>;
  findById(id: string): Promise<IVideoCallDocument | null>;
  findBySessionId(sessionId: string): Promise<IVideoCallDocument | null>;
  updateCallStatus(
    sessionId: string, 
    status: 'active' | 'completed' | 'cancelled' | 'failed',
    updates?: Partial<IVideoCallDocument>
  ): Promise<IVideoCallDocument | null>;
  addParticipant(
    sessionId: string,
    participant: {
      userId: string;
      userType: 'student' | 'mentor' | 'admin';
      socketId?: string | undefined;
    }
  ): Promise<IVideoCallDocument | null>;
  removeParticipant(
    sessionId: string,
    userId: string
  ): Promise<IVideoCallDocument | null>;
  updateCallDuration(
    sessionId: string,
    duration: number
  ): Promise<IVideoCallDocument | null>;
  isUserInCall(sessionId: string, userId: string): Promise<boolean>;
}