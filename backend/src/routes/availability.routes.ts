
import { Router } from "express";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { AvailabilityController } from "../controllers/availability.controller";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/role.middleware";

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
  availabilityController.findMatches
);

export default router;
