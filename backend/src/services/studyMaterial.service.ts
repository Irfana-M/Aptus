import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { IStudyMaterialService } from "../interfaces/services/IStudyMaterialService.js";
import type { IStudyMaterialRepository } from "../interfaces/repositories/IStudyMaterialRepository.js";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository.js";
import type { IAssignmentSubmissionRepository } from "../interfaces/repositories/IAssignmentSubmissionRepository.js";
import type { IBookingRepository } from "../interfaces/repositories/IBookingRepository.js";
import type { ISubjectRepository } from "../interfaces/repositories/ISubjectRepository.js";
import type { IStudyMaterial, IAssignmentSubmission } from "../interfaces/models/studyMaterial.interface.js";
import { uploadFileToS3 } from "../utils/s3Upload.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { INotificationService } from "../interfaces/services/INotificationService.js";
import { MESSAGES } from "../constants/messages.constants.js";

@injectable()
export class StudyMaterialService implements IStudyMaterialService {
  constructor(
    @inject(TYPES.IStudyMaterialRepository) private _studyMaterialRepo: IStudyMaterialRepository,
    @inject(TYPES.IAssignmentSubmissionRepository) private _submissionRepo: IAssignmentSubmissionRepository,
    @inject(TYPES.ISessionRepository) private _sessionRepo: ISessionRepository,
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.IBookingRepository) private _bookingRepo: IBookingRepository,
    @inject(TYPES.ISubjectRepository) private _subjectRepo: ISubjectRepository,
    @inject(TYPES.INotificationService) private _notificationService: INotificationService
  ) {}

  async uploadMaterial(data: {
    sessionId?: string;
    slotId?: string;
    mentorId: string;
    studentId?: string;
    subjectId?: string;
    title: string;
    description?: string;
    file: Express.Multer.File;
  }): Promise<IStudyMaterial> {
    try {
      logger.info(`Uploading study material. Session: ${data.sessionId}, Slot: ${data.slotId}`);

      let sessionId: string | undefined = data.sessionId;
      let courseId: string | undefined;
      let mentorId: string = data.mentorId;
      let studentId: string | undefined = data.studentId;
      let subjectId: string | undefined = data.subjectId;
      const slotId: string | undefined = data.slotId;

      if (data.sessionId) {
        const session = await this._sessionRepo.findById(data.sessionId);
        if (session) {
          // Check if the mentor is authorized for this session
          const sessionAny = session as any;
          if (sessionAny.mentorId.toString() !== data.mentorId) {
            throw new AppError(MESSAGES.STUDY_MATERIAL.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
          }
          sessionId = sessionAny._id.toString();
          courseId = sessionAny.courseId?.toString();
          mentorId = sessionAny.mentorId.toString();
          studentId = sessionAny.studentId?.toString();
          subjectId = sessionAny.subjectId?.toString();
        }
      }

      // 2. Upload file to S3
      const fileUrl = await uploadFileToS3(data.file, "study-material"); 
      
      // 3. Determine file type
      let fileType = "other";
      if (data.file.mimetype.includes("pdf")) fileType = "pdf";
      else if (data.file.mimetype.includes("video")) fileType = "video";
      else if (data.file.mimetype.includes("image")) fileType = "image";

      // 4. Save to DB
      const material = await this._studyMaterialRepo.create({
        sessionId,
        slotId,
        courseId,
        mentorId,
        studentId,
        subjectId,
        materialType: 'study_material',
        title: data.title,
        description: data.description,
        fileUrl,
        fileType,
        originalName: data.file.originalname,
        fileSize: data.file.size,
        status: 'active',
      } as any);

      logger.info(`Study material uploaded successfully: ${material._id}`);
      return material;
    } catch (error: unknown) {
      logger.error("Error in uploadMaterial service:", error);
      throw error;
    }
  }

  async createAssignment(data: {
    mentorId: string;
    subjectId: string;
    slotId?: string;
    title: string;
    description: string;
    dueDate: Date;
    assignedTo: string[];
    allowLateSubmission?: boolean;
    file: Express.Multer.File;
  }): Promise<IStudyMaterial> {
    try {
      logger.info(`Creating assignment: ${data.title} for ${data.assignedTo.length} students`);

      // Authorization Check: Does mentor teach this subject?
      const mentor = await this._mentorRepo.findById(data.mentorId);
      if (!mentor) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);
      const subject = await this._subjectRepo.findById(data.subjectId);
      if (!subject) throw new AppError(MESSAGES.COURSE.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      const hasProficiency = mentor.subjectProficiency?.some(proficiency => 
        proficiency.subject.toLowerCase() === subject.subjectName.toLowerCase()
      );

      if (!hasProficiency) {
        throw new AppError(`You are not authorized to create assignments for ${subject.subjectName}`, HttpStatusCode.FORBIDDEN);
      }

      // 1. Upload file to S3
      const fileUrl = await uploadFileToS3(data.file, "assignment");
      
      // 2. Determine file type
      let fileType = "other";
      if (data.file.mimetype.includes("pdf")) fileType = "pdf";
      else if (data.file.mimetype.includes("video")) fileType = "video";
      else if (data.file.mimetype.includes("image")) fileType = "image";

      // 3. Create assignment
      const assignment = await this._studyMaterialRepo.create({
        mentorId: data.mentorId,
        subjectId: data.subjectId,
        slotId: data.slotId,
        materialType: 'assignment',
        title: data.title,
        description: data.description,
        fileUrl,
        fileType,
        originalName: data.file.originalname,
        fileSize: data.file.size,
        assignmentDetails: {
          dueDate: data.dueDate,
          assignedTo: data.assignedTo,
          allowLateSubmission: data.allowLateSubmission || false,
        },
        status: 'active',
      } as any);

      logger.info(`Assignment created successfully: ${assignment._id}`);
      return assignment;
    } catch (error: unknown) {
      logger.error("Error in createAssignment service:", error);
      throw error;
    }
  }

  async submitAssignment(data: {
    assignmentId: string;
    studentId: string;
    files: Express.Multer.File[];
  }): Promise<IAssignmentSubmission> {
    try {
      logger.info(`Student ${data.studentId} submitting assignment ${data.assignmentId}`);

      // 1. Get assignment to check due date
      const assignment = await this._studyMaterialRepo.findById(data.assignmentId);
      if (!assignment) {
        throw new AppError(MESSAGES.STUDY_MATERIAL.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      if (assignment.materialType !== 'assignment') {
        throw new AppError(MESSAGES.STUDY_MATERIAL.NOT_AN_ASSIGNMENT, HttpStatusCode.BAD_REQUEST);
      }

      // 2. Check if student is assigned
      const isAssigned = assignment.assignmentDetails?.assignedTo?.some(
        (id: any) => id.toString() === data.studentId
      );
      if (!isAssigned) {
        throw new AppError(MESSAGES.STUDY_MATERIAL.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
      }

      // 3. Check for existing submission
      const existingSubmission = await this._submissionRepo.findByMaterialAndStudent(
        data.assignmentId,
        data.studentId
      );
      if (existingSubmission) {
        throw new AppError(MESSAGES.STUDY_MATERIAL.ALREADY_SUBMITTED, HttpStatusCode.CONFLICT);
      }

      // 4. Check if late
      const isLate = assignment.assignmentDetails?.dueDate 
        ? new Date() > new Date(assignment.assignmentDetails.dueDate)
        : false;

      if (isLate && !assignment.assignmentDetails?.allowLateSubmission) {
        throw new AppError(MESSAGES.STUDY_MATERIAL.LATE_SUBMISSION_FORBIDDEN, HttpStatusCode.FORBIDDEN);
      }

      // 5. Upload files to S3
      const uploadedFiles = await Promise.all(
        data.files.map(async (file) => {
          const fileKey = await uploadFileToS3(file, "submission");
          return {
            fileName: file.originalname,
            fileKey,
            fileSize: file.size,
            uploadedAt: new Date(),
          };
        })
      );

      // 6. Create submission
      const submission = await this._submissionRepo.create({
        materialId: data.assignmentId,
        studentId: data.studentId,
        files: uploadedFiles,
        submittedAt: new Date(),
        isLate,
        status: 'pending',
      } as any);

      logger.info(`Submission created: ${submission._id}, isLate: ${isLate}`);
      return submission;
    } catch (error: unknown) {
      logger.error("Error in submitAssignment service:", error);
      throw error;
    }
  }

  async provideFeedback(submissionId: string, mentorId: string, feedback: string): Promise<IAssignmentSubmission> {
    try {
      logger.info(`Mentor ${mentorId} providing feedback for submission ${submissionId}`);

      const submission = await this._submissionRepo.findById(submissionId);
      if (!submission) {
        throw new AppError(MESSAGES.STUDY_MATERIAL.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      // Verify mentor owns the assignment
      const assignment = await this._studyMaterialRepo.findById(submission.materialId.toString());
      if (!assignment || assignment.mentorId.toString() !== mentorId) {
        throw new AppError(MESSAGES.STUDY_MATERIAL.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
      }

      const updated = await this._submissionRepo.addFeedback(submissionId, feedback);
      if (!updated) {
        throw new AppError(MESSAGES.STUDY_MATERIAL.FEEDBACK_UPDATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      logger.info(`Feedback provided for submission ${submissionId}`);
      return updated;
    } catch (error: unknown) {
      logger.error("Error in provideFeedback service:", error);
      throw error;
    }
  }

  async getSessionMaterials(sessionId: string): Promise<IStudyMaterial[]> {
    return this._studyMaterialRepo.findBySessionId(sessionId);
  }

  async getStudentMaterials(studentId: string): Promise<IStudyMaterial[]> {
    try {
      // 1. Get direct materials (by studentId or assignment)
      const directMaterials = await this._studyMaterialRepo.findByStudentId(studentId);

      // 2. Get materials linked to slots booked by the student
      const studentBookings = await this._bookingRepo.find({ studentId, status: { $ne: 'cancelled' } });
      const slotIds = studentBookings.map(b => b.timeSlotId.toString());

      const slotMaterials = await this._studyMaterialRepo.find({ 
        slotId: { $in: slotIds }, 
        status: 'active' 
      });

      // Merge and return unique
      const all: IStudyMaterial[] = [...directMaterials, ...slotMaterials];
      const unique = Array.from(new Map(all.map(m => [(m as any)._id.toString(), m])).values());
      
      return unique;
    } catch (error) {
      logger.error(`Error in getStudentMaterials: ${error}`);
      return this._studyMaterialRepo.findByStudentId(studentId);
    }
  }

  async getCourseMaterials(courseId: string): Promise<IStudyMaterial[]> {
    return this._studyMaterialRepo.findByCourseId(courseId);
  }

  async getMentorMaterials(mentorId: string, type?: 'study_material' | 'assignment'): Promise<IStudyMaterial[]> {
    return (this._studyMaterialRepo as unknown as { findByMentor(id: string, t?: string): Promise<IStudyMaterial[]> }).findByMentor(mentorId, type);
  }

  async getStudentAssignments(studentId: string): Promise<IStudyMaterial[]> {
    return (this._studyMaterialRepo as unknown as { findAssignmentsForStudent(id: string): Promise<IStudyMaterial[]> }).findAssignmentsForStudent(studentId);
  }

  async getAssignmentSubmissions(assignmentId: string, mentorId: string): Promise<IAssignmentSubmission[]> {
    // Verify mentor owns the assignment
    const assignment = await this._studyMaterialRepo.findById(assignmentId);
    if (!assignment || assignment.mentorId.toString() !== mentorId) {
      throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.FORBIDDEN);
    }

    return this._submissionRepo.findByMaterialId(assignmentId);
  }

  async getStudentSubmission(assignmentId: string, studentId: string): Promise<IAssignmentSubmission | null> {
    return this._submissionRepo.findByMaterialAndStudent(assignmentId, studentId);
  }

  async deleteMaterial(materialId: string, mentorId: string): Promise<boolean> {
    const material = await this._studyMaterialRepo.findById(materialId);
    if (!material) {
      throw new AppError(MESSAGES.STUDY_MATERIAL.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    if (material.mentorId.toString() !== mentorId) {
      throw new AppError(MESSAGES.STUDY_MATERIAL.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
    }

    return this._studyMaterialRepo.delete(materialId);
  }

  /**
   * Sends reminder notifications for assignments due within the given time window.
   * Only notifies students who haven't submitted yet.
   */
  async sendDueReminders(from: Date, to: Date): Promise<void> {
    logger.info(`[StudyMaterialService] Sending due reminders for ${from.toISOString()} to ${to.toISOString()}`);

    try {
      // Find assignments due in the time window
      const upcomingAssignments = await this._studyMaterialRepo.find({
        materialType: 'assignment',
        status: 'active',
        'assignmentDetails.dueDate': {
          $gte: from,
          $lte: to
        }
      });

      logger.info(`[StudyMaterialService] Found ${upcomingAssignments.length} assignments due in window`);

      for (const assignment of upcomingAssignments) {
        try {
          // Get list of assigned students
          const assignedStudents = assignment.assignmentDetails?.assignedTo || [];

          // Find which students have already submitted
          const submissions = await this._submissionRepo.find({
            materialId: (assignment as any)._id
          });

          const submittedStudentIds = new Set(
            submissions.map(submission => submission.studentId.toString())
          );

          // Filter to students who haven't submitted
          const pendingStudents = assignedStudents.filter(
            studentId => !submittedStudentIds.has(studentId.toString())
          );

          // Calculate hours remaining
          const hoursRemaining = Math.round(
            (new Date(assignment.assignmentDetails!.dueDate).getTime() - from.getTime()) / (60 * 60 * 1000)
          );

          logger.info(`[StudyMaterialService] Assignment "${assignment.title}": ${pendingStudents.length} students pending (${hoursRemaining}h remaining)`);

          // Notify each pending student
          for (const studentId of pendingStudents) {
            await this._notificationService.notifyUser(
              studentId.toString(),
              'student',
              'assignment_reminder',
              {
                assignmentId: assignment._id,
                title: assignment.title,
                dueDate: assignment.assignmentDetails?.dueDate,
                hoursRemaining
              },
              ['web', 'email']
            );
          }
        } catch (error) {
          logger.error(`[StudyMaterialService] Error sending reminder for assignment ${assignment._id}:`, error);
        }
      }

      logger.info('[StudyMaterialService] Assignment reminder processing completed');
    } catch (error) {
      logger.error('[StudyMaterialService] Error in sendDueReminders:', error);
      throw error;
    }
  }
}

