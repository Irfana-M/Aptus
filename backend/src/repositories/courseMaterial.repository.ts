import { injectable } from 'inversify';
import { CourseMaterial, type ICourseMaterial } from '../models/courseMaterial.model.js';
import type { ICourseMaterialRepository } from '../interfaces/repositories/ICourseMaterialRepository.js';
import type { FilterQuery } from 'mongoose';

@injectable()
export class CourseMaterialRepository implements ICourseMaterialRepository {
  async create(data: Partial<ICourseMaterial>): Promise<ICourseMaterial> {
    const material = new CourseMaterial(data);
    return await material.save();
  }

  async findById(id: string): Promise<ICourseMaterial | null> {
    return await CourseMaterial.findById(id)
      .populate('mentorId', 'fullName')
      .populate('subjectId', 'subjectName')
      .populate('sessionId');
  }

  async findByMentor(mentorId: string, type?: 'study_material' | 'assignment'): Promise<ICourseMaterial[]> {
    const query: FilterQuery<ICourseMaterial> = { mentorId, status: 'active' };
    if (type) query.type = type;
    
    return await CourseMaterial.find(query)
      .populate('subjectId', 'subjectName')
      .populate('sessionId')
      .sort({ createdAt: -1 });
  }

  async findByStudent(studentId: string, type?: 'study_material' | 'assignment'): Promise<ICourseMaterial[]> {
    const query: FilterQuery<ICourseMaterial> = {
      status: 'active',
      $or: [
        { type: 'study_material' },
        { 'assignmentDetails.assignedTo': studentId }
      ]
    };
    
    if (type) query.type = type;
    
    return await CourseMaterial.find(query)
      .populate('mentorId', 'fullName')
      .populate('subjectId', 'subjectName')
      .populate('sessionId')
      .sort({ createdAt: -1 });
  }

  async findBySubject(subjectId: string): Promise<ICourseMaterial[]> {
    return await CourseMaterial.find({ subjectId, status: 'active' })
      .populate('mentorId', 'fullName')
      .sort({ createdAt: -1 });
  }

  async findUpcomingAssignments(studentId: string, daysAhead: number): Promise<ICourseMaterial[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await CourseMaterial.find({
      type: 'assignment',
      status: 'active',
      'assignmentDetails.assignedTo': studentId,
      'assignmentDetails.dueDate': {
        $gte: now,
        $lte: futureDate
      }
    })
      .populate('mentorId', 'fullName')
      .populate('subjectId', 'subjectName')
      .sort({ 'assignmentDetails.dueDate': 1 });
  }

  async updateById(id: string, data: Partial<ICourseMaterial>): Promise<ICourseMaterial | null> {
    return await CourseMaterial.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await CourseMaterial.findByIdAndUpdate(
      id,
      { status: 'archived' },
      { new: true }
    );
    return !!result;
  }
}
