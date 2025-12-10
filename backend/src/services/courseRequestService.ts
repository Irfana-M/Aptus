import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { ICourseRequestRepository } from "../interfaces/repositories/ICourseRequestRepository";
import type { ICourseRequestService } from "../interfaces/services/ICourseRequestService";

@injectable()
export class CourseRequestService implements ICourseRequestService {
  constructor(
    @inject(TYPES.CourseRequestRepository) private repository: ICourseRequestRepository
  ) {}

  async createRequest(studentId: string, data: any) {
    return await this.repository.create({
      ...data,
      student: studentId,
      status: 'pending'
    });
  }

  async getAllRequests() {
    return await this.repository.findAll();
  }

  async getMyRequests(studentId: string) {
    return await this.repository.findByStudent(studentId);
  }

  async updateStatus(id: string, status: string) {
    if (!['pending', 'reviewed', 'fulfilled'].includes(status)) {
        throw new Error("Invalid status");
    }
    return await this.repository.updateStatus(id, status);
  }
}

