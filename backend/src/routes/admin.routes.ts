import { Router } from "express";
import { AdminRepository } from "../repositories/admin.repository";
import { AdminService } from "../services/admin.service";
import { AdminController } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/role.middleware";
import { MentorRepository } from "../repositories/mentorRepository";
import { NodemailerService } from "../services/email.service";
import { StudentRepository } from "@/repositories/studentRepository";
import { container } from "@/inversify.config";
import { TYPES } from "@/types";

const adminRouter = Router();

const adminController = container.get<AdminController>(TYPES.AdminController);

adminRouter.post("/login", adminController.login);
adminRouter.get("/dashboard", adminController.getDashboardData);

adminRouter.get(
  "/mentors",
  requireAuth,
  requireRole("admin"),
  adminController.getAllMentors
);
adminRouter.get(
  "/mentors/:mentorId",
  requireAuth,
  requireRole("admin"),
  adminController.getMentorProfile
);
adminRouter.patch(
  "/mentors/:mentorId/approve",
  requireAuth,
  requireRole("admin"),
  adminController.approveMentor
);
adminRouter.patch(
  "/mentors/:mentorId/reject",
  requireAuth,
  requireRole("admin"),
  adminController.rejectMentor
);
adminRouter.get(
  "/students",
  requireAuth,
  requireRole("admin"),
  adminController.getAllStudents
);
adminRouter.post("/refresh", adminController.refreshAccessToken);

export default adminRouter;
