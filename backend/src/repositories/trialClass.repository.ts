import { injectable } from "inversify";
import { TrialClass, type ITrialClassDocument } from "@/models/student/trialClass.model.js";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository.js";
import { logger } from "@/utils/logger.js";
import { Types, type FilterQuery, type UpdateQuery } from "mongoose";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { AppError } from "@/utils/AppError.js";
import { getPaginationParams } from "@/utils/pagination.util.js";

import { BaseRepository } from "./baseRepository.js";

@injectable()
export class TrialClassRepository extends BaseRepository<ITrialClassDocument> implements ITrialClassRepository {
  constructor() {
    super(TrialClass);
  }

  
  async createTrialRequest(data: {
    student: string;
    subject: string;
    preferredDate: Date;
    preferredTime: string;
    status?: "requested" | "assigned" | "completed" | "cancelled";
  }): Promise<ITrialClassDocument> {
    logger.info("Creating new trial class request");

    const trialClass = new TrialClass({
      student: new Types.ObjectId(data.student),
      subject: new Types.ObjectId(data.subject),
      preferredDate: data.preferredDate,
      preferredTime: data.preferredTime,
      status: data.status || "requested",
    });

    const saved = await trialClass.save();
    return saved;
  }

  // FIND BY ID (with populate)
  async findById(id: string): Promise<ITrialClassDocument | null> {
    return await TrialClass.findById(id)
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate({
        path: "subject",
        select: "subjectName syllabus grade",
        populate: {
          path: "grade",
          select: "name grade syllabus"
        }
      })
      .populate("mentor", "fullName email")
      .exec();
  }

  // FIND BY STUDENT
  async findByStudentId(studentId: string, status?: string): Promise<ITrialClassDocument[]> {
    const query: FilterQuery<ITrialClassDocument> = { student: new Types.ObjectId(studentId) };
    if (status) query.status = status;

    return await TrialClass.find(query)
      .populate("student", "fullName email phoneNumber")
      .populate({
        path: "subject",
        select: "subjectName syllabus grade",
        populate: {
          path: "grade",
          select: "name grade syllabus"
        }
      })
      .populate("mentor", "fullName email")
      .sort({ createdAt: -1 })
      .exec();
  }

  // FIND BY MENTOR (ALL)
  async findByMentorId(mentorId: string): Promise<ITrialClassDocument[]> {
    return await TrialClass.find({ mentor: new Types.ObjectId(mentorId) })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate({
        path: "subject",
        select: "subjectName syllabus grade",
        populate: {
          path: "grade",
          select: "name grade syllabus"
        }
      })
      .sort({ preferredDate: 1, preferredTime: 1 })
      .exec();
  }

  // FIND TODAY'S SESSIONS FOR MENTOR ← This is the key method
  async findTodayTrialClasses(mentorId: string): Promise<ITrialClassDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await TrialClass.find({
      mentor: new Types.ObjectId(mentorId),
      preferredDate: { $gte: today, $lt: tomorrow },
      status: "assigned"
    })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate({
        path: "subject",
        select: "subjectName syllabus grade",
        populate: {
          path: "grade",
          select: "name grade syllabus"
        }
      })
      .sort({ preferredTime: 1 })
      .exec();
  }

  // UPDATE
  async updateTrial(id: string, updates: Partial<ITrialClassDocument>): Promise<ITrialClassDocument | null> {
    const updateData: UpdateQuery<ITrialClassDocument> = { ...updates };

    if (updates.mentor && typeof updates.mentor === "string") {
      updateData.mentor = new Types.ObjectId(updates.mentor);
    }

    return await TrialClass.findByIdAndUpdate(id, updateData, { new: true })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate({
        path: "subject",
        select: "subjectName syllabus grade",
        populate: {
          path: "grade",
          select: "name grade syllabus"
        }
      })
      .populate("mentor", "fullName email")
      .exec();
  }

  // DELETE
  async deleteTrial(id: string): Promise<boolean> {
    const result = await TrialClass.findByIdAndDelete(id);
    return !!result;
  }

  // ASSIGN MENTOR
  async assignMentor(
    trialClassId: string,
    mentorId: string,
    updates: Partial<ITrialClassDocument> = {}
  ): Promise<ITrialClassDocument | null> {
    const updateData = {
      mentor: new Types.ObjectId(mentorId),
      status: "assigned" as const,
      ...updates,
    };

    return await TrialClass.findByIdAndUpdate(trialClassId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate({
        path: "subject",
        select: "subjectName syllabus grade",
        populate: {
          path: "grade",
          select: "name grade syllabus"
        }
      })
      .populate("mentor", "fullName email")
      .exec();
  }

  // UPDATE STATUS (cancelled, completed, etc.)
  async updateStatus(
    trialClassId: string,
    status: "requested" | "assigned" | "completed" | "cancelled",
    reason?: string
  ): Promise<ITrialClassDocument | null> {
    const updateData: UpdateQuery<ITrialClassDocument> = { status };
    if (reason && status === "cancelled") {
      updateData.cancellationReason = reason;
    }

    return await TrialClass.findByIdAndUpdate(trialClassId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("student", "fullName email phoneNumber profilePicture")
      .populate({
        path: "subject",
        select: "subjectName syllabus grade",
        populate: {
          path: "grade",
          select: "name grade syllabus"
        }
      })
      .populate("mentor", "fullName email")
      .exec();
  }

  // STATS
  async getStudentTrialStats(studentId: string): Promise<{ total: number; pending: number }> {
    const [total, pending] = await Promise.all([
      TrialClass.countDocuments({ student: new Types.ObjectId(studentId) }),
      TrialClass.countDocuments({
        student: new Types.ObjectId(studentId),
        status: { $in: ["requested", "assigned"] },
      }),
    ]);

    return { total, pending };
  }

  // PAGINATED FIND ALL
  async findAllPaginated(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ trialClasses: ITrialClassDocument[]; total: number }> {
    const { page: _page, limit, skip } = getPaginationParams(filters);
    const status = filters.status;
    const query: FilterQuery<ITrialClassDocument> = status ? { status } : {};

    const [trialClasses, total] = await Promise.all([
      TrialClass.find(query)
        .populate("student", "fullName email phoneNumber")
        .populate({
          path: "subject",
          select: "subjectName syllabus grade",
          populate: {
            path: "grade",
            select: "name grade syllabus"
          }
        })
        .populate("mentor", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      TrialClass.countDocuments(query),
    ]);

    return { trialClasses, total };
  }


  async findByStatus(status: string, page: number = 1, limit: number = 10): Promise<{ trialClasses: ITrialClassDocument[]; total: number }> {
    try {
      const { page: p, limit: l, skip } = getPaginationParams({ page, limit });
      logger.info(`TrialClassRepository: Fetching trial classes with status - ${status}`, { page: p, limit: l });

      const [trialClasses, total] = await Promise.all([
        TrialClass.find({ status })
          .populate("student", "fullName email phoneNumber")
          .populate({
            path: "subject",
            select: "subjectName syllabus grade",
            populate: {
              path: "grade",
              select: "name grade syllabus"
            }
          })
          .populate("mentor", "fullName email expertise")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(l)
          .exec(),
        TrialClass.countDocuments({ status })
      ]);

      logger.info(`TrialClassRepository: Found ${trialClasses.length} trial classes with status ${status}`);
      
      return { trialClasses, total: total };
    } catch (error) {
      logger.error(`TrialClassRepository: Error fetching trial classes with status ${status}`, error);
      throw new AppError(
        "Failed to fetch trial classes by status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
  async findCompletedByMentorAndDateRange(mentorId: string, startDate: Date, endDate: Date): Promise<ITrialClassDocument[]> {
    return await TrialClass.find({
      mentor: new Types.ObjectId(mentorId),
      preferredDate: { $gte: startDate, $lte: endDate },
      status: "completed"
    }).exec();
  }

  async aggregate(pipeline: unknown[]): Promise<unknown[]> {
    return await TrialClass.aggregate(pipeline as any[]).exec();
  }

  async countDocuments(filter: FilterQuery<ITrialClassDocument>): Promise<number> {
    return await TrialClass.countDocuments(filter).exec();
  }
}