import { BaseRepository } from "./baseRepository";
import { Model, type FilterQuery, type PipelineStage, type UpdateQuery } from "mongoose";
import { Course, type ICourse } from "@/models/course.model";
import { injectable } from "inversify";
import type { ICourseRepository, CreateOneToOneCourseDto, CoursePaginatedResult } from "@/interfaces/repositories/ICourseRepository";
import type { CoursePaginationParams } from "@/dto/shared/paginationTypes";
import { logger } from "@/utils/logger";
import { getSignedFileUrl } from "@/utils/s3Upload";

@injectable()
export class CourseRepository extends BaseRepository<ICourse> implements ICourseRepository {
  constructor() {
    super(Course as unknown as Model<ICourse>);
  }
  async findActiveConflict(params: {
    mentorId: string;
    dayOfWeek?: number;
    timeSlot?: string;
  }) {
    const query: FilterQuery<ICourse> = {
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

  async createEnrollment(data: CreateOneToOneCourseDto) {
    // We trust the service to pass valid dayOfWeek/timeSlot
    const courseDoc = await Course.create({
      status: "available",
      maxStudents: 1,
      enrolledStudents: 0,
      ...data,
    });
    
    const course = await Course.findById(courseDoc._id)
      .populate("grade", "name syllabus")
      .populate("subject", "subjectName")
      .populate("mentor", "fullName profilePicture")
      .lean()
      .exec();

    if (course && course.mentor && (course.mentor as any).profilePicture) {
       try {
           const mentor = course.mentor as any;
           if (mentor.profilePicture.startsWith('http')) {
               mentor.profileImageUrl = mentor.profilePicture;
           } else {
               mentor.profileImageUrl = await getSignedFileUrl(mentor.profilePicture);
           }
       } catch (error) {
           logger.error(`Error signing URL in createEnrollment:`, error);
       }
    }
    
    return course as unknown as ICourse;
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
    const query: FilterQuery<ICourse> = { isActive: true };

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
    const pipeline: PipelineStage[] = [
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
          from: "mentors",
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
        dayOfWeek: "$schedule.days", // Map from schedule
        // If it's an array, maybe just take the first one or pass array? Frontend expects 'dayOfWeek' often as number or string. 
        // But backend model uses string[]. 
        // Let's pass 'schedule' as is and let frontend handle, OR map to old fields.
        // The table columns might expect 'dayOfWeek' and 'timeSlot'.
        timeSlot: "$schedule.timeSlot",
        schedule: 1, // Include full schedule
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
          profilePicture: "$mentorDoc.profilePicture",
          profileImageUrl: "$mentorDoc.profileImageUrl"
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
    
    // Sign URLs for mentor profile pictures
    const coursesWithSignedUrls = await Promise.all(
      courses.map(async (course: any) => {
        if (course.mentor && course.mentor.profilePicture) {
          try {
            if (course.mentor.profilePicture.startsWith('http')) {
              course.mentor.profileImageUrl = course.mentor.profilePicture;
            } else {
              course.mentor.profileImageUrl = await getSignedFileUrl(course.mentor.profilePicture);
            }
          } catch (error) {
            logger.error(`Error signing URL for mentor in course result ${course.mentor._id}:`, error);
            course.mentor.profileImageUrl = null;
          }
        }
        return course;
      })
    );

    // Count total (need to run a separate count query with same filters)
    const countQuery: FilterQuery<ICourse> = { isActive: true };
    if (status) countQuery.status = status;
    if (gradeId) countQuery.grade = gradeId;
    
    let total: number;
    if (search) {
      // For search, we need to use aggregation to count
      const countPipeline: PipelineStage[] = [
        { $match: countQuery },
        {
          $lookup: {
            from: "mentors",
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
      courses: coursesWithSignedUrls,
      total
    };
  }

  async findAvailableCourses(filters: Record<string, unknown>): Promise<ICourse[]> {
    const query: FilterQuery<ICourse> = {
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
      .populate("mentor", "name fullName profilePicture profileImageUrl")
      .sort({ startDate: 1 })
      .lean();
  }

  async findById(id: string): Promise<ICourse | null> {
    return await Course.findById(id)
      .populate("grade")
      .populate("subject")
      .populate("mentor")
      .lean();
  }

  async updateCourseStatus(id: string, status: string, studentId?: string | null): Promise<void> {
    const update: UpdateQuery<ICourse> = { status };
    if (studentId !== undefined) {
      update.student = studentId;
    }
    await Course.findByIdAndUpdate(id, update);
  }

  async updateCourse(id: string, data: Partial<CreateOneToOneCourseDto>): Promise<ICourse | null> {
    const updated = await Course.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    )
    .populate("grade", "name syllabus")
    .populate("subject", "subjectName")
    .populate("mentor", "fullName profilePicture")
    .lean()
    .exec();

    if (updated && updated.mentor && (updated.mentor as any).profilePicture) {
        try {
            const mentor = updated.mentor as any;
            if (mentor.profilePicture.startsWith('http')) {
                mentor.profileImageUrl = mentor.profilePicture;
            } else {
                mentor.profileImageUrl = await getSignedFileUrl(mentor.profilePicture);
            }
        } catch (error) {
            logger.error(`Error signing URL in updateCourse:`, error);
        }
    }

    return updated as unknown as ICourse;
  }

  async findByStudent(studentId: string): Promise<ICourse[]> {
    return await Course.find({ student: studentId, isActive: true })
      .populate("grade", "name grade syllabus")
      .populate("subject", "name subjectName")
      .populate("mentor", "fullName profilePicture profileImageUrl email")
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByMentor(mentorId: string): Promise<ICourse[]> {
    return await Course.find({ mentor: mentorId, isActive: true })
      .populate("grade", "name grade syllabus")
      .populate("subject", "name subjectName")
      .populate("student", "fullName profilePicture email phoneNumber")
      .sort({ createdAt: -1 })
      .lean();
  }
}