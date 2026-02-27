import type { IMaterialSubmission } from '../../models/materialSubmission.model';

export interface IMaterialSubmissionRepository {
  create(data: Partial<IMaterialSubmission>): Promise<IMaterialSubmission>;
  findById(id: string): Promise<IMaterialSubmission | null>;
  findByMaterial(materialId: string): Promise<IMaterialSubmission[]>;
  findByStudent(studentId: string): Promise<IMaterialSubmission[]>;
  findByMaterialAndStudent(materialId: string, studentId: string): Promise<IMaterialSubmission | null>;
  updateById(id: string, data: Partial<IMaterialSubmission>): Promise<IMaterialSubmission | null>;
  deleteById(id: string): Promise<boolean>;
}
