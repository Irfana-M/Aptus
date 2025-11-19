import { inject, injectable } from "inversify";
import type { ISubjectRepository } from "@/interfaces/repositories/ISubjectRepository";
import type { SubjectResponseDto } from "@/dto/student/subject.dto";
import { TYPES } from "@/types";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import type { ISubjectService } from "@/interfaces/services/ISubjectService";

@injectable()
export class SubjectService implements ISubjectService {
  constructor(
    @inject(TYPES.ISubjectRepository)
    private subjectRepo: ISubjectRepository
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

  async getSubjectsByGrade(gradeId: string): Promise<SubjectResponseDto[]> {
    try {
      if (!gradeId) {
        throw new AppError("Grade ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const subjects = await this.subjectRepo.findByGrade(gradeId);
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

  private toResponseDto(subject: any): SubjectResponseDto {
    return {
      id: subject._id.toString(),
      subjectName: subject.subjectName,
      syllabus: subject.syllabus,
      grade: subject.grade,
    };
  }
}