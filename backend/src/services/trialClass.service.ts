import type { ITrialClassDocument } from "@/models/student/trialClass.model";
import type { OnboardingEvent } from "@/enums/studentOnboarding.enum";

import { inject, injectable } from "inversify";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import type { ITrialClassService } from "@/interfaces/services/ITrialClassService";
import type { IStudentService } from "@/interfaces/services/IStudentService";
import type { TrialEligibilityPolicy } from "@/domain/policy/TrialEligibilityPolicy";
import type { TrialClassRequestDto, TrialClassResponseDto } from "@/dto/student/trialClassDTO";
import { TYPES } from "@/types";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import { TrialClassMapper } from "@/mappers/trialClassMapper";
import { Types } from "mongoose";

@injectable()
export class TrialClassService implements ITrialClassService {
  constructor(
    @inject(TYPES.ITrialClassRepository)
    private trialRepo: ITrialClassRepository,
    @inject(TYPES.TrialEligibilityPolicy)
    private policy: TrialEligibilityPolicy,
    @inject(TYPES.IStudentService)
    private studentService: IStudentService
  ) {}

  private getStringId(
    field: unknown
  ): string {
    if (!field) return "";
    if (field instanceof Types.ObjectId) return field.toString();
    if (typeof field === "string") return field;
    
    // Handle objects with _id property (like populated docs)
    if (field && typeof field === 'object' && '_id' in field) {
      const fieldWithId = field as { _id: unknown };
      if (fieldWithId._id) {
        return fieldWithId._id.toString();
      }
    }
    return "";
  }

  async requestTrialClass(
    data: TrialClassRequestDto,
    studentId: string
  ): Promise<TrialClassResponseDto> {
    try {
      this.policy.validateRequest(data);
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
      
      // Advance onboarding to TRIAL_BOOKED
      try {
          await this.studentService.advanceOnboarding(studentId, 'TRIAL_BOOKED' as OnboardingEvent);
      } catch (e) {
          logger.warn(`Could not advance onboarding to TRIAL_BOOKED for ${studentId}`, e);
      }

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

  async getTrialClassById(id: string, userId: string): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(id);
      if (!trial) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);

      const trialStudentId = this.getStringId(trial.student);
      const trialMentorId = this.getStringId(trial.mentor);
      
      if (trialStudentId !== userId && trialMentorId !== userId) {
        throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);
      }

      return TrialClassMapper.toResponseDto(trial);
    } catch (err) {
      logger.error("Error fetching trial class", err);
      throw err instanceof AppError ? err : new AppError("Unable to fetch trial class", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async assignMentor(trialClassId: string, mentorId: string, meetLink: string): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(trialClassId);
      if (!trial) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      
      this.policy.canAssignMentor(trial);

      const updated = await this.trialRepo.update(trialClassId, {
        mentor: new Types.ObjectId(mentorId) as unknown as Types.ObjectId,
        meetLink,
        status: "assigned",
      } as unknown as Partial<ITrialClassDocument>);

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

      this.policy.canUpdate(existingTrial, studentId);

      if (updates.subject) await this.validateSubjectExists(updates.subject);

      const updateData: Record<string, unknown> = {};
      if (updates.subject) updateData.subject = new Types.ObjectId(updates.subject);
      if (updates.preferredDate) updateData.preferredDate = new Date(updates.preferredDate);
      if (updates.preferredTime) updateData.preferredTime = updates.preferredTime;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const updatedTrial = await this.trialRepo.update(trialClassId, updateData as unknown as Partial<ITrialClassDocument>);
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

      this.policy.canSubmitFeedback(trial, studentId);

      const trialStudentId = this.getStringId(trial.student);

      const updatedTrial = await this.trialRepo.update(trialClassId, {
        feedback: { rating: feedback.rating, comment: feedback.comment || "" },
        status: "completed",
      });

      if (!updatedTrial) throw new AppError("Failed to submit feedback", HttpStatusCode.INTERNAL_SERVER_ERROR);

      const { StudentModel } = await import("../models/student/student.model");
      await StudentModel.findByIdAndUpdate(trialStudentId, { isTrialCompleted: true });
      
      // Advance onboarding status to FEEDBACK_SUBMITTED
      await this.studentService.advanceOnboarding(trialStudentId, 'FEEDBACK_SUBMITTED' as OnboardingEvent);

      return TrialClassMapper.toResponseDto(updatedTrial);
    } catch (err: any) {
      logger.error("Error submitting feedback", {
          message: err?.message,
          stack: err?.stack,
          trialClassId,
          studentId
      });
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

  async getTodayTrialClasses(mentorId: string): Promise<TrialClassResponseDto[]> {
    try {
      const trials = await this.trialRepo.findByMentorId(mentorId);
      const today = new Date().toDateString();
      const todayTrials = trials.filter(t => new Date(t.preferredDate).toDateString() === today);
      return todayTrials.map(TrialClassMapper.toResponseDto);
    } catch (err) {
      logger.error("Error fetching today's trial classes", err);
      throw new AppError("Unable to fetch today's trial classes", HttpStatusCode.INTERNAL_SERVER_ERROR);
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
      const updateData: Record<string, unknown> = { status };
      if (reason && status === "cancelled") updateData.cancellationReason = reason;

      const updated = await this.trialRepo.update(trialClassId, updateData as unknown as Partial<ITrialClassDocument>);
      if (!updated) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);

      if (status === "completed") {
        const trialStudentId = this.getStringId(updated.student);
        const { StudentModel } = await import("../models/student/student.model");
        await StudentModel.findByIdAndUpdate(trialStudentId, { isTrialCompleted: true });
        logger.info(`✅ Student ${trialStudentId} marked as isTrialCompleted: true`);

        // Advance onboarding status to TRIAL_ATTENDED
        await this.studentService.advanceOnboarding(trialStudentId, 'TRIAL_ATTENDED' as OnboardingEvent);
      }

      return TrialClassMapper.toResponseDto(updated);
    } catch (err) {
      logger.error("Error updating trial class status", err);
      throw err instanceof AppError ? err : new AppError("Unable to update trial class status", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async submitMentorFeedback(
    trialClassId: string,
    mentorId: string,
    _feedback: { rating: number; comment?: string }
  ): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(trialClassId);
      if (!trial) throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);

      const trialMentorId = this.getStringId(trial.mentor);
      if (!trialMentorId || trialMentorId !== mentorId) {
        throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);
      }

      const updatedTrial = await this.trialRepo.update(trialClassId, { status: "completed" } as unknown as Partial<ITrialClassDocument>);
      if (!updatedTrial) throw new AppError("Failed to submit feedback", HttpStatusCode.INTERNAL_SERVER_ERROR);

      return TrialClassMapper.toResponseDto(updatedTrial);
    } catch (err) {
      logger.error("Error submitting mentor feedback", err);
      throw err instanceof AppError ? err : new AppError("Unable to submit feedback", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }


  private async validateSubjectExists(subjectId: string): Promise<void> {
    const { Subject } = await import("../models/subject.model");
    const subject = await Subject.findById(subjectId);

    if (!subject) throw new AppError("Subject not found", HttpStatusCode.BAD_REQUEST);
    if (!subject.isActive) throw new AppError("Subject is not available", HttpStatusCode.BAD_REQUEST);
  }
}