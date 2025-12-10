export interface ICourseRequestRepository {
  create(data: any): Promise<any>;
  findAll(): Promise<any[]>;
  findByStudent(studentId: string): Promise<any[]>;
  updateStatus(id: string, status: string): Promise<any | null>;
}
