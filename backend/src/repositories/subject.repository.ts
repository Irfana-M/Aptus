import { injectable } from "inversify";
import { Subject, type ISubject } from "@/models/subject.model";
import { Grade } from "@/models/grade.model";
import { logger } from "@/utils/logger";
import type { ISubjectRepository } from "@/interfaces/repositories/ISubjectRepository";

@injectable()
export class SubjectRepository implements ISubjectRepository {
  async findAllActive(): Promise<ISubject[]> {
    logger.info("Fetching all active subjects");
    return await Subject.find({ isActive: true })
      .sort({ subjectName: 1 })
      .exec();
  }

  async findByGradeAndSyllabus(grade: number, syllabus: string): Promise<ISubject[]> {
    logger.info(`Fetching subjects for grade ${grade} and syllabus ${syllabus}`);
    
    // First find the grade document to get its ID
    const gradeDoc = await Grade.findOne({
      grade: grade,
      syllabus: syllabus.toUpperCase() as "CBSE" | "STATE" | "ICSE",
      isActive: true
    }).exec();

    if (!gradeDoc) {
      logger.warn(`Grade not found for number: ${grade} and syllabus: ${syllabus}`);
      return [];
    }

    return await Subject.find({ 
      grade: gradeDoc._id,
      syllabus: syllabus.toUpperCase() as "CBSE" | "STATE" | "ICSE",
      isActive: true 
    })
    .sort({ subjectName: 1 })
    .exec();
  }

  async findByGrade(gradeId: string): Promise<ISubject[]> {
    logger.info(`Fetching subjects for grade ID: ${gradeId}`);
    // Since we now store grade as ObjectId, we can query directly
    return await Subject.find({ 
      grade: gradeId,
      isActive: true 
    })
    .sort({ subjectName: 1 })
    .exec();
  }

  async findById(id: string): Promise<ISubject | null> {
    logger.info(`Fetching subject by ID: ${id}`);
    return await Subject.findById(id).exec();
  }
}