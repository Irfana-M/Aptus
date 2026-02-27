import type { CourseRequestDocument } from "../../models/courseRequest.model";
import type { PaginationParams, PaginatedResponse } from "@/dtos/shared/paginationTypes";

export interface ICourseRequestService {
  createRequest(studentId: string, data: Record<string, unknown>): Promise<CourseRequestDocument>;
  getAllRequests(): Promise<CourseRequestDocument[]>;
  getAllRequestsPaginated(params: PaginationParams): Promise<PaginatedResponse<CourseRequestDocument>>;
  getMyRequests(studentId: string): Promise<CourseRequestDocument[]>;
  updateStatus(id: string, status: string): Promise<CourseRequestDocument | null>;
}
