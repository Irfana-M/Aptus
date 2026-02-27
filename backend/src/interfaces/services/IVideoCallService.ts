import type { JoinCallRequestDto, CallEndedDto } from "@/dtos/webrtcDTO";

export interface IVideoCallService {
  initializeCall(trialClassId: string, userId: string, userRole: 'mentor' | 'student'): Promise<{ success: boolean; meetLink?: string | undefined}>;
  joinCall(data: JoinCallRequestDto): Promise<{ success: boolean; error?: string }>;
  endCall(data: CallEndedDto): Promise<{ success: boolean }>;
  getCallStatus(trialClassId: string): Promise<{ status: string; participants: unknown[]; meetLink?: string }>;
}