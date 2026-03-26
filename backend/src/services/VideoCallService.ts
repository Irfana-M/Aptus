import { injectable, inject } from "inversify";
import type { ITrialClassDocument } from "../models/student/trialClass.model.js";
import { TYPES } from "@/types.js";
import type { IVideoCallService } from "@/interfaces/services/IVideoCallService.js";
import type { IVideoCallRepository } from "@/interfaces/repositories/IVideoCallRepository.js";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository.js";
import type {
  JoinCallRequestDto,
  CallEndedDto,
} from "../dtos/webrtcDTO.js";
import { logger } from "@/utils/logger.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { AppError } from "@/utils/AppError.js";
import { Types } from "mongoose";
import type { IUserRoleService } from "@/interfaces/services/IUserRoleSrvice.js";
import type { IAttendanceService } from "@/interfaces/services/IAttendanceService.js";

import { fileLogger } from "@/utils/fileLogger.js";
import type { ISessionRepository } from "@/interfaces/repositories/ISessionRepository.js";

@injectable()
export class VideoCallService implements IVideoCallService {
  constructor(
    @inject(TYPES.IVideoCallRepository)
    private _videoCallRepo: IVideoCallRepository,
    @inject(TYPES.ITrialClassRepository)
    private _trialClassRepo: ITrialClassRepository,
    @inject(TYPES.IUserRoleService) private _userRoleService: IUserRoleService,
    @inject(TYPES.ISessionRepository) private _sessionRepo: ISessionRepository,
    @inject(TYPES.IAttendanceService) private _attendanceService: IAttendanceService
  ) { }


  async initializeCall(
    sessionId: string,
    userId: string,
    userRole: 'mentor' | 'student'
  ): Promise<{ success: boolean; meetLink?: string }> {
    try {
      let trialClass = await this._trialClassRepo.findById(sessionId);
      let isSession = false;

      if (!trialClass) {
        const session = await this._sessionRepo.findById(sessionId);
        if (session) {
          isSession = true;
          trialClass = ({ ...session, meetLink: (session as unknown as { webRTCId?: string }).webRTCId } as unknown as ITrialClassDocument);
        } else {
          throw new AppError("Trial class or Session not found", HttpStatusCode.NOT_FOUND);
        }
      }

      let videoCall = await this._videoCallRepo.findBySessionId(sessionId);

      if (videoCall) {
        return { success: true, meetLink: videoCall.meetLink };
      }

      let meetLink = trialClass.meetLink;

      if (!meetLink) {
        meetLink = this._generateMeetLink(sessionId);

        if (!isSession) {
          await this._trialClassRepo.updateById(sessionId, { meetLink });
        } else {
          logger.info(`ℹ️ Session detected in initializeCall, skipping TrialClass update for ${sessionId}`);
        }
      }

      videoCall = await this._videoCallRepo.create({
        sessionId: new Types.ObjectId(sessionId),
        callStatus: "active",
        meetLink,
        participants: [
          {
            userId: new Types.ObjectId(userId),
            userType: userRole,
            joinedAt: new Date(),
          },
        ],
      });

      logger.info("Video call initialized", {
        sessionId,
        meetLink,
        initializedBy: userId,
        userRole
      });

      return { success: true, meetLink };
    } catch (error: unknown) {
      logger.error("Error initializing call", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to initialize video call",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

async joinCall(
  data: JoinCallRequestDto
): Promise<{ success: boolean; callMode?: "one-to-one" | "group"; error?: string }> {
  try {
    fileLogger(`🎥 JOIN CALL REQUEST - User: ${data.userId}, Type: ${data.userType}, Session: ${data.sessionId}`);
    logger.info(`🎥 JOIN CALL REQUEST - User: ${data.userId}, Type: ${data.userType}, Session: ${data.sessionId}`);

    const userVerification = await this._userRoleService.verifyUserRole(
      data.userId,
      data.userType
    );

    if (!userVerification.success) {
      fileLogger(`❌ User verification failed: ${userVerification.error}`);
      logger.warn(`❌ User verification failed: ${userVerification.error}`);
      return { success: false, error: userVerification.error || "User verification failed" };
    }

    const authCheck = await this._userRoleService.verifyTrialClassAuthorization(
      data.sessionId,
      data.userId,
      data.userType
    );

    if (!authCheck.authorized) {
      logger.warn(`❌ Unauthorized: ${authCheck.error}`);
      return { success: false, error: `Auth failure: ${authCheck.error || "Unauthorized to join this call"}` };
    }

    let videoCall = await this._videoCallRepo.findBySessionId(data.sessionId);

    if (!videoCall) {
      logger.info(`📹 No existing call found - creating new VideoCall for session ${data.sessionId}`);

      let meetLink = (authCheck.trialClass as { meetLink?: string })?.meetLink;
      if (!meetLink || typeof meetLink !== "string" || meetLink.trim() === "") {
        meetLink = this._generateMeetLink(data.sessionId);
        if (!(authCheck as unknown as { isSession?: boolean }).isSession) {
          await this._trialClassRepo.updateById(data.sessionId, { meetLink });
        } else {
          logger.info(`ℹ️ Session detected, skipping TrialClass update for ${data.sessionId}`);
        }
      }

      videoCall = await this._videoCallRepo.create({
        sessionId: new Types.ObjectId(data.sessionId),
        callStatus: "active",
        meetLink,
      });
    }

    if (videoCall.callStatus !== "active") {
      return { success: false, error: `Call is ${videoCall.callStatus}` };
    }

    const participantData = {
      userId: data.userId,
      userType: data.userType,
      socketId: data.socketId,
    };

    await this._videoCallRepo.addParticipant(data.sessionId, participantData);

    try {
      const sessionModel = (authCheck as unknown as { isSession?: boolean }).isSession ? 'Session' : 'TrialClass';
      await this._attendanceService.markPresent(data.sessionId, data.userId, sessionModel);
    } catch (attError) {
      logger.error(`⚠️ Failed to auto-mark attendance: ${attError}`);
    }

    // ADDED: Determine callMode for frontend (using real Session field)
    let callMode: "one-to-one" | "group" = "one-to-one";
    if ((authCheck as any).isSession && (authCheck as any).trialClass?.sessionType === "group") {
      callMode = "group";
    }

    logger.info(`✅ Join successful. CallMode: ${callMode} for session ${data.sessionId}`);

    return { success: true, callMode };

  } catch (error) {
    logger.error("❌ Error joining call", error);
    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: (error as Error).message };
  }
}

  async endCall(data: CallEndedDto): Promise<{ success: boolean }> {
    try {
      const videoCall = await this._videoCallRepo.findBySessionId(
        data.sessionId
      );

      if (!videoCall) {
        logger.info(`End call requested for ${data.sessionId} but no active call found - already ended`);
        return { success: true };
      }

      if (
        videoCall.callStatus === "completed" ||
        videoCall.callStatus === "cancelled"
      )
        return { success: true };

      await this._videoCallRepo.updateCallStatus(
        data.sessionId,
        "completed",
        { callEndedAt: new Date() }
      );

      return { success: true };
    } catch (error) {
      logger.error("Error ending call", error);
      throw new AppError(
        "Failed to end call",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCallStatus(
    sessionId: string
  ): Promise<{ status: string; participants: Record<string, unknown>[]; meetLink?: string }> {
    try {

      const videoCall = await this._videoCallRepo.findBySessionId(
        sessionId
      );

      if (videoCall) {
        const activeParticipants = videoCall.participants.filter(
          (p) => !p.leftAt
        );
        return {
          status: videoCall.callStatus,
          participants: activeParticipants.map((p) => ({
            userId: p.userId,
            userType: p.userType,
            joinedAt: p.joinedAt,
          })),
          meetLink: videoCall.meetLink,
        };
      }


      const trialClass = await this._trialClassRepo.findById(sessionId);
      if (trialClass?.meetLink) {

        return {
          status: "not_started",
          participants: [],
          meetLink: trialClass.meetLink
        };
      }


      return { status: "not_started", participants: [] };
    } catch (error) {
      logger.error("Error getting call status", error);
      throw new AppError(
        "Failed to get call status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  private _verifyUserAuthorization(
    trialClass: { mentor: unknown; student: unknown },
    userId: string,
    userType: string
  ): boolean {
    if (userType === "admin") return true;

    // Helper to extract ID string safely
    const getId = (field: unknown): string | undefined => {
      if (!field) return undefined;
      if (typeof field === 'string') return field;
      if (field instanceof Types.ObjectId) return field.toString();
      if ((field as { _id?: unknown })._id) return (field as { _id: { toString: () => string } })._id.toString(); // Handle populated object
      return undefined;
    };

    if (userType === "mentor") {
      const mentorId = getId(trialClass.mentor);
      return mentorId === userId;
    }

    if (userType === "student") {
      const studentId = getId(trialClass.student);
      return studentId === userId;
    }

    return false;
  }

  private _generateMeetLink(sessionId: string): string {
    const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return `${baseUrl}/session/${sessionId}/call`;
  }
}
