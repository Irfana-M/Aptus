import { Router } from "express";
import { MentorController } from "../controllers/mentor.controller";
import { MentorService } from "../services/mentor.services";
import { MentorRepository } from "../repositories/mentorRepository";
import { NodemailerService } from "../services/email.service.js";
import { MentorAuthRepository } from "../repositories/mentorAuth.repository";
import { requireAuth } from "../middleware/authMiddleware";
import upload from "../middleware/upload.middleware";

const mentorRouter = Router();

const mentorRepo = new MentorRepository();
const emailService = new NodemailerService();
const mentorAuthRepo = new MentorAuthRepository();
const mentorService = new MentorService(
  mentorAuthRepo,
  mentorRepo,
  emailService
);
const mentorController = new MentorController(mentorService);

mentorRouter.put(
  "/me/profile-update",
  requireAuth,
  upload.single("profilePicture"),
  mentorController.updateProfile
);

mentorRouter.post(
  "/me/submit-approval",
  requireAuth,
  mentorController.submitForApproval
);

export default mentorRouter;
