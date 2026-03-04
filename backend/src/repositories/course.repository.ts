import { BaseRepository } from "./baseRepository.js";
import { Model, type FilterQuery, type PipelineStage, type UpdateQuery } from "mongoose";
import { Course, type ICourse } from "@/models/course.model.js";
import { Enrollment } from "@/models/enrollment.model.js";
import { injectable } from "inversify";
import type { ICourseRepository, CreateOneToOneCourseDto, CoursePaginatedResult } from "@/interfaces/repositories/ICourseRepository.js";
import type { CoursePaginationParams } from "@/dtos/shared/paginationTypes.js";
import { logger } from "@/utils/logger.js";
import { getSignedFileUrl } from "@/utils/s3Upload.js";
import { getPaginationParams } from "@/utils/pagination.util.js";
import type { ClientSession } from "mongoose";

import { AppError } from "@/utils/AppError.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";


interface PopulatedMentor {
  _id: unknown;
  fullName?: string;
  profilePicture?: string;
  profileImageUrl?: string;
}

// Type for populated student
interface PopulatedStudent {
  _id: unknown;
  fullName?: string;
  email?: string;
  profileImage?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
}

interface PopulatedCourse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any;
  courseType?: string;
  subject?: {
    grade?: string;
    subjectName?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  grade?: {
    name?: string;
    grade?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  mentor?: PopulatedMentor;
  student?: PopulatedStudent;
  students?: PopulatedStudent[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

@injectable()
export class CourseRepository extends BaseRepository<ICourse> implements ICourseRepository {
  constructor() {
    super(Course as unknown as Model<ICourse>);
  }
  async findMatchingGroupCourse(params: {
    mentorId: string;
    subjectId: string;
    gradeId: string;
    days: string[];
    timeSlot: string;
  }): Promise<ICourse | null> {
    const { mentorId, subjectId, gradeId, days, timeSlot } = params;
    
    // We want to find a group course that:
    // 1. Is taught by the same mentor
    // 2. Is for the same subject and grade
    // 3. Is a group course
    // 4. Is active and not cancelled/completed
    // 5. Matches the schedule (same time slot and includes the requested day)
    
    // Note: 'days' in params might be ["Monday"] but course.schedule.days might be ["Monday", "Wednesday"]
    // We check if the requested day(s) are present in the course's schedule.
    
    return await Course.findOne({
      mentor: mentorId,
      subject: subjectId,
      grade: gradeId,
      courseType: "group",
      isActive: true,
      status: { $in: ["available", "booked", "ongoing"] },
      "schedule.timeSlot": timeSlot,
      "schedule.days": { $in: days } // At least one of the requested days must match
    }).lean() as unknown as ICourse;
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

  async createEnrollment(data: CreateOneToOneCourseDto, session?: ClientSession) {
    // We trust the service to pass valid dayOfWeek/timeSlot
    const result = await Course.create([{
      courseType: "one-to-one",
      maxStudents: data.courseType === 'group' ? 10 : 1,
      enrolledStudents: 0,
      status: "available",
      ...data,
    }], { session });

    const courseDoc = result[0];
    if (!courseDoc) throw new AppError("Failed to create enrollment", HttpStatusCode.BAD_REQUEST);
    
    const course = await Course.findById(courseDoc._id)
      .session(session || null)
      .populate("grade", "name syllabus")
      .populate("subject", "subjectName")
      .populate("mentor", "fullName profilePicture")
      .lean()
      .exec();

    if (course && course.mentor && (course.mentor as PopulatedMentor).profilePicture) {
       try {
           const mentor = course.mentor as PopulatedMentor;
           if (mentor.profilePicture?.startsWith('http')) {
               mentor.profileImageUrl = mentor.profilePicture;
           } else if (mentor.profilePicture) {
               mentor.profileImageUrl = await getSignedFileUrl(mentor.profilePicture);
           }
       } catch (error) {
           logger.error(`Error signing URL in createEnrollment:`, error);
       }
    }
    
    return course as unknown as ICourse;
  }

  async getAllOneToOneCourses() {
    const courses = await Course.find({ isActive: true })
      .populate("grade", "name grade syllabus")
      .populate("subject", "subjectName grade")
      .populate("mentor", "fullName profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    for (const courseDoc of courses) {
      const course = courseDoc as unknown as PopulatedCourse;
      if (course.subject && !course.subject.grade && course.grade) {
          course.subject.grade = course.grade.name || course.grade.grade || 'N/A';
      }
    }

    return courses as unknown as ICourse[];
  }

  // Refactor CourseRepository
  async findAllCoursesPaginated(params: CoursePaginationParams): Promise<CoursePaginatedResult> {
    try {
      // Cast to Record<string, unknown> to satisfy getPaginationParams' index signature requirement
      const { page, limit, skip } = getPaginationParams(params as unknown as Record<string, unknown>);
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
        {
          $lookup: {
            from: "students",
            localField: "student",
            foreignField: "_id",
            as: "singleStudentDoc"
          }
        },
        { $unwind: { path: "$singleStudentDoc", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "enrollments",
            let: { currentCourseId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$course", "$$currentCourseId"] }, status: "active" } },
              {
                $lookup: {
                  from: "students",
                  localField: "student",
                  foreignField: "_id",
                  as: "studentInfo"
                }
              },
              { $unwind: "$studentInfo" },
              {
                $project: {
                  _id: "$studentInfo._id",
                  fullName: "$studentInfo.fullName",
                  email: "$studentInfo.email",
                  profileImage: "$studentInfo.profileImage"
                }
              }
            ],
            as: "enrolledList"
          }
        }
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
          courseType: 1,
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
            subjectName: "$subjectDoc.subjectName",
            grade: "$gradeDoc.name"
          },
          mentor: {
            _id: "$mentorDoc._id",
            fullName: "$mentorDoc.fullName",
            profilePicture: "$mentorDoc.profilePicture",
            profileImageUrl: "$mentorDoc.profileImageUrl"
          },
          student: {
            _id: "$singleStudentDoc._id",
            fullName: "$singleStudentDoc.fullName",
            email: "$singleStudentDoc.email",
            profileImage: "$singleStudentDoc.profileImage"
          },
          enrolledStudentsList: "$enrolledList"
        }
      });

      // Sort and paginate
      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      );

      const courses = await Course.aggregate(pipeline) as unknown[];
      
      // Sign URLs for mentor profile pictures
      const coursesWithSignedUrls = await Promise.all(
        courses.map(async (course: unknown) => {
          const c = course as Record<string, unknown>;
          if (c.mentor && typeof c.mentor === 'object' && c.mentor !== null) {
            const mentor = c.mentor as Record<string, unknown>;
            if (mentor.profilePicture) {
            try {
              if (typeof mentor.profilePicture === 'string' && mentor.profilePicture.startsWith('http')) {
                mentor.profileImageUrl = mentor.profilePicture;
              } else {
                mentor.profileImageUrl = await getSignedFileUrl(mentor.profilePicture as string);
              }
            } catch (error) {
              logger.error(`Error signing URL for mentor in course result:`, error);
              mentor.profileImageUrl = null;
            }
            }
          }
          
          // Sign URLs for all enrolled students
          if (Array.isArray(c.enrolledStudentsList)) {
            c.enrolledStudentsList = await Promise.all(
              (c.enrolledStudentsList as unknown[]).map(async (student: unknown) => {
                const s = student as Record<string, unknown>;
                if (s.profileImage && typeof s.profileImage === 'string') {
                  try {
                    if (s.profileImage.startsWith('http')) {
                      s.profileImageUrl = s.profileImage;
                    } else {
                      s.profileImageUrl = await getSignedFileUrl(s.profileImage);
                    }
                  } catch (error) {
                    logger.error(`Error signing URL for student in list:`, error);
                    s.profileImageUrl = null;
                  }
                }
                return s;
              })
            );
          }
          
          // Sign URL for single student for backward compatibility
          if (c.student && typeof c.student === 'object' && c.student !== null) {
            const student = c.student as Record<string, unknown>;
            if (student.profileImage && typeof student.profileImage === 'string') {
            try {
              if (student.profileImage.startsWith('http')) {
                student.profileImageUrl = student.profileImage;
              } else {
                student.profileImageUrl = await getSignedFileUrl(student.profileImage);
              }
            } catch (error) {
              logger.error(`Error signing URL for single student:`, error);
              student.profileImageUrl = null;
            }
            }
          }

          return c;
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
        courses: coursesWithSignedUrls as unknown as ICourse[],
        total
      };
    } catch (error) {
      logger.error(`Error in findAllCoursesPaginated:`, error);
      throw error;
    }
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

    const courses = await Course.find(query)
      .populate("grade", "name syllabus grade")
      .populate("subject", "subjectName grade")
      .sort({ startDate: 1 })
      .lean();

    // Map grade into subject for frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const course of courses as any[]) {
      if (course.subject && !course.subject.grade && course.grade) {
        course.subject.grade = course.grade.name || course.grade.grade || 'N/A';
      }
    }

    return courses as unknown as ICourse[];
  }

  async findById(id: string, session?: ClientSession): Promise<ICourse | null> {
    const course = await Course.findById(id)
      .session(session || null)
      .populate("grade")
      .populate("subject")
      .populate("mentor")
      .lean();

    if (course) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = course as any;
      if (c.subject && !c.subject.grade && c.grade) {
        c.subject.grade = c.grade.name || c.grade.grade || 'N/A';
      }
    }

    return course as unknown as ICourse;
  }

  async updateCourseStatus(id: string, status: string, studentId?: string | null): Promise<void> {
    const update: UpdateQuery<ICourse> = { status };
    if (studentId !== undefined) {
      update.student = studentId;
    }
    await Course.findByIdAndUpdate(id, update);
  }

  async updateCourse(id: string, data: Partial<CreateOneToOneCourseDto>, session?: ClientSession): Promise<ICourse | null> {
    const updated = await Course.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, session: session || null }
    )
    .populate("grade", "name syllabus")
    .populate("subject", "subjectName")
    .populate("mentor", "fullName profilePicture")
    .lean()
    .exec();

    if (updated && updated.mentor && (updated.mentor as PopulatedMentor).profilePicture) {
        try {
            const mentor = updated.mentor as PopulatedMentor;
            if (mentor.profilePicture?.startsWith('http')) {
                mentor.profileImageUrl = mentor.profilePicture;
            } else if (mentor.profilePicture) {
                mentor.profileImageUrl = await getSignedFileUrl(mentor.profilePicture);
            }
        } catch (error) {
            logger.error(`Error signing URL in updateCourse:`, error);
        }
    }

    return updated as unknown as ICourse;
  }

  async findByStudent(studentId: string): Promise<ICourse[]> {
    // 1. Find directly assigned courses (one-to-one)
    const directCourses = await Course.find({ student: studentId, isActive: true })
      .populate("grade", "name grade syllabus")
      .populate("subject", "name subjectName grade")
      .populate("mentor", "fullName profilePicture profileImageUrl email")
      .sort({ createdAt: -1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const course of directCourses as any[]) {
      if (course.subject && !course.subject.grade && course.grade) {
        course.subject.grade = course.grade.name || course.grade.grade || 'N/A';
      }
    }

    // 2. Find courses from group enrollments
    const enrollments = await Enrollment.find({ student: studentId, status: "active" })
      .select("course")
      .lean();
    
    const enrollmentCourseIds = enrollments.map(e => e.course);
    
    const groupCourses = enrollmentCourseIds.length > 0 
      ? await Course.find({ _id: { $in: enrollmentCourseIds }, isActive: true })
        .populate("grade", "name grade syllabus")
        .populate("subject", "name subjectName grade")
        .populate("mentor", "fullName profilePicture profileImageUrl email")
        .sort({ createdAt: -1 })
        .lean()
      : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const course of groupCourses as any[]) {
      if (course.subject && !course.subject.grade && course.grade) {
        course.subject.grade = course.grade.name || course.grade.grade || 'N/A';
      }
    }

    // Combine and deduplicate just in case
    const allCourses = [...directCourses, ...groupCourses];
    const uniqueCourses = Array.from(new Map(allCourses.map(c => [c._id.toString(), c])).values());

    return uniqueCourses as unknown as ICourse[];
  }

  async findByMentor(mentorId: string): Promise<unknown[]> {
    const courses = await Course.find({ mentor: mentorId, isActive: true })
      .populate("grade", "name grade syllabus")
      .populate("subject", "name subjectName")
      .populate("student", "fullName profileImage email phoneNumber")
      .populate("students", "fullName profileImage email phoneNumber")
      .sort({ createdAt: -1 })
      .lean();

    const flattenedResults: unknown[] = [];

    for (const courseDoc of courses) {
      const course = courseDoc as unknown as PopulatedCourse;
      // Ensure subject.grade is populated from course.grade for consistency
      if (course.subject && !course.subject.grade && course.grade) {
          course.subject.grade = course.grade.name || course.grade.grade || 'N/A';
      }

      // Sign URLs for students in the students array (for group courses)
      if (Array.isArray(course.students)) {
        for (const student of course.students) {
          if (student && student.profileImage) {
            try {
              if (student.profileImage.startsWith("http")) {
                student.profileImageUrl = student.profileImage;
              } else {
                student.profileImageUrl = await getSignedFileUrl(student.profileImage);
              }
            } catch (error) {
              logger.error(`Error signing URL for student in list:`, error);
            }
          }
        }
      }

      const enrollments = await Enrollment.find({
        course: course._id,
        status: "active",
      })
        .populate("student", "fullName profileImage email phoneNumber")
        .lean();

      if (enrollments.length > 0) {
        for (const enrollment of enrollments) {
          const student = enrollment.student as PopulatedStudent;

          if (student && student.profileImage) {
            try {
              if (student.profileImage.startsWith("http")) {
                student.profileImageUrl = student.profileImage;
              } else {
                student.profileImageUrl = await getSignedFileUrl(student.profileImage);
              }
            } catch (error) {
              logger.error(`Error signing student URL in findByMentor:`, error);
            }
          }

          flattenedResults.push({
            ...course,
            // Use unique ID for frontend mapping if it's a true group course or Multiple enrollments
            _id: course.courseType === 'group' || enrollments.length > 1 
                 ? `${course._id}_${student?._id || enrollment._id}` 
                 : course._id, 
            originalCourseId: course._id,
            student: student || course.student || null,
          });
        }
      } else {
        // No active enrollments record found in Enrollment collection
        // Fallback to the student directly attached to the course (for legacy or direct 1:1)
        const student = course.student as PopulatedStudent;
        if (student && student.profileImage) {
          try {
            if (student.profileImage.startsWith("http")) {
              student.profileImageUrl = student.profileImage;
            } else {
              student.profileImageUrl = await getSignedFileUrl(student.profileImage);
            }
          } catch (error) {
            logger.error(`Error signing student URL in findByMentor (fallback):`, error);
          }
        }
        flattenedResults.push(course);
      }
    }

    return flattenedResults;
  }

  // New method: Get only one-to-one courses for a mentor
  async findOneToOneByMentor(mentorId: string): Promise<unknown[]> {
    const courses = await Course.find({ 
      mentor: mentorId, 
      isActive: true,
      courseType: 'one-to-one'
    })
      .populate("grade", "name grade syllabus")
      .populate("subject", "name subjectName")
      .populate("student", "fullName profileImage email phoneNumber")
      .sort({ createdAt: -1 })
      .lean();

    // Sign URLs for student profile images
    for (const courseDoc of courses) {
      const course = courseDoc as any;
      // Ensure subject.grade is populated from course.grade for consistency
      if (course.subject && !course.subject.grade && course.grade) {
          course.subject.grade = course.grade.name || course.grade.grade || 'N/A';
      }

      const student = course.student as PopulatedStudent;
      if (student && student.profileImage) {
        try {
          if (student.profileImage.startsWith("http")) {
            student.profileImageUrl = student.profileImage;
          } else {
            student.profileImageUrl = await getSignedFileUrl(student.profileImage);
          }
        } catch (error) {
          logger.error(`Error signing student URL in findOneToOneByMentor:`, error);
        }
      }
    }

    return courses;
  }

  // New method: Get only group courses (batches) for a mentor
  async findGroupBatchesByMentor(mentorId: string): Promise<unknown[]> {
    const courses = (await Course.find({ 
      mentor: mentorId, 
      isActive: true,
      courseType: 'group'
    })
      .populate("grade", "name grade syllabus")
      .populate("subject", "name subjectName")
      .populate("students", "fullName profileImage email phoneNumber")
      .sort({ createdAt: -1 })
      .lean()) as unknown[];
    
    // Sign URLs for all students in each batch
    for (const _batchCourse of (courses as Record<string, unknown>[])) {
      // Ensure subject.grade is populated from course.grade for consistency
      const subject = _batchCourse["subject"] as Record<string, unknown> | undefined;
      const grade = _batchCourse["grade"] as Record<string, unknown> | undefined;
      if (subject && subject["grade"] === undefined && grade) {
          subject["grade"] = grade["name"] || grade["grade"] || 'N/A';
      }
      
      const students = _batchCourse["students"] as PopulatedStudent[] | undefined;
      if (Array.isArray(students)) {
        for (const student of students) {
          if (student && student.profileImage) {
            try {
              if (student.profileImage.startsWith("http")) {
                student.profileImageUrl = student.profileImage;
              } else {
                student.profileImageUrl = await getSignedFileUrl(student.profileImage);
              }
            } catch (error) {
              logger.error(`Error signing student URL in findGroupBatchesByMentor:`, error);
            }
          }
        }
      }
    }

    return courses;
  }

  async findActiveCoursesByMentor(mentorId: string): Promise<ICourse[]> {
    return await this.model.find({ 
      mentor: mentorId, 
      isActive: true,
      status: { $in: ['available', 'booked', 'ongoing'] }
    }).lean() as unknown as ICourse[];
  }
}