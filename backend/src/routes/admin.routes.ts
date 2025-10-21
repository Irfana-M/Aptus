import { Router } from "express";
import { AdminRepository } from "../repositories/admin.repository.js";
import { AdminService } from "../services/admin.service.js";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { MentorRepository } from "../repositories/mentorRepository.js";
import { NodemailerService } from "../services/email.service.js";

const adminRouter = Router();


const adminRepo = new AdminRepository();
const mentorRepo = new MentorRepository();
const emailService = new NodemailerService();
const adminService = new AdminService(adminRepo, mentorRepo, emailService);
const adminController = new AdminController(adminService);


adminRouter.post("/login", adminController.login);
adminRouter.get("/dashboard", adminController.getDashboardData);


// Admin endpoints
adminRouter.get("/mentors/:mentorId", requireAuth, requireRole("admin"), adminController.getMentorProfile);
adminRouter.patch("/mentors/:mentorId/approve", requireAuth, requireRole("admin"), adminController.approveMentor);
adminRouter.patch("/mentors/:mentorId/reject", requireAuth, requireRole("admin"), adminController.rejectMentor);

export default adminRouter;
