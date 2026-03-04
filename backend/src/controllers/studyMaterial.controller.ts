import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { Request, Response } from "express";
import type { IStudyMaterialService } from "../interfaces/services/IStudyMaterialService.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { logger } from "../utils/logger.js";
import { getSignedFileUrl } from "../utils/s3Upload.js";
import { MESSAGES } from "../constants/messages.constants.js";
import { UserRole } from "../enums/user.enum.js";

interface ExtendedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

@injectable()
export class StudyMaterialController {
  constructor(
    @inject(TYPES.IStudyMaterialService) private _studyMaterialService: IStudyMaterialService
  ) {}

  uploadMaterial = async (req: Request, res: Response) => {
    try {
      const mentorId = (req as ExtendedRequest).user?.id;
      const { sessionId } = req.params;
      const { title, description } = req.body;
      const file = req.file;

      if (!mentorId || !sessionId || !title || !file) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.STUDY_MATERIAL.MISSING_FIELDS,
        });
      }

      const material = await this._studyMaterialService.uploadMaterial({
        sessionId,
        mentorId,
        title,
        description,
        file,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        data: material,
      });
    } catch (error: unknown) {
      logger.error("Error in uploadMaterial controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.STUDENT.UPLOAD_FAILED("study material"),
      });
    }
  };

  // === ASSIGNMENT ENDPOINTS ===

  createAssignment = async (req: Request, res: Response) => {
    try {
      const mentorId = (req as ExtendedRequest).user?.id;
      const { title, description, subjectId, dueDate, assignedTo, allowLateSubmission } = req.body;
      const file = req.file;

      if (!mentorId || !title || !description || !subjectId || !dueDate || !assignedTo || !file) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.STUDY_MATERIAL.MISSING_FIELDS,
        });
      }

      const assignment = await this._studyMaterialService.createAssignment({
        mentorId,
        title,
        description,
        subjectId,
        dueDate: new Date(dueDate),
        assignedTo: JSON.parse(assignedTo),
        allowLateSubmission: allowLateSubmission === 'true',
        file,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        data: assignment,
        message: MESSAGES.STUDY_MATERIAL.ASSIGNMENT_CREATE_SUCCESS,
      });
    } catch (error: unknown) {
      logger.error("Error in createAssignment controller:", error);
      const appError = error as { statusCode?: number; message?: string };
      return res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.CREATE_FAILED,
      });
    }
  };

  submitAssignment = async (req: Request, res: Response) => {
    try {
      const studentId = (req as ExtendedRequest).user?.id;
      const { assignmentId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!studentId || !assignmentId || !files || files.length === 0) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.STUDY_MATERIAL.MISSING_FIELDS,
        });
      }

      const submission = await this._studyMaterialService.submitAssignment({
        assignmentId,
        studentId,
        files,
      });

      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        data: submission,
        message: MESSAGES.STUDY_MATERIAL.ASSIGNMENT_SUBMIT_SUCCESS,
      });
    } catch (error: unknown) {
      logger.error("Error in submitAssignment controller:", error);
      const appError = error as { statusCode?: number; message?: string };
      return res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.STUDENT.UPLOAD_FAILED("assignment"),
      });
    }
  };

  provideFeedback = async (req: Request, res: Response) => {
    try {
      const mentorId = (req as ExtendedRequest).user?.id;
      const { submissionId } = req.params;
      const { feedback } = req.body;

      if (!mentorId || !submissionId || !feedback) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COMMON.REQUIRED_FIELDS(['submissionId', 'feedback']),
        });
      }

      const updated = await this._studyMaterialService.provideFeedback(submissionId, mentorId, feedback);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: updated,
        message: MESSAGES.STUDY_MATERIAL.FEEDBACK_SUCCESS,
      });
    } catch (error: unknown) {
      logger.error("Error in provideFeedback controller:", error);
      const appError = error as { statusCode?: number; message?: string };
      return res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.STUDY_MATERIAL.FEEDBACK_UPDATE_FAILED,
      });
    }
  };

  getMentorMaterials = async (req: Request, res: Response) => {
    try {
      const mentorId = (req as ExtendedRequest).user?.id;
      const { type } = req.query;

      if (!mentorId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.STUDY_MATERIAL.MENTOR_ID_MISSING,
        });
      }

      const materials = await this._studyMaterialService.getMentorMaterials(mentorId, type as 'study_material' | 'assignment');

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: materials,
      });
    } catch (error: unknown) {
      logger.error("Error in getMentorMaterials controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.FETCH_FAILED,
      });
    }
  };

  getStudentAssignments = async (req: Request, res: Response) => {
    try {
      const studentId = (req as ExtendedRequest).user?.id;

      if (!studentId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.STUDY_MATERIAL.STUDENT_ID_MISSING,
        });
      }

      const assignments = await this._studyMaterialService.getStudentAssignments(studentId);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: assignments,
      });
    } catch (error: unknown) {
      logger.error("Error in getStudentAssignments controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.FETCH_FAILED,
      });
    }
  };

  getAssignmentSubmissions = async (req: Request, res: Response) => {
    try {
      const mentorId = (req as ExtendedRequest).user?.id;
      const { assignmentId } = req.params;

      if (!mentorId || !assignmentId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COMMON.REQUIRED_FIELDS(['parameters']),
        });
      }

      const submissions = await this._studyMaterialService.getAssignmentSubmissions(assignmentId, mentorId);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: submissions,
      });
    } catch (error: unknown) {
      logger.error("Error in getAssignmentSubmissions controller:", error);
      const appError = error as { statusCode?: number; message?: string };
      return res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.FETCH_FAILED,
      });
    }
  };

  getStudentSubmission = async (req: Request, res: Response) => {
    try {
      const studentId = (req as ExtendedRequest).user?.id;
      const { assignmentId } = req.params;

      if (!studentId || !assignmentId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COMMON.REQUIRED_FIELDS(['parameters']),
        });
      }

      const submission = await this._studyMaterialService.getStudentSubmission(assignmentId, studentId);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: submission,
      });
    } catch (error: unknown) {
      logger.error("Error in getStudentSubmission controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.FETCH_FAILED,
      });
    }
  };

  getDownloadUrl = async (req: Request, res: Response) => {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.STUDY_MATERIAL.FILE_KEY_REQUIRED,
        });
      }

      const downloadUrl = await getSignedFileUrl(fileKey);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: { downloadUrl },
      });
    } catch (error: unknown) {
      logger.error("Error in getDownloadUrl controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.FETCH_FAILED,
      });
    }
  };

  // === EXISTING ENDPOINTS ===

  getSessionMaterials = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COMMON.ID_REQUIRED('Session'),
        });
      }

      const materials = await this._studyMaterialService.getSessionMaterials(sessionId);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: materials,
      });
    } catch (error: unknown) {
      logger.error("Error in getSessionMaterials controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.FETCH_FAILED,
      });
    }
  };

  getStudentMaterials = async (req: Request, res: Response) => {
    try {
      const studentId = (req as ExtendedRequest).user?.id;
      if (!studentId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.STUDY_MATERIAL.STUDENT_ID_MISSING,
        });
      }

      const materials = await this._studyMaterialService.getStudentMaterials(studentId);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: materials,
      });
    } catch (error: unknown) {
      logger.error("Error in getStudentMaterials controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.FETCH_FAILED,
      });
    }
  };

  deleteMaterial = async (req: Request, res: Response) => {
    try {
      const mentorId = (req as ExtendedRequest).user?.id;
      const { materialId } = req.params;

      if (!mentorId || !materialId) {
         return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COMMON.REQUIRED_FIELDS(['parameters']),
        });
      }

      await this._studyMaterialService.deleteMaterial(materialId, mentorId);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDY_MATERIAL.DELETE_SUCCESS,
      });
    } catch (error: unknown) {
      logger.error("Error in deleteMaterial controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.ADMIN.DELETE_FAILED,
      });
    }
  };
}

