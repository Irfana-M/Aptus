import { Router } from "express";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { AttendanceController } from "../controllers/attendance.controller";
import { requireAuth } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/role.middleware";

const attendanceRouter = Router();
const attendanceController = container.get<AttendanceController>(TYPES.AttendanceController);

// All routes require authentication
attendanceRouter.use(requireAuth);

// Mark attendance as present (by session ID)
attendanceRouter.post("/session/:sessionId/present", attendanceController.markPresent.bind(attendanceController));
attendanceRouter.post("/session/:sessionId/absent", attendanceController.markAbsent.bind(attendanceController));
attendanceRouter.get("/history", attendanceController.getMyHistory.bind(attendanceController));
attendanceRouter.get("/all", attendanceController.getAllAttendance.bind(attendanceController));

// Get all attendance history (Admin only)
attendanceRouter.get("/admin/history", requireRole(['admin']), attendanceController.getAllAttendance.bind(attendanceController));

export { attendanceRouter };
