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
import { MESSAGES } from "@/constants/messages.constants";

@injectable()
export class SubjectService implements ISubjectService {
  constructor(
    @inject(TYPES.ISubjectRepository)
    private _subjectRepo: ISubjectRepository,
    @inject(TYPES.IGradeRepository)
    private _gradeRepo: IGradeRepository
  ) { }

  async getAllSubjects(): Promise<SubjectResponseDto[]> {
    try {
      const subjects = await this._subjectRepo.findAllActive();
      return subjects.map(this._toResponseDto);
    } catch (error) {
      logger.error("Error fetching all subjects", error);
      throw new AppError(
        MESSAGES.COURSE.SUBJECTS_FETCH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSubjectsByGrade(gradeId: string, syllabus?: string): Promise<SubjectResponseDto[]> {
    try {
      if (!gradeId) {
        throw new AppError(MESSAGES.AVAILABILITY.GRADE_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
      }

      if (gradeId === 'all') {
        const subjects = await this._subjectRepo.findAllActive();
        return subjects.map(this._toResponseDto);
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
        if (
          syllabus &&
          syllabus !== "undefined" &&
          syllabus !== "null" &&
          syllabus.trim() !== ""
        ) {
          query.syllabus = syllabus.toUpperCase().trim();
        }

        let gradeDoc = await this._gradeRepo.findOne(query);

        if (!gradeDoc && syllabus) {
          console.warn("Retrying without syllabus...");

          const fallbackQuery = {
            name: { $regex: new RegExp(`^${gradeId}$`, "i") },
            isActive: true,
          };

          gradeDoc = await this._gradeRepo.findOne(fallbackQuery);
        }

        if (!gradeDoc) {
          return [];
        }
        finalGradeId = (gradeDoc._id as unknown as string).toString();
        console.log(`✅ [SubjectService] Grade "${gradeId}" resolved to ID: ${finalGradeId}`);
      } else {
        console.log(`🔍 [SubjectService] Grade ID "${gradeId}" provided directly.`);
      }

      console.log(`🔍 [SubjectService] Fetching subjects for finalGradeId: ${finalGradeId}`);
      const subjects = await this._subjectRepo.findByGrade(finalGradeId);
      console.log(`✅ [SubjectService] Found ${subjects.length} subjects.`);
      return subjects.map(this._toResponseDto);
    } catch (error) {
      logger.error(`Error fetching subjects for grade ID: ${gradeId}`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        MESSAGES.COURSE.SUBJECTS_FETCH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSubjectsByGradeAndSyllabus(grade: number, syllabus: string): Promise<SubjectResponseDto[]> {
    try {
      const validSyllabi = ["CBSE", "STATE", "ICSE"];
      if (!validSyllabi.includes(syllabus.toUpperCase())) {
        throw new AppError(
          MESSAGES.VALIDATION.INVALID_SYLLABUS,
          HttpStatusCode.BAD_REQUEST
        );
      }

      if (grade < 1 || grade > 12) {
        throw new AppError(
          MESSAGES.VALIDATION.INVALID_GRADE_RANGE,
          HttpStatusCode.BAD_REQUEST
        );
      }

      const subjects = await this._subjectRepo.findByGradeAndSyllabus(grade, syllabus);
      return subjects.map(this._toResponseDto);
    } catch (error) {
      logger.error(`Error fetching subjects for grade ${grade} and syllabus ${syllabus}`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        MESSAGES.COURSE.SUBJECTS_FETCH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findByName(name: string): Promise<string | null> {
    try {
      const subject = await this._subjectRepo.findOne({ subjectName: name });
      return subject ? (subject._id as unknown as string).toString() : null;
    } catch (error) {
      logger.error(`Error finding subject by name: ${name}`, error);
      return null;
    }
  }

  private _toResponseDto(subject: ISubject): SubjectResponseDto {
    return {
      id: subject._id?.toString() || "",
      subjectName: subject.subjectName,
      syllabus: subject.syllabus,
      grade: subject.grade ? subject.grade.toString() : "",
    };
  }
}