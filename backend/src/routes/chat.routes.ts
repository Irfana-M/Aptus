import express from "express";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { ChatController } from "../controllers/chat.controller";
import { requireAuth } from "../middleware/authMiddleware";

const chatRouter = express.Router();
const chatController = container.get<ChatController>(TYPES.ChatController);

// All chat routes require authentication
chatRouter.use(requireAuth);

/**
 * @route   GET /api/chat/:sessionId/history
 * @desc    Get chat history for a session
 * @access  Enrolled Student, Assigned Mentor, Admin
 */
chatRouter.get("/:sessionId/history", (req, res) => chatController.getChatHistory(req, res));

/**
 * @route   POST /api/chat/:sessionId/message
 * @desc    Send a message to a session chat
 * @access  Enrolled Student, Assigned Mentor
 */
chatRouter.post("/:sessionId/message", (req, res) => chatController.sendMessage(req, res));

/**
 * @route   POST /api/chat/:sessionId/initiate
 * @desc    Initiate a chat room (Internal/Admin/System use)
 * @access  Mentor, Admin
 */
chatRouter.post("/:sessionId/initiate", (req, res) => chatController.initiateChat(req, res));

export default chatRouter;
