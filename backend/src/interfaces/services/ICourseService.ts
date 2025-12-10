export interface ICourseService {
  getAvailableCourses(filters: any): Promise<any[]>;
  getCourseById(id: string): Promise<any | null>;
}
