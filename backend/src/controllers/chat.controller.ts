import type { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { IChatService } from "../interfaces/services/IChatService.js";
import { AppError } from "../utils/AppError.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { UserRole } from "../enums/user.enum.js";
import { logger } from "../utils/logger.js";
import { MESSAGES } from "../constants/messages.constants.js";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.IChatService) private _chatService: IChatService
  ) {}

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const role = authReq.user.role;

      logger.info(`[CHAT TRACE][Controller] sendMessage Request:`, { sessionId, userId, role });

      if (!sessionId) throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Session"), HttpStatusCode.BAD_REQUEST);

      const message = await this._chatService.sendMessage(sessionId, userId, role, content);
      
      res.status(HttpStatusCode.CREATED).json({
        success: true,
        data: message
      });
    } catch (error: unknown) {
      logger.error("[CHAT TRACE][Controller] Error in sendMessage:", {
        sessionId: req.params.sessionId,
        userId: (req as any).user?.id,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      const appError = error as { statusCode?: number; message?: string };
      res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.COMMON.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const role = authReq.user.role;

      logger.info(`[CHAT TRACE][Controller] getChatHistory Request:`, { sessionId, userId, role });

      if (!sessionId) throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Session"), HttpStatusCode.BAD_REQUEST);

      const history = await this._chatService.getChatHistory(sessionId, userId, role);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: history
      });
    } catch (error: unknown) {
      logger.error("[CHAT TRACE][Controller] Error in getChatHistory:", {
        sessionId: req.params.sessionId,
        userId: (req as any).user?.id,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      const appError = error as { statusCode?: number; message?: string };
      res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || MESSAGES.COMMON.INTERNAL_SERVER_ERROR
      });
    }
  }

  async initiateChat(req: Request, res: Response): Promise<void> {
      try {
        const { sessionId } = req.params;
        const authReq = req as AuthenticatedRequest;
        const userId = authReq.user?.id;
        const role = authReq.user?.role;

        logger.info(`[CHAT TRACE][Controller] initiateChat Request:`, { sessionId, userId, role });

        if (!sessionId) throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Session"), HttpStatusCode.BAD_REQUEST);

        const room = await this._chatService.initiateChatRoom(sessionId);
          res.status(HttpStatusCode.OK).json({
              success: true,
              data: room
          });
      } catch (error: unknown) {
          logger.error("[CHAT TRACE][Controller] Error in initiateChat:", {
            sessionId: req.params.sessionId,
            userId: (req as any).user?.id,
            message: (error as Error).message,
            stack: (error as Error).stack
          });
          const appError = error as { statusCode?: number; message?: string };
          res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: appError.message || MESSAGES.COMMON.INTERNAL_SERVER_ERROR
          });
      }
  }
}
