import { injectable } from "inversify";
import { Subject, type ISubject } from "@/models/subject.model";
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
    return await Subject.find({ 
      grade,
      syllabus: syllabus.toUpperCase() as "CBSE" | "STATE" | "ICSE",
      isActive: true 
    })
    .sort({ subjectName: 1 })
    .exec();
  }

  async findByGrade(gradeId: string): Promise<ISubject[]> {
    logger.info(`Fetching subjects for grade ID: ${gradeId}`);
    // First get the grade to know the grade number and syllabus
    const Grade = (await import("@/models/grade.model")).Grade;
    const grade = await Grade.findById(gradeId);
    
    if (!grade) {
      return [];
    }

    return await this.findByGradeAndSyllabus(grade.grade, grade.syllabus);
  }

  async findById(id: string): Promise<ISubject | null> {
    logger.info(`Fetching subject by ID: ${id}`);
    return await Subject.findById(id).exec();
  }
}