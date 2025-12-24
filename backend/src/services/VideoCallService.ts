import { injectable, inject } from "inversify";
import { TYPES } from "@/types";
import type { IVideoCallService } from "@/interfaces/services/IVideoCallService";
import type { IVideoCallRepository } from "@/interfaces/repositories/IVideoCallRepository";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import type {
  JoinCallRequestDto,
  CallEndedDto,
} from "../dto/webrtcDTO";
import { logger } from "@/utils/logger";
import { HttpStatusCode } from "@/constants/httpStatus";
import { AppError } from "@/utils/AppError";
import { Types } from "mongoose";
import type { IUserRoleService } from "@/interfaces/services/IUserRoleSrvice";

import { fileLogger } from "@/utils/fileLogger";

@injectable()
export class VideoCallService implements IVideoCallService {
  constructor(
    @inject(TYPES.IVideoCallRepository)
    private videoCallRepo: IVideoCallRepository,
    @inject(TYPES.ITrialClassRepository)
    private trialClassRepo: ITrialClassRepository,
     @inject(TYPES.IUserRoleService) private userRoleService: IUserRoleService,
  ) {}


    async initializeCall(
    trialClassId: string,
    userId: string,
    userRole: 'mentor' | 'student'
  ): Promise<{ success: boolean; meetLink?: string }> {
    try {
      const trialClass = await this.trialClassRepo.findById(trialClassId);
      if (!trialClass) {
        throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      }

      let videoCall = await this.videoCallRepo.findByTrialClassId(trialClassId);
      
      if (videoCall) {
        return { success: true, meetLink: videoCall.meetLink };
      }

      let meetLink = trialClass.meetLink;

      if (!meetLink) {
        meetLink = this.generateMeetLink(trialClassId);
        await this.trialClassRepo.update(trialClassId, { meetLink });
      }

      videoCall = await this.videoCallRepo.create({
        trialClassId: new Types.ObjectId(trialClassId),
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
  ): Promise<{ success: boolean; error?: string }> {
    try {
      fileLogger(`🎥 JOIN CALL REQUEST - User: ${data.userId}, Type: ${data.userType}, Trial: ${data.trialClassId}`);
      logger.info(`🎥 JOIN CALL REQUEST - User: ${data.userId}, Type: ${data.userType}, Trial: ${data.trialClassId}`);
      
      // ========== NEW: USE IUserRoleService for verification ==========
      // Step 1: Verify user exists and has correct role
      const userVerification = await this.userRoleService.verifyUserRole(
        data.userId,
        data.userType
      );
      
      if (!userVerification.success) {
        fileLogger(`❌ User verification failed: ${userVerification.error}`);
        logger.warn(`❌ User verification failed: ${userVerification.error}`);
        return { 
          success: false, 
          error: userVerification.error || "User verification failed" 
        };
      }

      logger.info(`✅ User verified: ${userVerification.user?.email} as ${data.userType}`);

      // Step 2: Verify trial class authorization
      const authCheck = await this.userRoleService.verifyTrialClassAuthorization(
        data.trialClassId,
        data.userId,
        data.userType
      );
      
      if (!authCheck.authorized) {
        logger.warn(`❌ Unauthorized: ${authCheck.error}`);
        return { 
          success: false, 
          error: authCheck.error || "Unauthorized to join this call" 
        };
      }

      logger.info(`✅ User authorized for trial class ${data.trialClassId}`);

      // ========== ORIGINAL LOGIC FOR VIDEO CALL ==========
      // Find or create video call - allow BOTH student and mentor to create
      let videoCall = await this.videoCallRepo.findByTrialClassId(
        data.trialClassId
      );
      
      if (!videoCall) {
        logger.info(`📹 No existing call found - creating new VideoCall for trial class ${data.trialClassId}`);
        
        // Get meetLink from trial class or generate one
        let meetLink = (authCheck.trialClass as { meetLink?: string })?.meetLink;
        
        if (!meetLink) {
          meetLink = this.generateMeetLink(data.trialClassId);
          // Update trial class with meetLink
          await this.trialClassRepo.update(data.trialClassId, { meetLink });
          logger.info(`🔗 Generated meet link: ${meetLink}`);
        }

        // Create new video call
        videoCall = await this.videoCallRepo.create({
          trialClassId: new Types.ObjectId(data.trialClassId),
          callStatus: "active",
          meetLink,
        });
        
        logger.info(`✅ Video call created by ${data.userType} for trial class ${data.trialClassId}, CallID: ${videoCall._id}`);
      } else {
        logger.info(`📹 Found existing VideoCall: ${videoCall._id}, Status: ${videoCall.callStatus}`);
      }

      // Check if call is active
      if (videoCall.callStatus !== "active") {
        logger.warn(`❌ Call status is ${videoCall.callStatus}, not active`);
        return { success: false, error: `Call is ${videoCall.callStatus}` };
      }

      // Add participant to video call
      const participantData = {
        userId: data.userId,
        userType: data.userType,
        socketId: data.socketId,
      };

      logger.info(`👤 Adding participant ${data.userId} (${data.userType}) to call ${videoCall._id}`);
      await this.videoCallRepo.addParticipant(
        data.trialClassId,
        participantData
      );
      
      logger.info(`✅ Participant added successfully`);
      return { success: true };
      
    } catch (error) {
      logger.error("❌ Error joining call", error);
      
      // Return appropriate error message
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      
      return { success: false, error: "Failed to join call. Please try again." };
    }
  }

  // async joinCall(
  //   data: JoinCallRequestDto
  // ): Promise<{ success: boolean; error?: string }> {
  //   try {
  //     logger.info(`🎥 JOIN CALL REQUEST - User: ${data.userId}, Type: ${data.userType}, Trial: ${data.trialClassId}`);
      
  //     const trialClass = await this.trialClassRepo.findById(data.trialClassId);
  //     if (!trialClass) {
  //       logger.warn(`❌ Trial class not found: ${data.trialClassId}`);
  //       return { success: false, error: "Trial class not found" };
  //     }

  //     const isAuthorized = this.verifyUserAuthorization(
  //       trialClass,
  //       data.userId,
  //       data.userType
  //     );
  //     if (!isAuthorized) {
  //       logger.warn(`❌ Unauthorized user ${data.userId} trying to join trial class ${data.trialClassId}`);
  //       return { success: false, error: "Unauthorized to join this call" };
  //     }

  //     // Find or create video call - allow BOTH student and mentor to create
  //     let videoCall = await this.videoCallRepo.findByTrialClassId(
  //       data.trialClassId
  //     );
      
  //     if (!videoCall) {
  //       logger.info(`📹 No existing call found - creating new VideoCall for trial class ${data.trialClassId}`);
  //       // Create call if it doesn't exist (either user can create)
  //       const meetLink = this.generateMeetLink(data.trialClassId);
  //       videoCall = await this.videoCallRepo.create({
  //         trialClassId: new Types.ObjectId(data.trialClassId),
  //         callStatus: "active",
  //         meetLink,
  //       });
  //       logger.info(`✅ Video call created by ${data.userType} for trial class ${data.trialClassId}, CallID: ${videoCall._id}`);
  //     } else {
  //       logger.info(`📹 Found existing VideoCall: ${videoCall._id}, Status: ${videoCall.callStatus}`);
  //     }

  //     if (videoCall.callStatus !== "active") {
  //       logger.warn(`❌ Call status is ${videoCall.callStatus}, not active`);
  //       return { success: false, error: `Call is ${videoCall.callStatus}` };
  //     }

  //     const participantData = {
  //       userId: data.userId,
  //       userType: data.userType,
  //       socketId: data.socketId,
  //     };

  //     logger.info(`👤 Adding participant ${data.userId} (${data.userType}) to call ${videoCall._id}`);
  //     await this.videoCallRepo.addParticipant(
  //       data.trialClassId,
  //       participantData
  //     );
  //     logger.info(`✅ Participant added successfully`);
  //     return { success: true };
  //   } catch (error) {
  //     logger.error("❌ Error joining call", error);
  //     return { success: false, error: "Failed to join call" };
  //   }
  // }



  async endCall(data: CallEndedDto): Promise<{ success: boolean }> {
    try {
      const videoCall = await this.videoCallRepo.findByTrialClassId(
        data.trialClassId
      );
      
      // If call doesn't exist, it's already ended - return success
      if (!videoCall) {
        logger.info(`End call requested for ${data.trialClassId} but no active call found - already ended`);
        return { success: true };
      }

      if (
        videoCall.callStatus === "completed" ||
        videoCall.callStatus === "cancelled"
      )
        return { success: true };

      await this.videoCallRepo.updateCallStatus(
        data.trialClassId,
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
    trialClassId: string
  ): Promise<{ status: string; participants: Record<string, unknown>[]; meetLink?: string }> {
    try {
      // First check if there's an active video call
      const videoCall = await this.videoCallRepo.findByTrialClassId(
        trialClassId
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
      
      // If no video call exists, check if trial class has a meetLink
      const trialClass = await this.trialClassRepo.findById(trialClassId);
      if (trialClass?.meetLink) {
        // Trial class has a meet link but call hasn't started yet
        return { 
          status: "not_started", 
          participants: [],
          meetLink: trialClass.meetLink 
        };
      }
      
      // No video call and no meetLink in trial class
      return { status: "not_started", participants: [] };
    } catch (error) {
      logger.error("Error getting call status", error);
      throw new AppError(
        "Failed to get call status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  private verifyUserAuthorization(
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

  private generateMeetLink(trialClassId: string): string {
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return `${baseUrl}/trial-class/${trialClassId}/call`;
  }
}
