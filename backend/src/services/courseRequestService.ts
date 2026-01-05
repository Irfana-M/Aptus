import { injectable, inject } from "inversify";
import { TYPES } from "@/types";
import type { ICourseRequestRepository } from "@/interfaces/repositories/ICourseRequestRepository";
import type { ICourseRequestService } from "@/interfaces/services/ICourseRequestService";
import type { CourseRequestDocument } from "@/models/courseRequest.model";

import { InternalEventEmitter, EVENTS } from "@/utils/InternalEventEmitter";
import { logger } from "@/utils/logger";

@injectable()
export class CourseRequestService implements ICourseRequestService {
  constructor(
    @inject(TYPES.ICourseRequestRepository) private repository: ICourseRequestRepository,
    @inject(TYPES.InternalEventEmitter) private eventEmitter: InternalEventEmitter
  ) {}

  async createRequest(studentId: string, data: Record<string, unknown>) {
    return await this.repository.create({
      ...data,
      student: studentId,
      status: 'pending'
    }) as unknown as CourseRequestDocument;

    const request = await this.repository.create({
      ...data,
      student: studentId,
      status: 'pending'
    }) as unknown as CourseRequestDocument;

    // Emit event for Admin Notification
    this.eventEmitter.emit(EVENTS.COURSE_REQUEST_SUBMITTED, {
        requestId: request.id,
        studentId: studentId,
        subject: data.subject,
        grade: data.grade,
        mentoringMode: data.mentoringMode
    });
    
    logger.info(`[CourseRequestService] Emitted COURSE_REQUEST_SUBMITTED for ${request.id}`);

    return request;
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
