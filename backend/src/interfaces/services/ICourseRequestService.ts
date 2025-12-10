import type { CourseRequestDocument } from "../../models/courseRequest.model";

export interface ICourseRequestService {
  createRequest(studentId: string, data: any): Promise<CourseRequestDocument>;
  getAllRequests(): Promise<CourseRequestDocument[]>;
  getMyRequests(studentId: string): Promise<CourseRequestDocument[]>;
  updateStatus(id: string, status: string): Promise<CourseRequestDocument | null>;
}
