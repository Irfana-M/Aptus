import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/role.middleware";
import { container } from "@/inversify.config";
import { TYPES } from "@/types";
import { CourseAdminController } from "@/controllers/courseAdmin.controller";
import { StudentController } from "@/controllers/student.controller";

const adminRouter = Router();

const adminController = container.get<AdminController>(TYPES.AdminController);
const courseAdminController = container.get<CourseAdminController>(
  TYPES.CourseAdminController
);
const studentController = container.get<StudentController>(TYPES.StudentController);

adminRouter.post("/login", adminController.login);
adminRouter.get(
  "/dashboard",
  requireAuth,
  requireRole("admin"),
  adminController.getDashboardData
);

adminRouter.get(
  "/mentors",
  requireAuth,
  requireRole("admin"),
  adminController.getAllMentors
);
// Specific mentor routes must come before /:mentorId
adminRouter.get(
  "/mentors/available-for-course",
  requireAuth,
  requireRole("admin"),
  courseAdminController.getAvailableMentors
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
  requireAuth,
  requireRole("admin"),
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
import { validateBody } from "../middleware/validate.middleware";
import { updateMentorProfileSchema } from "../validators/mentor.validator";
import { updateStudentProfileSchema } from "../validators/student.validator";

// ... existing code ...

adminRouter.put(
  "/mentors/:mentorId",
  requireAuth,
  requireRole("admin"),
  validateBody(updateMentorProfileSchema),
  adminController.updateMentor
);

// ... existing code ...

adminRouter.put(
  "/students/:studentId",
  requireAuth,
  requireRole("admin"),
  validateBody(updateStudentProfileSchema),
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

// Get complete student profile (must come after specific routes)
adminRouter.get(
  "/students/:studentId/profile",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => studentController.getStudentProfile(req, res, next)
);

adminRouter.get(
  "/available-mentors",
  requireAuth,
  requireRole("admin"),
  adminController.getAvailableMentors
);

adminRouter.get(
  "/mentors/available-for-course",
  requireAuth,
  requireRole("admin"),
  courseAdminController.getAvailableMentors
);
adminRouter.post(
  "/courses/one-to-one",
  requireAuth,
  requireRole("admin"),
  courseAdminController.createOneToOneCourse
);
adminRouter.get(
  "/courses/getAllCourses",
  requireAuth,
  requireRole("admin"),
  courseAdminController.getAllOneToOneCourses
);
adminRouter.get(
  "/grades",
  requireAuth,
  requireRole("admin"),
  courseAdminController.getAllGrades
);
adminRouter.get(
  `/subjects`,
  requireAuth,
  requireRole("admin"),
  courseAdminController.getSubjectsByGrade
);

export default adminRouter;
