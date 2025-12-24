export interface ICourseService {
  getAvailableCourses(filters: unknown): Promise<unknown[]>;
  getCourseById(id: string): Promise<unknown | null>;
  getCoursesByStudent(studentId: string): Promise<unknown[]>;
}
