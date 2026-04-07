import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { TYPES } from "../types";
import { container } from "../inversify.config";
import { requireAuth } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/role.middleware";

const enrollmentRouter = Router();


const enrollmentController = container.get<EnrollmentController>(TYPES.EnrollmentController);


enrollmentRouter.post(
  "/enroll/:courseId",
  requireAuth,
  requireRole("student"),
  enrollmentController.enrollInCourse
);

enrollmentRouter.get(
  "/my-enrollments",
  requireAuth,
  requireRole("student"),
  enrollmentController.getMyEnrollments
);

enrollmentRouter.patch(
  "/:enrollmentId/status",
  requireAuth,
  enrollmentController.updateEnrollmentStatus
);

export default enrollmentRouter;
