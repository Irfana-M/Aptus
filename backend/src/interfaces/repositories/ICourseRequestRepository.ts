export interface ICourseRequestRepository {
  create(data: unknown): Promise<unknown>;
  findAll(): Promise<unknown[]>;
  findByStudent(studentId: string): Promise<unknown[]>;
  updateStatus(id: string, status: string): Promise<unknown | null>;
}
