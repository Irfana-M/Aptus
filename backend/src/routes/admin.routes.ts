import { Router } from "express";
import { ADMIN_ROUTES } from "../constants/routes";
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
import { CourseRequestController } from "@/controllers/courseRequest.controller";
const courseRequestController = container.get<CourseRequestController>(TYPES.CourseRequestController);
import { PaymentController } from "@/controllers/payment.controller";
const paymentController = container.get<PaymentController>(TYPES.PaymentController);

adminRouter.post(ADMIN_ROUTES.LOGIN, adminController.login);
adminRouter.get(
  ADMIN_ROUTES.DASHBOARD,
  requireAuth,
  requireRole("admin"),
  adminController.getDashboardData
);

adminRouter.get(
  ADMIN_ROUTES.MENTORS,
  requireAuth,
  requireRole("admin"),
  adminController.getAllMentors
);

adminRouter.get(
  ADMIN_ROUTES.MENTORS_AVAILABLE_FOR_COURSE,
  requireAuth,
  requireRole("admin"),
  courseAdminController.getAvailableMentors
);

adminRouter.get(
  ADMIN_ROUTES.MENTOR_PROFILE,
  requireAuth,
  requireRole("admin"),
  adminController.getMentorProfile
);
adminRouter.patch(
  ADMIN_ROUTES.MENTOR_APPROVE,
  requireAuth,
  requireRole("admin"),
  adminController.approveMentor
);
adminRouter.patch(
  ADMIN_ROUTES.MENTOR_REJECT,
  requireAuth,
  requireRole("admin"),
  adminController.rejectMentor
);
adminRouter.get(
  ADMIN_ROUTES.STUDENTS,
  requireAuth,
  requireRole("admin"),
  adminController.getAllStudents
);
adminRouter.get(
  ADMIN_ROUTES.STUDENTS_WITH_STATS,
  requireAuth,
  requireRole("admin"),
  adminController.getStudentsWithTrialStats
);

adminRouter.post(ADMIN_ROUTES.REFRESH, adminController.refreshAccessToken);
adminRouter.post(
  ADMIN_ROUTES.STUDENTS,
  requireAuth,
  requireRole("admin"),
  adminController.addStudent
);
adminRouter.post(
  ADMIN_ROUTES.MENTORS,
  requireAuth,
  requireRole("admin"),
  adminController.addMentor
);
adminRouter.patch(
  ADMIN_ROUTES.MENTOR_BLOCK,
  requireAuth,
  requireRole("admin"),
  adminController.blockMentor
);
adminRouter.patch(
  ADMIN_ROUTES.MENTOR_UNBLOCK,
  requireAuth,
  requireRole("admin"),
  adminController.unblockMentor
);
import { validateBody } from "../middleware/validate.middleware";
import { updateMentorProfileSchema } from "../validators/mentor.validator";
import { updateStudentProfileSchema } from "../validators/student.validator";



adminRouter.put(
  ADMIN_ROUTES.MENTOR_UPDATE,
  requireAuth,
  requireRole("admin"),
  validateBody(updateMentorProfileSchema),
  adminController.updateMentor
);



adminRouter.put(
  ADMIN_ROUTES.STUDENT_UPDATE,
  requireAuth,
  requireRole("admin"),
  validateBody(updateStudentProfileSchema),
  adminController.updateStudent
);

adminRouter.get(
  ADMIN_ROUTES.TRIAL_CLASSES,
  requireAuth,
  requireRole("admin"),
  adminController.getAllTrialClasses
);

adminRouter.get(
  ADMIN_ROUTES.TRIAL_CLASS_DETAILS,
  requireAuth,
  requireRole("admin"),
  adminController.getTrialClassDetails
);

adminRouter.patch(
  ADMIN_ROUTES.TRIAL_CLASS_ASSIGN_MENTOR,
  requireAuth,
  requireRole("admin"),
  adminController.assignMentorToTrialClass
);

adminRouter.patch(
  ADMIN_ROUTES.TRIAL_CLASS_STATUS,
  requireAuth,
  requireRole("admin"),
  adminController.updateTrialClassStatus
);

adminRouter.get(
  ADMIN_ROUTES.STUDENT_TRIAL_CLASSES,
  requireAuth,
  requireRole("admin"),
  adminController.getStudentTrialClasses
);

// Get complete student profile (must come after specific routes)
adminRouter.get(
  ADMIN_ROUTES.STUDENT_PROFILE,
  requireAuth,
  requireRole("admin"),
  (req, res, next) => studentController.getStudentProfile(req, res, next)
);

adminRouter.get(
  ADMIN_ROUTES.AVAILABLE_MENTORS,
  requireAuth,
  requireRole("admin"),
  adminController.getAvailableMentors
);

adminRouter.get(
  ADMIN_ROUTES.MENTORS_AVAILABLE_FOR_COURSE,
  requireAuth,
  requireRole("admin"),
  courseAdminController.getAvailableMentors
);
adminRouter.post(
  ADMIN_ROUTES.COURSES_ONE_TO_ONE,
  requireAuth,
  requireRole("admin"),
  courseAdminController.createOneToOneCourse
);
adminRouter.get(
  ADMIN_ROUTES.ALL_COURSES,
  requireAuth,
  requireRole("admin"),
  courseAdminController.getAllOneToOneCourses
);
adminRouter.get(
  ADMIN_ROUTES.GRADES,
  requireAuth,
  requireRole("admin"),
  courseAdminController.getAllGrades
);
adminRouter.get(
  ADMIN_ROUTES.SUBJECTS,
  requireAuth,
  requireRole("admin"),
  courseAdminController.getSubjectsByGrade
);

adminRouter.get(
  ADMIN_ROUTES.COURSE_REQUESTS,
  requireAuth,
  requireRole("admin"),
  courseRequestController.getAllRequests
);

adminRouter.patch(
  ADMIN_ROUTES.COURSE_REQUEST_STATUS,
  requireAuth,
  requireRole("admin"),
  courseRequestController.updateStatus
);

adminRouter.get(
  "/finance/transactions",
  requireAuth,
  requireRole("admin"),
  paymentController.getAllPayments
);



export default adminRouter;
