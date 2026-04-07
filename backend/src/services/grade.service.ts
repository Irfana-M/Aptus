import { inject, injectable } from "inversify";
import type { IGradeRepository } from "@/interfaces/repositories/IGradeRepository";
import type { GradeResponseDto } from "@/dtos/student/grade.dto";
import { TYPES } from "@/types";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import type { IGradeService } from "@/interfaces/services/IGradeService";
import type { IGrade } from "@/models/grade.model";

@injectable()
export class GradeService implements IGradeService {
  constructor(
    @inject(TYPES.IGradeRepository)
    private gradeRepo: IGradeRepository
  ) {}

  async getAllGrades(): Promise<GradeResponseDto[]> {
    try {
      const grades = await this.gradeRepo.findAllActive();
      return grades.map(this.toResponseDto);
    } catch (error) {
      logger.error("Error fetching all grades", error);
      throw new AppError(
        "Unable to fetch grades",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getGradesBySyllabus(syllabus: string): Promise<GradeResponseDto[]> {
    try {
      const validSyllabi = ["CBSE", "STATE", "ICSE"];
      if (!validSyllabi.includes(syllabus.toUpperCase())) {
        throw new AppError(
          "Invalid syllabus. Must be one of: CBSE, STATE, ICSE",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const grades = await this.gradeRepo.findBySyllabus(syllabus);
      return grades.map(this.toResponseDto);
    } catch (error) {
      logger.error(`Error fetching grades for syllabus: ${syllabus}`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Unable to fetch grades",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findByName(name: string): Promise<string | null> {
    try {
        const grade = await this.gradeRepo.findOne({ name: name });
        // Also support "Grade 10" if name is stored as "10" or vice versa?
        // Assuming strict match for now.
        return grade ? (grade._id as unknown as string).toString() : null;
    } catch (error) {
        logger.error(`Error finding grade by name: ${name}`, error);
        return null;
    }
  }

  private toResponseDto(grade: IGrade): GradeResponseDto {
    return {
      id: grade.id,
      name: grade.name,
      syllabus: grade.syllabus,
      grade: grade.grade,
    };
  }
}