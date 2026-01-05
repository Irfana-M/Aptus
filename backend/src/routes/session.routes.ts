import { Router } from "express";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { SessionController } from "../controllers/session.controller";
import type { ISessionService } from "../interfaces/services/ISessionService";
import { AuthMiddleware } from "../middleware/authMiddleware";
import { ROLES } from "../constants/roles";

const router = Router();
const sessionService = container.get<ISessionService>(TYPES.ISessionService);
const sessionController = new SessionController(sessionService);

router.get(
    "/student/upcoming",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorizeRole([ROLES.STUDENT]),
    (req, res, next) => sessionController.getStudentUpcomingSessions(req, res, next)
);

router.get(
    "/mentor/upcoming",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorizeRole([ROLES.MENTOR]),
    (req, res, next) => sessionController.getMentorUpcomingSessions(req, res, next)
);

router.get(
    "/mentor/today",
    AuthMiddleware.verifyToken,
    AuthMiddleware.authorizeRole([ROLES.MENTOR]),
    (req, res, next) => sessionController.getMentorTodaySessions(req, res, next)
);

export default router;
