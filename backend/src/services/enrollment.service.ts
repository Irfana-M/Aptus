import { injectable, inject } from "inversify";
import { Types } from "mongoose";
import type { IEnrollment } from "../models/enrollment.model";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";
import { TYPES } from "../types";
import type { IEnrollmentRepository } from "../interfaces/repositories/IEnrollmentRepository";
import type { ICourseRepository } from "../interfaces/repositories/ICourseRepository";
import type { IEnrollmentService } from "../interfaces/services/IEnrollmentService";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";

@injectable()
export class EnrollmentService implements IEnrollmentService {
  constructor(
    @inject(TYPES.IEnrollmentRepository) private enrollmentRepository: IEnrollmentRepository,
    @inject(TYPES.ICourseRepository) private courseRepository: ICourseRepository,
    @inject(TYPES.IStudentRepository) private studentRepository: IStudentRepository
  ) {}

  async enrollInCourse(
    studentId: string,
    courseId: string
  ): Promise<IEnrollment> {
    try {
      logger.info(`Enrolling student ${studentId} in course ${courseId}`);

      // 1. Fetch Student & Subscription
      const student = await this.studentRepository.findById(studentId);
      if (!student) throw new Error("Student not found");

      const sub = student.subscription;
      if (!sub) {
        throw new Error("Student does not have a subscription plan");
      }
      // (though our method sets it to 'pending_payment' below)
      // We will allow the creation of the enrollment record so they can choose a slot.

      // 2. Check Limits
      const activeEnrollments = await this.enrollmentRepository.countActiveByStudent(studentId);
      // @ts-expect-error - subjectCount existence check
      const subjectCount = sub?.subjectCount || 1;

      if (sub.plan === 'yearly') {
          // Yearly Unlimited: 5 sessions/week limit (enforced via active enrollments)
          const limit = subjectCount === 1 ? 1 : 5;
          if (activeEnrollments >= limit) {
              throw new Error(`Session limit reached. Your ${subjectCount === 1 ? 'Single Subject' : 'Unlimited'} plan allows up to ${limit} active course${limit > 1 ? 's' : ''}.`);
          }
      } else if (sub.plan === 'monthly') {
          // Monthly: Limit by subjectCount
          if (activeEnrollments >= subjectCount) {
              throw new Error(`Subject limit reached. Your monthly plan allows up to ${subjectCount} subject${subjectCount > 1 ? 's' : ''}.`);
          }
      }

      // Check if course exists and is available result is typicaly a POJO from lean() or doc
      const course = await this.courseRepository.findById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }

      if (course.status !== "available") {
        throw new Error("Course is not available for enrollment");
      }

      // Check if student is already enrolled
      const existingEnrollment = await this.enrollmentRepository.findByStudentAndCourse(
        studentId,
        courseId
      );

      if (existingEnrollment) {
        throw new Error("Student is already enrolled in this course");
      }

      // Create enrollment
      const enrollment = await this.enrollmentRepository.create({
        student: new Types.ObjectId(studentId),
        course: new Types.ObjectId(courseId),
        status: "pending_payment",
      });

      // Update course status and assign student
      await this.courseRepository.updateCourseStatus(courseId, "booked", studentId);

      logger.info(`Enrollment created successfully: ${enrollment._id}`);
      return enrollment;
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
      const enrollments = await this.enrollmentRepository.findByStudent(studentId);

      return enrollments;
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
      logger.info(`Updating enrollment ${enrollmentId} status to ${status}`);
      const enrollment = await this.enrollmentRepository.findByIdAndUpdate(
        enrollmentId,
        { status }
      );

      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      // If cancelled, update course status back to available
      if (status === "cancelled") {
        // enrollment.course is likely an Object if populated or ID string
        // but here findByIdAndUpdate generally returns the doc without population unless specified in repo
        // our repo implementation uses findByIdAndUpdate with new: true, no population there.
        // So enrollment.course should be the ID
        const courseId = enrollment.course.toString();
        await this.courseRepository.updateCourseStatus(courseId, "available", null);
      }

      return enrollment;
    } catch (error: unknown) {
      logger.error(
        `Error updating enrollment ${enrollmentId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }
}
