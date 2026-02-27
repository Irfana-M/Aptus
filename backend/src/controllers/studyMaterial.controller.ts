import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response } from "express";
import type { IStudyMaterialService } from "../interfaces/services/IStudyMaterialService";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";
import { getSignedFileUrl } from "../utils/s3Upload";

interface ExtendedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'mentor' | 'student';
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
          message: "Missing required fields or file",
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
        message: appError.message || "Failed to upload study material",
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
          message: "Missing required fields: title, description, subjectId, dueDate, assignedTo, file",
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
        message: "Assignment created successfully",
      });
    } catch (error: unknown) {
      logger.error("Error in createAssignment controller:", error);
      const appError = error as { statusCode?: number; message?: string };
      return res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || "Failed to create assignment",
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
          message: "Missing required fields or files",
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
        message: "Assignment submitted successfully",
      });
    } catch (error: unknown) {
      logger.error("Error in submitAssignment controller:", error);
      const appError = error as { statusCode?: number; message?: string };
      return res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || "Failed to submit assignment",
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
          message: "Missing required fields",
        });
      }

      const updated = await this._studyMaterialService.provideFeedback(submissionId, mentorId, feedback);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: updated,
        message: "Feedback provided successfully",
      });
    } catch (error: unknown) {
      logger.error("Error in provideFeedback controller:", error);
      const appError = error as { statusCode?: number; message?: string };
      return res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || "Failed to provide feedback",
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
          message: "Mentor ID missing",
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
        message: appError.message || "Failed to fetch materials",
      });
    }
  };

  getStudentAssignments = async (req: Request, res: Response) => {
    try {
      const studentId = (req as ExtendedRequest).user?.id;

      if (!studentId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Student ID missing",
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
        message: appError.message || "Failed to fetch assignments",
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
          message: "Missing required parameters",
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
        message: appError.message || "Failed to fetch submissions",
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
          message: "Missing required parameters",
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
        message: appError.message || "Failed to fetch submission",
      });
    }
  };

  getDownloadUrl = async (req: Request, res: Response) => {
    try {
      const { fileKey } = req.params;

      if (!fileKey) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "File key is required",
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
        message: appError.message || "Failed to generate download URL",
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
          message: "Session ID is required",
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
        message: appError.message || "Failed to fetch materials",
      });
    }
  };

  getStudentMaterials = async (req: Request, res: Response) => {
    try {
      const studentId = (req as ExtendedRequest).user?.id;
      if (!studentId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Student ID missing",
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
        message: appError.message || "Failed to fetch materials",
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
          message: "Missing required parameters",
        });
      }

      await this._studyMaterialService.deleteMaterial(materialId, mentorId);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Material deleted successfully",
      });
    } catch (error: unknown) {
      logger.error("Error in deleteMaterial controller:", error);
      const appError = error as { message?: string };
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || "Failed to delete material",
      });
    }
  };
}

