// src/services/trialClass.service.ts

import { inject, injectable } from "inversify";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import type { ITrialClassService } from "@/interfaces/services/ITrialClassService";
import type { TrialClassRequestDto, TrialClassResponseDto } from "@/dto/student/trialClassDTO";
import { TYPES } from "../types";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import { TrialClassMapper } from "@/mappers/trialClassMapper";
import { Types } from "mongoose";

@injectable()
export class TrialClassService implements ITrialClassService {
  constructor(
    @inject(TYPES.ITrialClassRepository)
    private trialRepo: ITrialClassRepository
  ) {}

  // PERFECT helper — accepts ALL possible types from your model
  private getStringId(
    field: any // Accept anything — we'll handle it safely
  ): string {
    if (!field) return "";
    if (field instanceof Types.ObjectId) return field.toString();
    if (typeof field === "string") return field;
    if (field._id) return field._id.toString();
    return "";
  }

  async requestTrialClass(
    data: TrialClassRequestDto,
    studentId: string
  ): Promise<TrialClassResponseDto> {
    try {
      this.validateTrialClassRequest(data);
      await this.validateSubjectExists(data.subject);

      const newTrial = await this.trialRepo.create({
        student: studentId,
        subject: data.subject,
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        status: "requested",
      });

      const populatedTrial = await this.trialRepo.findById(newTrial._id.toString());
      if (!populatedTrial) throw new AppError("Failed to create trial class", HttpStatusCode.INTERNAL_SERVER_ERROR);

      logger.info(`Trial class requested by student ${studentId}`);
      return TrialClassMapper.toResponseDto(populatedTrial);
    } catch (err) {
      logger.error("Error creating trial class", err);
      throw err instanceof AppError ? err : new AppError("Unable to create trial class", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getStudentTrialClasses(studentId: string): Promise<TrialClassResponseDto[]> {
    try {
      const trials = await this.trialRepo.findByStudentId(studentId);
      return trials.map(TrialClassMapper.toResponseDto);
    } catch (err) {
      logger.error("Error fetching student trial classes", err);
      throw new AppError("Unable to fetch trial classes", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTrialClassById(id: string, studentId: string): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(id);
      if (!trial) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);

      const trialStudentId = this.getStringId(trial.student);
      if (trialStudentId !== studentId) throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);

      return TrialClassMapper.toResponseDto(trial);
    } catch (err) {
      logger.error("Error fetching trial class", err);
      throw err instanceof AppError ? err : new AppError("Unable to fetch trial class", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async assignMentor(trialClassId: string, mentorId: string, meetLink: string): Promise<TrialClassResponseDto> {
    try {
      const updated = await this.trialRepo.update(trialClassId, {
      mentor: new Types.ObjectId(mentorId) as Types.ObjectId, // ← THIS FIXES IT
      meetLink,
      status: "assigned",
      });

      if (!updated) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      return TrialClassMapper.toResponseDto(updated);
    } catch (err) {
      logger.error("Error assigning mentor", err);
      throw err instanceof AppError ? err : new AppError("Unable to assign mentor", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateTrialClass(
    trialClassId: string,
    studentId: string,
    updates: {
      subject?: string;
      preferredDate?: string;
      preferredTime?: string;
      notes?: string;
    }
  ): Promise<TrialClassResponseDto> {
    try {
      const existingTrial = await this.trialRepo.findById(trialClassId);
      if (!existingTrial) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);

      const trialStudentId = this.getStringId(existingTrial.student);
      if (trialStudentId !== studentId) throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);

      if (existingTrial.status === "completed" || existingTrial.status === "cancelled") {
        throw new AppError("Cannot update completed or cancelled trial class", HttpStatusCode.BAD_REQUEST);
      }

      if (updates.subject) await this.validateSubjectExists(updates.subject);

      const updateData: Partial<any> = {};
      if (updates.subject) updateData.subject = new Types.ObjectId(updates.subject);
      if (updates.preferredDate) updateData.preferredDate = new Date(updates.preferredDate);
      if (updates.preferredTime) updateData.preferredTime = updates.preferredTime;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const updatedTrial = await this.trialRepo.update(trialClassId, updateData);
      if (!updatedTrial) throw new AppError("Failed to update trial class", HttpStatusCode.INTERNAL_SERVER_ERROR);

      return TrialClassMapper.toResponseDto(updatedTrial);
    } catch (err) {
      logger.error("Error updating trial class", err);
      throw err instanceof AppError ? err : new AppError("Unable to update trial class", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async submitFeedback(
    trialClassId: string,
    studentId: string,
    feedback: { rating: number; comment?: string }
  ): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(trialClassId);
      if (!trial) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);

      const trialStudentId = this.getStringId(trial.student);
      if (trialStudentId !== studentId) throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);

      const updatedTrial = await this.trialRepo.update(trialClassId, {
        feedback: { rating: feedback.rating, comment: feedback.comment || "" },
        status: "completed",
      });

      if (!updatedTrial) throw new AppError("Failed to submit feedback", HttpStatusCode.INTERNAL_SERVER_ERROR);

      const { StudentModel } = await import("@/models/student/student.model");
      await StudentModel.findByIdAndUpdate(trialStudentId, { isTrialCompleted: true });

      return TrialClassMapper.toResponseDto(updatedTrial);
    } catch (err) {
      logger.error("Error submitting feedback", err);
      throw err instanceof AppError ? err : new AppError("Unable to submit feedback", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getMentorTrialClasses(mentorId: string): Promise<TrialClassResponseDto[]> {
    try {
      const trials = await this.trialRepo.findByMentorId(mentorId);
      return trials.map(TrialClassMapper.toResponseDto);
    } catch (err) {
      logger.error("Error fetching mentor trial classes", err);
      throw new AppError("Unable to fetch trial classes", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTrialClassStats(mentorId: string): Promise<{ total: number; completed: number; upcoming: number }> {
    try {
      const trials = await this.trialRepo.findByMentorId(mentorId);

      const total = trials.length;
      const completed = trials.filter(t => t.status === "completed").length;
      const now = new Date();
      const upcoming = trials.filter(t => t.status === "assigned" && new Date(t.preferredDate) > now).length;

      return { total, completed, upcoming };
    } catch (err) {
      logger.error("Error fetching trial class stats", err);
      throw new AppError("Unable to fetch trial class stats", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateTrialClassStatus(
    trialClassId: string,
    status: "assigned" | "completed" | "cancelled",
    reason?: string
  ): Promise<TrialClassResponseDto> {
    try {
      const updateData: any = { status };
      if (reason && status === "cancelled") updateData.cancellationReason = reason;

      const updated = await this.trialRepo.update(trialClassId, updateData);
      if (!updated) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);

      return TrialClassMapper.toResponseDto(updated);
    } catch (err) {
      logger.error("Error updating trial class status", err);
      throw err instanceof AppError ? err : new AppError("Unable to update trial class status", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async submitMentorFeedback(
    trialClassId: string,
    mentorId: string,
    feedback: { rating: number; comment?: string }
  ): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(trialClassId);
      if (!trial) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);

      const trialMentorId = this.getStringId(trial.mentor);
      if (!trialMentorId || trialMentorId !== mentorId) {
        throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);
      }

      const updatedTrial = await this.trialRepo.update(trialClassId, { status: "completed" });
      if (!updatedTrial) throw new AppError("Failed to submit feedback", HttpStatusCode.INTERNAL_SERVER_ERROR);

      return TrialClassMapper.toResponseDto(updatedTrial);
    } catch (err) {
      logger.error("Error submitting mentor feedback", err);
      throw err instanceof AppError ? err : new AppError("Unable to submit feedback", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  private validateTrialClassRequest(data: TrialClassRequestDto): void {
    const preferredDate = new Date(data.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preferredDate < today) {
      throw new AppError("Preferred date cannot be in the past", HttpStatusCode.BAD_REQUEST);
    }

    if (!data.preferredTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      throw new AppError("Invalid time format. Use HH:MM (24-hour)", HttpStatusCode.BAD_REQUEST);
    }
  }

  private async validateSubjectExists(subjectId: string): Promise<void> {
    const { Subject } = await import("@/models/subject.model");
    const subject = await Subject.findById(subjectId);

    if (!subject) throw new AppError("Subject not found", HttpStatusCode.BAD_REQUEST);
    if (!subject.isActive) throw new AppError("Subject is not available", HttpStatusCode.BAD_REQUEST);
  }
}