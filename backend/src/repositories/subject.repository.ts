import { Types } from "mongoose";
import { injectable } from "inversify";
import { Subject, type ISubject } from "@/models/subject.model";
import { Grade } from "@/models/grade.model";
import { logger } from "@/utils/logger";
import type { ISubjectRepository } from "@/interfaces/repositories/ISubjectRepository";
import { BaseRepository } from "./baseRepository";

@injectable()
export class SubjectRepository extends BaseRepository<ISubject> implements ISubjectRepository {
  constructor() {
    super(Subject);
  }

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
    console.log(`🔍 [SubjectRepository] findByGrade called with: ${gradeId}`);
    
    try {
        const query = { 
          grade: new Types.ObjectId(gradeId),
          isActive: true 
        };
        console.log(`🔍 [SubjectRepository] Querying Subject with:`, query);
        const results = await Subject.find(query).sort({ subjectName: 1 }).exec();
        console.log(`✅ [SubjectRepository] Found ${results.length} results.`);
        return results;
    } catch (err) {
        console.error(`❌ [SubjectRepository] Error in findByGrade:`, err);
        // Fallback to string query if ObjectId casting fails for some reason
        return await Subject.find({ grade: gradeId, isActive: true }).sort({ subjectName: 1 }).exec();
    }
  }
}