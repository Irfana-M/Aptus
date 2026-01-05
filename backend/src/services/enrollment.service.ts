import { injectable, inject } from "inversify";
import { Types } from "mongoose";
import type { IEnrollment } from "../models/enrollment.model";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";
import { TYPES } from "../types";
import type { IEnrollmentRepository } from "../interfaces/repositories/IEnrollmentRepository";
import type { IEnrollmentLinkRepository } from "../interfaces/repositories/IEnrollmentLinkRepository";
import type { ICourseRepository } from "../interfaces/repositories/ICourseRepository";
import type { IEnrollmentService } from "../interfaces/services/IEnrollmentService";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";

@injectable()
export class EnrollmentService implements IEnrollmentService {
  constructor(
    @inject(TYPES.IEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository,
    @inject(TYPES.IEnrollmentLinkRepository) private enrollmentLinkRepo: IEnrollmentLinkRepository,
    @inject(TYPES.ICourseRepository) private courseRepository: ICourseRepository,
    @inject(TYPES.IStudentRepository) private studentRepository: IStudentRepository
  ) {}

  async enrollInCourse(
    studentId: string,
    courseId: string
  ): Promise<IEnrollment> {
    try {
      logger.info(`Enrolling student ${studentId} in course ${courseId}`);

      const student = await this.studentRepository.findById(studentId);
      if (!student) throw new Error("Student not found");

      const sub = student.subscription;
      if (!sub) {
        throw new Error("Student does not have a subscription plan");
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
        throw new Error("Course not found");
      }

      if (course.status !== "available") {
        throw new Error("Course is not available for enrollment");
      }

      // Check if student is already enrolled using linking records
      const existingEnrollment = await this.enrollmentLinkRepo.findByStudentAndCourse(
        studentId,
        courseId
      );

      if (existingEnrollment) {
        throw new Error("Student is already enrolled in this course");
      }

      // Create enrollment linkage record
      const enrollment = await this.enrollmentLinkRepo.create({
        student: new Types.ObjectId(studentId),
        course: new Types.ObjectId(courseId),
        status: "pending_payment",
      });

      // Update course status and assign student
      await this.courseRepository.updateCourseStatus(courseId, "booked", studentId);

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
        throw new Error("Enrollment not found");
      }

      if (status === "cancelled") {
        const courseId = enrollment.course.toString();
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
      return results as unknown as IEnrollment[];
    } catch (error: unknown) {
      logger.error(`Error fetching all enrollment links: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}
