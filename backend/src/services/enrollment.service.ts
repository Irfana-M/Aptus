import { injectable, inject } from "inversify";
import { Types } from "mongoose";
import type { IEnrollment } from "../models/enrollment.model.js";
import { logger } from "../utils/logger.js";
import { getErrorMessage } from "../utils/errorUtils.js";
import { TYPES } from "../types.js";
import type { IEnrollmentRepository } from "../interfaces/repositories/IEnrollmentRepository.js";
import type { IEnrollmentLinkRepository } from "../interfaces/repositories/IEnrollmentLinkRepository.js";
import type { ICourseRepository } from "../interfaces/repositories/ICourseRepository.js";
import type { IEnrollmentService } from "../interfaces/services/IEnrollmentService.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { PaginationParams, PaginatedResponse } from "@/dtos/shared/paginationTypes.js";
import { formatPaginatedResult, getPaginationParams } from "@/utils/pagination.util.js";
import { ImageService } from "./imageService.js";
import { MESSAGES } from "@/constants/messages.constants.js";

@injectable()
export class EnrollmentService implements IEnrollmentService {
  constructor(
    @inject(TYPES.IEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository,
    @inject(TYPES.IEnrollmentLinkRepository) private enrollmentLinkRepo: IEnrollmentLinkRepository,
    @inject(TYPES.ICourseRepository) private courseRepository: ICourseRepository,
    @inject(TYPES.IStudentRepository) private studentRepository: IStudentRepository,
    @inject(TYPES.IMentorRepository) private mentorRepository: IMentorRepository,
    @inject(TYPES.ImageService) private imageService: ImageService
  ) {}

  async enrollInCourse(
    studentId: string,
    courseId: string
  ): Promise<IEnrollment> {
    try {
      logger.info(`Enrolling student ${studentId} in course ${courseId}`);

      const student = await this.studentRepository.findById(studentId);
      if (!student) throw new Error(MESSAGES.AUTH.USER_NOT_FOUND);

      const sub = student.subscription;
      if (!sub) {
        throw new Error(MESSAGES.PAYMENT.NO_ACTIVE_SUBSCRIPTION);
      }

      // Check Limits using linking records
      const activeEnrollments = await this.enrollmentLinkRepo.countActiveByStudent(studentId);
      const subjectCount = sub?.subjectCount || 1;

      if (sub.plan === 'yearly') {
          const limit = subjectCount === 1 ? 1 : 5;
          if (activeEnrollments >= limit) {
              throw new Error(`Session limit reached. Your ${subjectCount === 1 ? 'Single Subject' : 'Unlimited'} plan allows up to ${limit} active course${limit > 1 ? 's' : ''}.`);
          }
      } else if (sub.plan === 'monthly') {
          if (activeEnrollments >= subjectCount) {
              throw new Error(`Subject limit reached. Your monthly plan allows up to ${subjectCount} subject${subjectCount > 1 ? 's' : ''}.`);
          }
      }

      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error(MESSAGES.COURSE.NOT_FOUND);
      }

      if (course.status !== "available") {
        throw new Error(MESSAGES.ADMIN.COURSE_NOT_AVAILABLE);
      }

      // Check if student is already enrolled using linking records
      const existingEnrollment = await this.enrollmentLinkRepo.findByStudentAndCourse(
        studentId,
        courseId
      );

      if (existingEnrollment) {
        throw new Error(MESSAGES.COURSE.ALREADY_ENROLLED);
      }

      // Create enrollment linkage record
      const enrollment = await this.enrollmentLinkRepo.create({
        student: new Types.ObjectId(studentId),
        course: new Types.ObjectId(courseId),
        status: "pending_payment",
      });

      // Update course status and assign student
      await this.courseRepository.updateCourseStatus(courseId, "booked", studentId);

      // Increment mentor's weekly bookings
      if (course.mentor) {
        const mentorId = typeof course.mentor === 'string' ? course.mentor : (course.mentor as unknown as { _id?: { toString(): string } })._id?.toString();
        if (mentorId) {
          await this.mentorRepository.incrementWeeklyBookings(mentorId);
        }
      }

      logger.info(`Enrollment linkage created successfully: ${enrollment._id}`);
      return enrollment as unknown as IEnrollment;
    } catch (error: unknown) {
      logger.error(
        `Error enrolling student ${studentId} in course ${courseId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async getStudentEnrollments(studentId: string): Promise<IEnrollment[]> {
    try {
      logger.info(`Fetching enrollments for student: ${studentId}`);
      return await this.enrollmentLinkRepo.findByStudent(studentId);
    } catch (error: unknown) {
      logger.error(
        `Error fetching enrollments for student ${studentId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: "pending_payment" | "active" | "cancelled"
  ): Promise<IEnrollment | null> {
    try {
      logger.info(`Updating enrollment link ${enrollmentId} status to ${status}`);
      const enrollment = await this.enrollmentLinkRepo.findByIdAndUpdate(
        enrollmentId,
        { status }
      );

      if (!enrollment) {
        throw new Error(MESSAGES.COURSE.ENROLLMENT_NOT_FOUND);
      }

      if (status === "cancelled") {
        const courseId = enrollment.course.toString();
        const course = await this.courseRepository.findById(courseId);
        if (course && course.mentor) {
          const mentorId = typeof course.mentor === 'string' ? course.mentor : (course.mentor as unknown as { _id?: { toString(): string } })._id?.toString();
          if (mentorId) {
            await this.mentorRepository.decrementWeeklyBookings(mentorId);
          }
        }
        await this.courseRepository.updateCourseStatus(courseId, "available", null);
      }

      return enrollment as unknown as IEnrollment;
    } catch (error: unknown) {
      logger.error(
        `Error updating enrollment link ${enrollmentId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async getAllEnrollments(): Promise<IEnrollment[]> {
    try {
      logger.info(`Fetching all enrollment links for admin`);
      const results = await this.enrollmentLinkRepo.findAll();
      const enriched = await this.signEnrollmentImages(results);
      return enriched as unknown as IEnrollment[];
    } catch (error: unknown) {
      logger.error(`Error fetching all enrollment links: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getAllEnrollmentsPaginated(params: PaginationParams): Promise<PaginatedResponse<IEnrollment>> {
    try {
      const { page, limit } = getPaginationParams(params as any);
      logger.info(`Fetching paginated enrollment links for admin - Page: ${page}, Limit: ${limit}`);
      
      const result = await this.enrollmentLinkRepo.findPaginated(
        {}, 
        page, 
        limit, 
        { enrollmentDate: -1 },
        [
          { path: 'student', select: 'fullName email profileImage profileImageKey' },
          { 
            path: 'course', 
            populate: [
              { path: 'subject', select: 'subjectName' },
              { path: 'grade', select: 'name' },
              { path: 'mentor', select: 'fullName email profilePicture profileImageKey' }
            ]
          }
        ]
      );
      
      const enriched = await this.signEnrollmentImages(result.items);
      return formatPaginatedResult(enriched as unknown as IEnrollment[], result.total, { page, limit });
    } catch (error: unknown) {
      logger.error(`Error fetching paginated enrollment links: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private async signEnrollmentImages(enrollments: any[]): Promise<any[]> {
    return await Promise.all(
      enrollments.map(async (en) => {
        // Sign student image
        if (en.student) {
          const imageKey = en.student.profileImage || en.student.profileImageKey;
          if (imageKey && !imageKey.startsWith('http')) {
            en.student.profileImageUrl = await this.imageService.getSignedImageUrl(imageKey);
            // Also set profilePicture for frontend compatibility
            en.student.profilePicture = en.student.profileImageUrl;
          } else if (imageKey && imageKey.startsWith('http')) {
             en.student.profileImageUrl = imageKey;
             en.student.profilePicture = imageKey;
          }
        }

        // Sign mentor image
        if (en.course && en.course.mentor) {
          const mentor = en.course.mentor;
          const imageKey = mentor.profilePicture || mentor.profileImageKey;
          if (imageKey && !imageKey.startsWith('http')) {
            mentor.profileImageUrl = await this.imageService.getSignedImageUrl(imageKey);
            // Ensure profilePicture is also set to URL for frontend
            mentor.profilePicture = mentor.profileImageUrl;
          } else if (imageKey && imageKey.startsWith('http')) {
            mentor.profileImageUrl = imageKey;
            mentor.profilePicture = imageKey;
          }
        }
        return en;
      })
    );
  }
}
