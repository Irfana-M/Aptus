// src/routes/mentor.routes.ts
import { Router } from "express";
import { MentorController } from "../controllers/mentor.controller.js";
import { MentorService } from "../services/mentor.services.js";
import { MentorRepository } from "../repositories/mentorRepository.js";
import { NodemailerService } from "../services/email.service.js";
import { requireRole } from "../middleware/role.middleware.js";
import { MentorAuthRepository } from "../repositories/mentorAuth.repository.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.middleware.js";

const mentorRouter = Router();




const mentorRepo = new MentorRepository();
const emailService = new NodemailerService();
const mentorAuthRepo = new MentorAuthRepository();
const mentorService = new MentorService(mentorAuthRepo, mentorRepo, emailService);
const mentorController = new MentorController(mentorService);

mentorRouter.put("/me/profile-update",requireAuth,upload.single("profilePicture"), mentorController.updateProfile);

// Mentor submits profile
mentorRouter.post("/me/submit-approval", requireAuth, mentorController.submitForApproval);

// Admin endpoints
mentorRouter.get("/admin/pending", requireAuth, requireRole("admin"), mentorController.getPending);
mentorRouter.post("/admin/:mentorId/approve", requireAuth, requireRole("admin"), mentorController.approve);
mentorRouter.post("/admin/:mentorId/reject", requireAuth, requireRole("admin"), mentorController.reject);

export default mentorRouter;
