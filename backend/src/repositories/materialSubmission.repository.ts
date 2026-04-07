import { injectable } from 'inversify';
import { MaterialSubmission, type IMaterialSubmission } from '../models/materialSubmission.model';
import type { IMaterialSubmissionRepository } from '../interfaces/repositories/IMaterialSubmissionRepository';

@injectable()
export class MaterialSubmissionRepository implements IMaterialSubmissionRepository {
  async create(data: Partial<IMaterialSubmission>): Promise<IMaterialSubmission> {
    const submission = new MaterialSubmission(data);
    return await submission.save();
  }

  async findById(id: string): Promise<IMaterialSubmission | null> {
    return await MaterialSubmission.findById(id)
      .populate('materialId')
      .populate('studentId', 'fullName email');
  }

  async findByMaterial(materialId: string): Promise<IMaterialSubmission[]> {
    return await MaterialSubmission.find({ materialId })
      .populate('studentId', 'fullName email')
      .sort({ submittedAt: -1 });
  }

  async findByStudent(studentId: string): Promise<IMaterialSubmission[]> {
    return await MaterialSubmission.find({ studentId })
      .populate('materialId')
      .sort({ submittedAt: -1 });
  }

  async findByMaterialAndStudent(materialId: string, studentId: string): Promise<IMaterialSubmission | null> {
    return await MaterialSubmission.findOne({ materialId, studentId })
      .populate('materialId');
  }

  async updateById(id: string, data: Partial<IMaterialSubmission>): Promise<IMaterialSubmission | null> {
    return await MaterialSubmission.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await MaterialSubmission.findByIdAndDelete(id);
    return !!result;
  }
}
