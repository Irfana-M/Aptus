import { injectable } from "inversify";
import { Grade, type IGrade } from "@/models/grade.model";
import { logger } from "@/utils/logger";
import type { IGradeRepository } from "@/interfaces/repositories/IGradeRepository";

@injectable()
export class GradeRepository implements IGradeRepository {
    async findAllActive(): Promise<IGrade[]> {
        logger.info("Fetching all active grades");
        return await Grade.find({ isActive: true})
        .sort({ grade: 1 })
        .exec();
    }

    async findBySyllabus(syllabus: string): Promise<IGrade[]> {
    logger.info(`Fetching grades for syllabus: ${syllabus}`);
    return await Grade.find({ 
      syllabus: syllabus.toUpperCase() as "CBSE" | "STATE" | "ICSE",
      isActive: true 
    })
    .sort({ grade: 1 })
    .exec();
  }

  async findById(id: string): Promise<IGrade | null> {
    logger.info(`Fetching grade by ID: ${id}`);
    return await Grade.findById(id).exec();
  }
}
