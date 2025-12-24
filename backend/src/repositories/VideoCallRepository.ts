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
      logger.info("Creating new video call", { trialClassId: videoCallData.trialClassId });
      const videoCall = new VideoCall(videoCallData);
      const savedCall = await videoCall.save();
      logger.info("Video call created successfully", { callId: savedCall._id });
      return savedCall;
    } catch (error: unknown) {
      logger.error("Error creating video call", error);
      throw new AppError("Failed to create video call", HttpStatusCode.INTERNAL_SERVER_ERROR);
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

  async findByTrialClassId(trialClassId: string): Promise<IVideoCallDocument | null> {
    try {
      if (!Types.ObjectId.isValid(trialClassId)) {
        throw new AppError("Invalid trial class ID", HttpStatusCode.BAD_REQUEST);
      }
      return await VideoCall.findOne({ trialClassId });
    } catch (error: unknown) {
      logger.error("Error finding video call by trial class ID", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to find video call", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateCallStatus(
    trialClassId: string,
    status: "completed" | "cancelled" | "active" | "failed",
    updates?: Partial<IVideoCallDocument>
  ): Promise<IVideoCallDocument | null> {
    try {
      if (!Types.ObjectId.isValid(trialClassId)) {
        throw new AppError("Invalid trial class ID", HttpStatusCode.BAD_REQUEST);
      }

      const updateData: Partial<IVideoCallDocument> = { callStatus: status, ...updates };
      
      if (status === 'active') {
        updateData.callStartedAt = new Date();
      } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        updateData.callEndedAt = new Date();
        // Calculate duration if needed
        const existingCall = await VideoCall.findOne({ trialClassId });
        if (existingCall?.callStartedAt) {
             const duration = Math.floor((new Date().getTime() - existingCall.callStartedAt.getTime()) / 1000);
             updateData.callDuration = duration;
        }
      }

      return await VideoCall.findOneAndUpdate({ trialClassId }, updateData, { new: true, runValidators: true });
    } catch (error: unknown) {
      logger.error("Error updating call status", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update call status", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async addParticipant(
    trialClassId: string,
    participant: {
      userId: string;
      userType: 'student' | 'mentor' | 'admin';
      socketId?: string;
    }
  ): Promise<IVideoCallDocument | null> {
    try {
      if (!Types.ObjectId.isValid(trialClassId)) {
        throw new AppError("Invalid trial class ID", HttpStatusCode.BAD_REQUEST);
      }

      const participantData = {
        userId: new Types.ObjectId(participant.userId),
        userType: participant.userType,
        socketId: participant.socketId,
        joinedAt: new Date()
      };

      return await VideoCall.findOneAndUpdate(
        { trialClassId },
        { $push: { participants: participantData } },
        { new: true, runValidators: true }
      );
    } catch (error: unknown) {
      logger.error("Error adding participant", error);
      throw new AppError("Failed to add participant", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async removeParticipant(
    trialClassId: string,
    userId: string
  ): Promise<IVideoCallDocument | null> {
    try {
      if (!Types.ObjectId.isValid(trialClassId)) {
        throw new AppError("Invalid trial class ID", HttpStatusCode.BAD_REQUEST);
      }

      return await VideoCall.findOneAndUpdate(
        { trialClassId },
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
    trialClassId: string,
    duration: number
  ): Promise<IVideoCallDocument | null> {
    try {
      return await VideoCall.findOneAndUpdate({ trialClassId }, { callDuration: duration }, { new: true });
    } catch (error: unknown) {
      logger.error("Error updating call duration", error);
      throw new AppError("Failed to update call duration", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async isUserInCall(trialClassId: string, userId: string): Promise<boolean> {
    try {
      const videoCall = await VideoCall.findOne({
        trialClassId: new Types.ObjectId(trialClassId),
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