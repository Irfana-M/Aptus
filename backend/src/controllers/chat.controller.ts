import type { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IChatService } from "../interfaces/services/IChatService";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: 'mentor' | 'student' | 'admin';
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

      if (!sessionId) throw new AppError("Session ID is required", HttpStatusCode.BAD_REQUEST);

      const message = await this._chatService.sendMessage(sessionId, userId, role, content);
      
      res.status(HttpStatusCode.CREATED).json({
        success: true,
        data: message
      });
    } catch (error: unknown) {
      logger.error("Error in ChatController.sendMessage:", error);
      const appError = error as { statusCode?: number; message?: string };
      res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || "Failed to send message"
      });
    }
  }

  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const role = authReq.user.role;

      if (!sessionId) throw new AppError("Session ID is required", HttpStatusCode.BAD_REQUEST);

      const history = await this._chatService.getChatHistory(sessionId, userId, role);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: history
      });
    } catch (error: unknown) {
      logger.error("Error in ChatController.getChatHistory:", error);
      const appError = error as { statusCode?: number; message?: string };
      res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: appError.message || "Failed to fetch chat history"
      });
    }
  }

  async initiateChat(req: Request, res: Response): Promise<void> {
      try {
        const { sessionId } = req.params;

        if (!sessionId) throw new AppError("Session ID is required", HttpStatusCode.BAD_REQUEST);

        const room = await this._chatService.initiateChatRoom(sessionId);
          res.status(HttpStatusCode.OK).json({
              success: true,
              data: room
          });
      } catch (error: unknown) {
          logger.error("Error in ChatController.initiateChat:", error);
          const appError = error as { statusCode?: number; message?: string };
          res.status(appError.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: appError.message || "Failed to initiate chat"
          });
      }
  }
}
