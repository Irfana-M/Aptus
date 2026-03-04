
import { Router } from "express";
import { container } from "../inversify.config.js";
import { TYPES } from "../types.js";
import { AvailabilityController } from "../controllers/availability.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = Router();
const availabilityController = container.get<AvailabilityController>(TYPES.AvailabilityController);

// Update Availability (Mentor only)
router.put(
  "/:mentorId",
  requireAuth,
  requireRole(["mentor", "admin"]),
  availabilityController.updateAvailability
);

// Get Availability
router.get(
  "/:mentorId",
  requireAuth,
  availabilityController.getAvailability
);

// Find Matches (Admin and Student)
router.get(
  "/match/find",
  requireAuth,
  requireRole(["admin", "student"]),
  requireRole(["admin", "student"]),
  availabilityController.findMatches
);

// Get Public Profile (Student view)
router.get(
  "/profile/:mentorId",
  requireAuth,
  requireRole(["student", "admin"]),
  availabilityController.getPublicProfile
);

export default router;
