import { inject, injectable } from "inversify";
import type { IGradeRepository } from "@/interfaces/repositories/IGradeRepository";
import type { GradeResponseDto } from "@/dto/student/grade.dto";
import { TYPES } from "@/types";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import type { IGradeService } from "@/interfaces/services/IGradeService";


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
    } catch (err) {
      logger.error("Error fetching all grades", err);
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
    } catch (err) {
      logger.error(`Error fetching grades for syllabus: ${syllabus}`, err);
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        "Unable to fetch grades",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  private toResponseDto(grade: any): GradeResponseDto {
    return {
      id: grade._id.toString(),
      name: grade.name,
      syllabus: grade.syllabus,
      grade: grade.grade,
    };
  }
}