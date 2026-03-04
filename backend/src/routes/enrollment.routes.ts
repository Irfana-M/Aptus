import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollment.controller.js";
import { TYPES } from "../types.js";
import { container } from "../inversify.config.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

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
