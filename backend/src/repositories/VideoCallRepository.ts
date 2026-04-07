import { injectable } from "inversify";
import { VideoCall } from "@/models/videoCall.model";
import type { IVideoCallDocument } from "@/interfaces/models/videoCall.interface";
import type { IVideoCallRepository } from "@/interfaces/repositories/IVideoCallRepository";
import { logger } from "@/utils/logger";
import { Types } from "mongoose";
import { HttpStatusCode } from "@/constants/httpStatus";
import { AppError } from "@/utils/AppError";

@injectable()
export class VideoCallRepository implements IVideoCallRepository {
  async create(videoCallData: Partial<IVideoCallDocument>): Promise<IVideoCallDocument> {
    try {
      logger.info("Creating new video call", { sessionId: videoCallData.sessionId });
      const videoCall = new VideoCall(videoCallData);
      const savedCall = await videoCall.save();
      logger.info("Video call created successfully", { callId: savedCall._id });
      return savedCall;
    } catch (error: unknown) {
      logger.error("❌ REAL MONGOOSE ERROR:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
        error
      });

      throw error;
    }
  }

  async findById(id: string): Promise<IVideoCallDocument | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid video call ID", HttpStatusCode.BAD_REQUEST);
      }
      return await VideoCall.findById(id);
    } catch (error: unknown) {
      logger.error("Error finding video call by ID", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to find video call", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findBySessionId(sessionId: string): Promise<IVideoCallDocument | null> {
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError("Invalid session ID", HttpStatusCode.BAD_REQUEST);
      }
      return await VideoCall.findOne({ sessionId: new Types.ObjectId(sessionId) });
    } catch (error: unknown) {
      logger.error("Error finding video call by session ID", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to find video call", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateCallStatus(
    sessionId: string,
    status: "completed" | "cancelled" | "active" | "failed",
    updates?: Partial<IVideoCallDocument>
  ): Promise<IVideoCallDocument | null> {
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError("Invalid session ID", HttpStatusCode.BAD_REQUEST);
      }

      const updateData: Partial<IVideoCallDocument> = { callStatus: status, ...updates };

      if (status === 'active') {
        updateData.callStartedAt = new Date();
      } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        updateData.callEndedAt = new Date();
        // Calculate duration if needed
        const existingCall = await VideoCall.findOne({ sessionId });
        if (existingCall?.callStartedAt) {
          const duration = Math.floor((new Date().getTime() - existingCall.callStartedAt.getTime()) / 1000);
          updateData.callDuration = duration;
        }
      }

      return await VideoCall.findOneAndUpdate({ sessionId: new Types.ObjectId(sessionId) }, updateData, { new: true, runValidators: true });
    } catch (error: unknown) {
      logger.error("Error updating call status", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update call status", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async addParticipant(
    sessionId: string,
    participant: {
      userId: string;
      userType: 'student' | 'mentor' | 'admin';
      socketId?: string;
    }
  ): Promise<IVideoCallDocument | null> {
    logger.info("🔍 addParticipant query:", {
  sessionId,
  objectId: new Types.ObjectId(sessionId)
});
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError("Invalid session ID", HttpStatusCode.BAD_REQUEST);
      }

      const participantData = {
        userId: new Types.ObjectId(participant.userId),
        userType: participant.userType,
        socketId: participant.socketId,
        joinedAt: new Date()
      };

      const updated = await VideoCall.findOneAndUpdate(
        { sessionId: new Types.ObjectId(sessionId) },
        { $push: { participants: participantData } },
        { new: true, runValidators: true }
      );
      if (!updated) {
        throw new Error("VideoCall not found for sessionId");
      }
      return updated;
    } catch (error: unknown) {
      logger.error("Error adding participant", error);
      throw new AppError("Failed to add participant", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async removeParticipant(
    sessionId: string,
    userId: string
  ): Promise<IVideoCallDocument | null> {
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError("Invalid session ID", HttpStatusCode.BAD_REQUEST);
      }

      return await VideoCall.findOneAndUpdate(
        { sessionId },
        { $set: { "participants.$[elem].leftAt": new Date() } },
        {
          arrayFilters: [{ "elem.userId": new Types.ObjectId(userId), "elem.leftAt": { $exists: false } }],
          new: true
        }
      );
    } catch (error: unknown) {
      logger.error("Error removing participant", error);
      throw new AppError("Failed to remove participant", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateCallDuration(
    sessionId: string,
    duration: number
  ): Promise<IVideoCallDocument | null> {
    try {
      return await VideoCall.findOneAndUpdate({ sessionId: new Types.ObjectId(sessionId) }, { callDuration: duration }, { new: true });
    } catch (error: unknown) {
      logger.error("Error updating call duration", error);
      throw new AppError("Failed to update call duration", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async isUserInCall(sessionId: string, userId: string): Promise<boolean> {
    try {
      const videoCall = await VideoCall.findOne({
        sessionId: new Types.ObjectId(sessionId),
        'participants.userId': new Types.ObjectId(userId),
        'participants.leftAt': { $exists: false }
      });
      return !!videoCall;
    } catch (error: unknown) {
      logger.error("Error checking if user is in call", error);
      return false;
    }
  }
}