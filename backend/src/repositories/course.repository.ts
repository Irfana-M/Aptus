import type { CreateOneToOneCourseDto, ICourseRepository, CoursePaginatedResult } from "@/interfaces/repositories/ICourseRepository";
import { Course } from "@/models/course.model";
import { injectable } from "inversify";
import type { CoursePaginationParams } from "@/dto/shared/paginationTypes";
import { logger } from "@/utils/logger";

@injectable()
export class CourseRepository implements ICourseRepository {
  async findActiveConflict(params: {
    mentorId: string;
    dayOfWeek?: number;
    timeSlot?: string;
  }) {
    const query: any = {
      mentor: params.mentorId,
      status: { $in: ["booked", "ongoing"] },
      isActive: true,
    };

    // Only add only if provided
    if (params.dayOfWeek !== undefined) {
      query.dayOfWeek = params.dayOfWeek;
    }
    if (params.timeSlot) {
      query.timeSlot = params.timeSlot;
    }

    return await Course.findOne(query).lean();
  }

  async createOneToOneCourse(data: CreateOneToOneCourseDto) {
    // We trust the service to pass valid dayOfWeek/timeSlot
    const course = await Course.create({
      ...data,
      status: "available",
      maxStudents: 1,
      enrolledStudents: 0,
    });
    return course;
  }

  async getAllOneToOneCourses() {
    return await Course.find({ isActive: true })
      .populate("grade", "name syllabus")
      .populate("subject", "subjectName")
      .populate("mentor", "fullName profilePicture")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findAllCoursesPaginated(params: CoursePaginationParams): Promise<CoursePaginatedResult> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const search = params.search?.trim() || '';
    const status = params.status || '';
    const gradeId = params.gradeId || '';

    // Build query object
    const query: any = { isActive: true };

    // Status filter
    if (status) {
      query.status = status;
    }

    // Grade filter
    if (gradeId) {
      query.grade = gradeId;
    }

    logger.info(`findAllCoursesPaginated: Query=${JSON.stringify(query)}, search=${search}, page=${page}, limit=${limit}`);

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: "grades",
          localField: "grade",
          foreignField: "_id",
          as: "gradeDoc"
        }
      },
      { $unwind: { path: "$gradeDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subjectDoc"
        }
      },
      { $unwind: { path: "$subjectDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "mentor",
          foreignField: "_id",
          as: "mentorDoc"
        }
      },
      { $unwind: { path: "$mentorDoc", preserveNullAndEmptyArrays: true } },
    ];

    // Search filter (mentor name, subject name, grade name)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "mentorDoc.fullName": { $regex: search, $options: 'i' } },
            { "subjectDoc.subjectName": { $regex: search, $options: 'i' } },
            { "gradeDoc.name": { $regex: search, $options: 'i' } },
          ]
        }
      });
    }

    // Project to clean output
    pipeline.push({
      $project: {
        _id: 1,
        status: 1,
        dayOfWeek: 1,
        timeSlot: 1,
        startDate: 1,
        endDate: 1,
        fee: 1,
        maxStudents: 1,
        enrolledStudents: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        grade: {
          _id: "$gradeDoc._id",
          name: "$gradeDoc.name",
          syllabus: "$gradeDoc.syllabus"
        },
        subject: {
          _id: "$subjectDoc._id",
          subjectName: "$subjectDoc.subjectName"
        },
        mentor: {
          _id: "$mentorDoc._id",
          fullName: "$mentorDoc.fullName",
          profilePicture: "$mentorDoc.profilePicture"
        }
      }
    });

    // Sort and paginate
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const courses = await Course.aggregate(pipeline);

    // Count total (need to run a separate count query with same filters)
    let countQuery: any = { isActive: true };
    if (status) countQuery.status = status;
    if (gradeId) countQuery.grade = gradeId;
    
    let total: number;
    if (search) {
      // For search, we need to use aggregation to count
      const countPipeline: any[] = [
        { $match: countQuery },
        {
          $lookup: {
            from: "users",
            localField: "mentor",
            foreignField: "_id",
            as: "mentorDoc"
          }
        },
        { $unwind: { path: "$mentorDoc", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "subjects",
            localField: "subject",
            foreignField: "_id",
            as: "subjectDoc"
          }
        },
        { $unwind: { path: "$subjectDoc", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "grades",
            localField: "grade",
            foreignField: "_id",
            as: "gradeDoc"
          }
        },
        { $unwind: { path: "$gradeDoc", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { "mentorDoc.fullName": { $regex: search, $options: 'i' } },
              { "subjectDoc.subjectName": { $regex: search, $options: 'i' } },
              { "gradeDoc.name": { $regex: search, $options: 'i' } },
            ]
          }
        },
        { $count: "total" }
      ];
      const countResult = await Course.aggregate(countPipeline);
      total = countResult[0]?.total || 0;
    } else {
      total = await Course.countDocuments(countQuery);
    }

    logger.info(`findAllCoursesPaginated: Found ${courses.length} courses, total=${total}`);

    return {
      courses,
      total
    };
  }

  async findAvailableCourses(filters: any): Promise<any[]> {
    const query: any = {
      status: "available",
      isActive: true,
    };

    if (filters.gradeId) query.grade = filters.gradeId;
    if (filters.subjectId) query.subject = filters.subjectId;
    if (filters.dayOfWeek) query.dayOfWeek = Number(filters.dayOfWeek);
    if (filters.timeSlot) query.timeSlot = filters.timeSlot;
    // Note: 'syllabus' is not a direct field on Course usually, but maybe it is?
    // The controller was doing `if (syllabus) query.syllabus = syllabus;`
    // If it's on the Course model, we include it.
    if (filters.syllabus) query.syllabus = filters.syllabus; 

    return await Course.find(query)
      .populate("grade", "name syllabus")
      .populate("subject", "subjectName")
      .populate("mentor", "name fullName profilePicture")
      .sort({ startDate: 1 })
      .lean();
  }

  async findById(id: string): Promise<any | null> {
    return await Course.findById(id)
      .populate("grade")
      .populate("subject")
      .populate("mentor")
      .lean();
  }

  async updateCourseStatus(id: string, status: string, studentId?: string | null): Promise<void> {
    const update: any = { status };
    if (studentId !== undefined) {
      update.student = studentId;
    }
    await Course.findByIdAndUpdate(id, update);
  }
}