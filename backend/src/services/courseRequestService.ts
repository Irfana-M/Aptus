import { injectable, inject } from "inversify";
import { TYPES } from "@/types";
import type { ICourseRequestRepository } from "@/interfaces/repositories/ICourseRequestRepository";
import type { ICourseRequestService } from "@/interfaces/services/ICourseRequestService";
import type { CourseRequestDocument } from "@/models/courseRequest.model";

@injectable()
export class CourseRequestService implements ICourseRequestService {
  constructor(
    @inject(TYPES.CourseRequestRepository) private repository: ICourseRequestRepository
  ) {}

  async createRequest(studentId: string, data: Record<string, unknown>) {
    return await this.repository.create({
      ...data,
      student: studentId,
      status: 'pending'
    }) as unknown as CourseRequestDocument;
  }

  async getAllRequests() {
    return await this.repository.findAll() as unknown as CourseRequestDocument[];
  }

  async getMyRequests(studentId: string) {
    return await this.repository.findByStudent(studentId) as unknown as CourseRequestDocument[];
  }

  async updateStatus(id: string, status: string) {
    if (!['pending', 'reviewed', 'fulfilled', 'approved', 'rejected'].includes(status)) {
        throw new Error("Invalid status");
    }
    return await this.repository.updateStatus(id, status) as unknown as CourseRequestDocument;
  }
}
