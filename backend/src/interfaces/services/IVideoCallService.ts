import type { JoinCallRequestDto, CallEndedDto } from "../../dtos/webrtcDTO.js";

export interface IVideoCallService {
  initializeCall(sessionId: string, userId: string, userRole: 'mentor' | 'student'): Promise<{ success: boolean; meetLink?: string | undefined}>;
  joinCall(data: JoinCallRequestDto): Promise<{ success: boolean; callMode?: "one-to-one" | "group"; error?: string }>;
  endCall(data: CallEndedDto): Promise<{ success: boolean }>;
  getCallStatus(sessionId: string): Promise<{ status: string; participants: unknown[]; meetLink?: string }>;
}