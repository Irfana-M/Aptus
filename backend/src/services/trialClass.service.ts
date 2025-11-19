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

      if (!newTrial._id) {
        throw new AppError(
          "Failed to create trial class - no ID returned",
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      logger.info(
        `Trial class requested by student ${studentId} for subject ${data.subject}`
      );

      
      const populatedTrial = await this.trialRepo.findById(newTrial._id.toString());
      if (!populatedTrial) {
        throw new AppError(
          "Failed to create trial class",
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

      return TrialClassMapper.toResponseDto(populatedTrial);
    } catch (err) {
      logger.error("Error creating trial class", err);
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        "Unable to create trial class",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getStudentTrialClasses(studentId: string): Promise<TrialClassResponseDto[]> {
    try {
      const trials = await this.trialRepo.findByStudentId(studentId);
      return trials.map(TrialClassMapper.toResponseDto);
    } catch (err) {
      logger.error("Error fetching student trial classes", err);
      throw new AppError(
        "Unable to fetch trial classes",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getTrialClassById(id: string, studentId: string): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(id);
      if (!trial) {
        throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      }
      
    
      if (trial.student.toString() !== studentId) {
        throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);
      }
      
      return TrialClassMapper.toResponseDto(trial);
    } catch (err) {
      logger.error("Error fetching trial class", err);
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        "Unable to fetch trial class",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async assignMentor(
    trialClassId: string, 
    mentorId: string, 
    meetLink: string
  ): Promise<TrialClassResponseDto> {
    try {
      const updated = await this.trialRepo.update(trialClassId, {
        mentor: mentorId as any,
        meetLink,
        status: "assigned"
      });
      
      if (!updated) {
        throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      }
      
      return TrialClassMapper.toResponseDto(updated);
    } catch (err) {
      logger.error("Error assigning mentor", err);
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        "Unable to assign mentor",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
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
    console.log('🔍 UPDATE DEBUG - Starting update:', {
      trialClassId,
      studentId,
      updates
    });

    // Get the existing trial class
    const existingTrial = await this.trialRepo.findById(trialClassId);
    if (!existingTrial) {
      throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
    }

   
    let trialStudentId: string;
    
    if (typeof existingTrial.student === 'string') {
     
      trialStudentId = existingTrial.student;
    } else if (existingTrial.student && '_id' in existingTrial.student) {
      
      trialStudentId = existingTrial.student._id.toString();
    } else {
      
      trialStudentId = existingTrial.student.toString();
    }

    console.log('🔍 DEBUG - Student ID comparison:', {
      trialStudentId,
      requestStudentId: studentId,
      match: trialStudentId === studentId
    });

    
    if (trialStudentId !== studentId) {
      console.log('❌ ACCESS DENIED - Student IDs do not match!');
      console.log('❌ Trial student ID:', trialStudentId);
      console.log('❌ Request student ID:', studentId);
      throw new AppError("Access denied", HttpStatusCode.FORBIDDEN);
    }

    console.log('✅ ACCESS GRANTED - Student IDs match');

    
    if (existingTrial.status === 'completed' || existingTrial.status === 'cancelled') {
      throw new AppError("Cannot update completed or cancelled trial class", HttpStatusCode.BAD_REQUEST);
    }

    
    if (updates.subject) {
      await this.validateSubjectExists(updates.subject);
    }

    
    if (updates.preferredDate || updates.preferredTime) {
      const preferredDate = updates.preferredDate ? new Date(updates.preferredDate) : existingTrial.preferredDate;
      const preferredTime = updates.preferredTime || existingTrial.preferredTime;
      
      this.validateTrialClassRequest({
        subject: updates.subject || existingTrial.subject.toString(),
        preferredDate: preferredDate.toISOString(),
        preferredTime: preferredTime
      });
    }

   
    const updateData: any = {};
    if (updates.subject) updateData.subject = new Types.ObjectId(updates.subject);
    if (updates.preferredDate) updateData.preferredDate = new Date(updates.preferredDate);
    if (updates.preferredTime) updateData.preferredTime = updates.preferredTime;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

   
    const updatedTrial = await this.trialRepo.update(trialClassId, updateData);
    
    if (!updatedTrial) {
      throw new AppError("Failed to update trial class", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    logger.info(`Trial class ${trialClassId} updated by student ${studentId}`);

    return TrialClassMapper.toResponseDto(updatedTrial);
  } catch (err) {
    logger.error("Error updating trial class", err);
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(
      "Unable to update trial class",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}


  private validateTrialClassRequest(data: TrialClassRequestDto): void {
  console.log('📥 Received data:', data);
  console.log('📅 Preferred date:', data.preferredDate);
  console.log('⏰ Preferred time:', data.preferredTime);
  
  const preferredDate = new Date(data.preferredDate);
  const now = new Date();
  
  console.log('📊 Date comparison:', {
    preferred: preferredDate,
    now: now,
    isPast: preferredDate < now
  });

    const preferredDateOnly = new Date(
      preferredDate.getFullYear(),
      preferredDate.getMonth(),
      preferredDate.getDate()
    );

    const todayOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (preferredDate < todayOnly) {
      throw new AppError(
        "Preferred date cannot be in the past",
        HttpStatusCode.BAD_REQUEST
      );
    }

    if (!data.preferredTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      throw new AppError("Invalid time format", HttpStatusCode.BAD_REQUEST);
    }
  }

   private async validateSubjectExists(subjectId: string): Promise<void> {
  console.log('🔍 Validating subject:', subjectId);
  
  const { Subject } = await import("@/models/subject.model");
  const subject = await Subject.findById(subjectId);
  
  console.log('📚 Found subject:', subject);
  
  if (!subject) {
    throw new AppError("Subject not found", HttpStatusCode.BAD_REQUEST);
  }
  
  if (!subject.isActive) {
    throw new AppError("Subject is not available", HttpStatusCode.BAD_REQUEST);
  }
  
  console.log('✅ Subject validation passed');
}
}