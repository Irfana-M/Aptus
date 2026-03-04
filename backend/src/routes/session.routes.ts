import { Router } from "express";
import { container } from "../inversify.config.js";
import { TYPES } from "../types.js";
import { SessionController } from "../controllers/session.controller.js";
import type { ISessionService } from "../interfaces/services/ISessionService.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/role.middleware.js";


const router = Router();
const sessionService = container.get<ISessionService>(TYPES.ISessionService);
const sessionController = new SessionController(sessionService);

router.get(
    "/student/upcoming",
    requireAuth,
    requireRole(['student']),
    (req, res, next) => sessionController.getStudentUpcomingSessions(req, res, next)
);

router.get(
    "/mentor/upcoming",
    requireAuth,
    requireRole(['mentor']),
    (req, res, next) => sessionController.getMentorUpcomingSessions(req, res, next)
);

router.get(
    "/mentor/today",
    requireAuth,
    requireRole(['mentor']),
    (req, res, next) => sessionController.getMentorTodaySessions(req, res, next)
);

router.post(
    "/:sessionId/report-absence",
    requireAuth,
    requireRole(['student']),
    (req, res, next) => sessionController.reportAbsence(req, res, next)
);

router.post(
    "/:sessionId/cancel",
    requireAuth,
    requireRole(['mentor']),
    (req, res, next) => sessionController.cancelSession(req, res, next)
);

router.post(
    "/:sessionId/resolve-rescheduling",
    requireAuth,
    requireRole(['student']),
    (req, res, next) => sessionController.resolveRescheduling(req, res, next)
);

router.post(
    "/:sessionId/complete",
    requireAuth,
    requireRole(['mentor']),
    (req, res, next) => sessionController.completeSession(req, res, next)
);

export default router;
