import type { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IChatService } from "../interfaces/services/IChatService";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";

@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.IChatService) private _chatService: IChatService
  ) {}

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { content } = req.body;
      const userId = (req as any).user.id;
      const role = (req as any).user.role;

      if (!sessionId) throw new AppError("Session ID is required", HttpStatusCode.BAD_REQUEST);

      const message = await this._chatService.sendMessage(sessionId, userId, role, content);
      
      res.status(HttpStatusCode.CREATED).json({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error("Error in ChatController.sendMessage:", error);
      res.status((error as any).statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as any).message || "Failed to send message"
      });
    }
  }

  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = (req as any).user.id;

      if (!sessionId) throw new AppError("Session ID is required", HttpStatusCode.BAD_REQUEST);

      const history = await this._chatService.getChatHistory(sessionId, userId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error("Error in ChatController.getChatHistory:", error);
      res.status((error as any).statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: (error as any).message || "Failed to fetch chat history"
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
      } catch (error) {
          logger.error("Error in ChatController.initiateChat:", error);
          res.status((error as any).statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: (error as any).message || "Failed to initiate chat"
          });
      }
  }
}
