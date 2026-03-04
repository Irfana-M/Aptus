import { BaseRepository } from "./baseRepository.js";
import { CourseRequestModel } from "../models/courseRequest.model.js";
import type { CourseRequestDocument } from "../models/courseRequest.model.js";
import { injectable } from "inversify";
import type { ICourseRequestRepository } from "../interfaces/repositories/ICourseRequestRepository.js";

@injectable()
export class CourseRequestRepository extends BaseRepository<CourseRequestDocument> implements ICourseRequestRepository {
  constructor() {
    super(CourseRequestModel);
  }

  async findAll(): Promise<CourseRequestDocument[]> {
    return await CourseRequestModel.find()
      .populate('student', 'name email fullName') 
      .sort({ createdAt: -1 });
  }

  async findByStudent(studentId: string): Promise<CourseRequestDocument[]> {
    return await CourseRequestModel.find({ student: studentId })
      .sort({ createdAt: -1 });
  }

  async updateStatus(id: string, status: string): Promise<CourseRequestDocument | null> {
    return await CourseRequestModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }
}

