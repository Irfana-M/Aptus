import type { ICourseMaterial } from '../../models/courseMaterial.model';

export interface ICourseMaterialRepository {
  create(data: Partial<ICourseMaterial>): Promise<ICourseMaterial>;
  findById(id: string): Promise<ICourseMaterial | null>;
  findByMentor(mentorId: string, type?: 'study_material' | 'assignment'): Promise<ICourseMaterial[]>;
  findByStudent(studentId: string, type?: 'study_material' | 'assignment'): Promise<ICourseMaterial[]>;
  findBySubject(subjectId: string): Promise<ICourseMaterial[]>;
  findUpcomingAssignments(studentId: string, daysAhead: number): Promise<ICourseMaterial[]>;
  updateById(id: string, data: Partial<ICourseMaterial>): Promise<ICourseMaterial | null>;
  deleteById(id: string): Promise<boolean>;
}
