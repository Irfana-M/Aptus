import { inject, injectable } from "inversify";
import type { ISubjectRepository } from "@/interfaces/repositories/ISubjectRepository";
import type { IGradeRepository } from "@/interfaces/repositories/IGradeRepository";
import type { SubjectResponseDto } from "@/dtos/student/subject.dto";
import { TYPES } from "@/types";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import type { ISubjectService } from "@/interfaces/services/ISubjectService";
import type { ISubject } from "@/models/subject.model";

@injectable()
export class SubjectService implements ISubjectService {
  constructor(
    @inject(TYPES.ISubjectRepository)
    private subjectRepo: ISubjectRepository,
    @inject(TYPES.IGradeRepository)
    private gradeRepo: IGradeRepository
  ) {}

  async getAllSubjects(): Promise<SubjectResponseDto[]> {
    try {
      const subjects = await this.subjectRepo.findAllActive();
      return subjects.map(this.toResponseDto);
    } catch (err) {
      logger.error("Error fetching all subjects", err);
      throw new AppError(
        "Unable to fetch subjects",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSubjectsByGrade(gradeId: string, syllabus?: string): Promise<SubjectResponseDto[]> {
    try {
      if (!gradeId) {
        throw new AppError("Grade ID is required", HttpStatusCode.BAD_REQUEST);
      }

      if (gradeId === 'all') {
        const subjects = await this.subjectRepo.findAllActive();
        return subjects.map(this.toResponseDto);
      }

      console.log(`🔍 [SubjectService] Resolving subjects for grade: "${gradeId}", syllabus: "${syllabus}"`);

      // If gradeId doesn't look like an ObjectId, it's likely a grade name
      let finalGradeId = gradeId;
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(gradeId);

      if (!isObjectId) {
        console.log(`🔍 [SubjectService] Grade name "${gradeId}" provided. Resolving to ID...`);
        const query: Record<string, unknown> = { 
            name: { $regex: new RegExp(`^${gradeId}$`, 'i') }, 
            isActive: true 
        };
        if (syllabus) query.syllabus = syllabus.toUpperCase();
        
        const gradeDoc = await this.gradeRepo.findOne(query);
        if (!gradeDoc) {
             console.warn(`⚠️ [SubjectService] Grade document NOT found for Name: "${gradeId}", Syllabus: "${syllabus}"`);
             logger.warn(`Grade document not found for name: ${gradeId} and syllabus: ${syllabus}`);
             return [];
        }
        finalGradeId = (gradeDoc._id as { toString(): string }).toString();
        console.log(`✅ [SubjectService] Grade "${gradeId}" resolved to ID: ${finalGradeId}`);
      } else {
          console.log(`🔍 [SubjectService] Grade ID "${gradeId}" provided directly.`);
      }

      console.log(`🔍 [SubjectService] Fetching subjects for finalGradeId: ${finalGradeId}`);
      const subjects = await this.subjectRepo.findByGrade(finalGradeId);
      console.log(`✅ [SubjectService] Found ${subjects.length} subjects.`);
      return subjects.map(this.toResponseDto);
    } catch (err) {
      logger.error(`Error fetching subjects for grade ID: ${gradeId}`, err);
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        "Unable to fetch subjects",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSubjectsByGradeAndSyllabus(grade: number, syllabus: string): Promise<SubjectResponseDto[]> {
    try {
      const validSyllabi = ["CBSE", "STATE", "ICSE"];
      if (!validSyllabi.includes(syllabus.toUpperCase())) {
        throw new AppError(
          "Invalid syllabus. Must be one of: CBSE, STATE, ICSE",
          HttpStatusCode.BAD_REQUEST
        );
      }

      if (grade < 1 || grade > 12) {
        throw new AppError(
          "Grade must be between 1 and 12",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const subjects = await this.subjectRepo.findByGradeAndSyllabus(grade, syllabus);
      return subjects.map(this.toResponseDto);
    } catch (err) {
      logger.error(`Error fetching subjects for grade ${grade} and syllabus ${syllabus}`, err);
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        "Unable to fetch subjects",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findByName(name: string): Promise<string | null> {
    try {
        const subject = await this.subjectRepo.findOne({ subjectName: name });
        return subject ? (subject._id as string).toString() : null;
    } catch (error) {
        logger.error(`Error finding subject by name: ${name}`, error);
        return null;
    }
  }

  private toResponseDto(subject: ISubject): SubjectResponseDto {
    return {
      id: subject._id?.toString() || "",
      subjectName: subject.subjectName,
      syllabus: subject.syllabus,
      grade: subject.grade ? subject.grade.toString() : "",
    };
  }
}