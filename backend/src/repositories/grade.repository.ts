import { injectable } from "inversify";
import { Grade, type IGrade } from "@/models/grade.model.js";
import { logger } from "@/utils/logger.js";
import type { IGradeRepository } from "@/interfaces/repositories/IGradeRepository.js";
import { BaseRepository } from "./baseRepository.js";

@injectable()
export class GradeRepository extends BaseRepository<IGrade> implements IGradeRepository {
    constructor() {
        super(Grade);
    }

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
}
