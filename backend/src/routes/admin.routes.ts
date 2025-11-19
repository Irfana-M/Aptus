import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/role.middleware";
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
adminRouter.get(
  "/students-with-stats",
  adminController.getStudentsWithTrialStats
);
adminRouter.post("/refresh", adminController.refreshAccessToken);
adminRouter.post(
  "/students",
  requireAuth,
  requireRole("admin"),
  adminController.addStudent
);
adminRouter.post(
  "/mentors",
  requireAuth,
  requireRole("admin"),
  adminController.addMentor
);
adminRouter.patch(
  "/mentors/:mentorId/block",
  requireAuth,
  requireRole("admin"),
  adminController.blockMentor
);
adminRouter.patch(
  "/mentors/:mentorId/unBlock",
  requireAuth,
  requireRole("admin"),
  adminController.unblockMentor
);
adminRouter.put(
  "/mentors/:mentorId",
  requireAuth,
  requireRole("admin"),
  adminController.updateMentor
);
adminRouter.patch(
  "/students/:studentId/block",
  requireAuth,
  requireRole("admin"),
  adminController.blockStudent
);
adminRouter.patch(
  "/students/:studentId/unblock",
  requireAuth,
  requireRole("admin"),
  adminController.unblockStudent
);
adminRouter.put(
  "/students/:studentId",
  requireAuth,
  requireRole("admin"),
  adminController.updateStudent
);


adminRouter.get(
  "/trial-classes",
  requireAuth,
  requireRole("admin"),
  adminController.getAllTrialClasses
);

adminRouter.get(
  "/trial-classes/:trialClassId",
  requireAuth,
  requireRole("admin"),
  adminController.getTrialClassDetails
);

adminRouter.patch(
  "/trial-classes/:trialClassId/assign-mentor",
  requireAuth,
  requireRole("admin"),
  adminController.assignMentorToTrialClass
);

adminRouter.patch(
  "/trial-classes/:trialClassId/status",
  requireAuth,
  requireRole("admin"),
  adminController.updateTrialClassStatus
);

adminRouter.get(
  "/students/:studentId/trial-classes",
  requireAuth,
  requireRole("admin"),
  adminController.getStudentTrialClasses
);
adminRouter.get(
  "/available-mentors",
  requireAuth,
  requireRole("admin"),
  adminController.getAvailableMentors
);
export default adminRouter;
