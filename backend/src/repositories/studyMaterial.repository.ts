import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository";
import type { IStudyMaterial, IAssignmentSubmission } from "../interfaces/models/studyMaterial.interface";
import { StudyMaterialModel, AssignmentSubmissionModel } from "../models/studyMaterial.model";
import type { IStudyMaterialRepository } from "../interfaces/repositories/IStudyMaterialRepository";
import { Types, type FilterQuery } from "mongoose";
import type { IAssignmentSubmissionRepository } from "../interfaces/repositories/IAssignmentSubmissionRepository";

@injectable()
export class StudyMaterialRepository extends BaseRepository<IStudyMaterial> implements IStudyMaterialRepository {
  constructor() {
    super(StudyMaterialModel);
  }

  async findBySessionId(sessionId: string): Promise<IStudyMaterial[]> {
    return this.model.find({ sessionId: new Types.ObjectId(sessionId), status: 'active' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStudentId(studentId: string): Promise<IStudyMaterial[]> {
    return this.model.find({ 
      $or: [
        { studentId: new Types.ObjectId(studentId) },
        { 'assignmentDetails.assignedTo': new Types.ObjectId(studentId) }
      ],
      status: 'active'
    })
      .populate('sessionId', 'startTime subjectId')
      .populate('mentorId', 'fullName')
      .populate('subjectId', 'subjectName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCourseId(courseId: string): Promise<IStudyMaterial[]> {
    return this.model.find({ courseId: new Types.ObjectId(courseId), status: 'active' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByMentor(mentorId: string, materialType?: 'study_material' | 'assignment'): Promise<IStudyMaterial[]> {
    const query: FilterQuery<IStudyMaterial> = { mentorId: new Types.ObjectId(mentorId), status: 'active' };
    if (materialType) query.materialType = materialType;
    
    return this.model.find(query)
      .populate('subjectId', 'subjectName')
      .populate('studentId', 'fullName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAssignmentsForStudent(studentId: string): Promise<IStudyMaterial[]> {
    return this.model.find({
      materialType: 'assignment',
      'assignmentDetails.assignedTo': new Types.ObjectId(studentId),
      status: 'active'
    })
      .populate('mentorId', 'fullName')
      .populate('subjectId', 'subjectName')
      .sort({ 'assignmentDetails.dueDate': 1 })
      .exec();
  }

  async findUpcomingAssignments(daysAhead: number): Promise<IStudyMaterial[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.model.find({
      materialType: 'assignment',
      status: 'active',
      'assignmentDetails.dueDate': {
        $gte: now,
        $lte: futureDate
      }
    }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndUpdate(id, { status: 'archived' }).exec();
    return !!result;
  }
}

// Submission Repository
@injectable()
export class AssignmentSubmissionRepository extends BaseRepository<IAssignmentSubmission> implements IAssignmentSubmissionRepository {
  constructor() {
    super(AssignmentSubmissionModel);
  }

  async findByMaterialId(materialId: string): Promise<IAssignmentSubmission[]> {
    return AssignmentSubmissionModel.find({ materialId: new Types.ObjectId(materialId) })
      .populate('studentId', 'fullName email')
      .sort({ submittedAt: -1 })
      .exec();
  }

  async findByStudentId(studentId: string): Promise<IAssignmentSubmission[]> {
    return AssignmentSubmissionModel.find({ studentId: new Types.ObjectId(studentId) })
      .populate('materialId')
      .sort({ submittedAt: -1 })
      .exec();
  }

  async findByMaterialAndStudent(materialId: string, studentId: string): Promise<IAssignmentSubmission | null> {
    return AssignmentSubmissionModel.findOne({
      materialId: new Types.ObjectId(materialId),
      studentId: new Types.ObjectId(studentId)
    })
      .populate('materialId')
      .exec();
  }

  async addFeedback(submissionId: string, feedback: string): Promise<IAssignmentSubmission | null> {
    return AssignmentSubmissionModel.findByIdAndUpdate(
      submissionId,
      { 
        feedback, 
        status: 'reviewed',
        reviewedAt: new Date()
      },
      { new: true }
    ).exec();
  }
}

