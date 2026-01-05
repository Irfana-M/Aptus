import { Router } from "express";
import { ADMIN_ROUTES } from "../constants/routes";
import { AdminController } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/role.middleware";
import { container } from "@/inversify.config";
import { TYPES } from "@/types";
import { CourseAdminController } from "@/controllers/courseAdmin.controller";
import { StudentController } from "@/controllers/student.controller";
import { HttpStatusCode } from "@/constants/httpStatus";

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
import { EnrollmentController } from "@/controllers/enrollment.controller";
const enrollmentController = container.get<EnrollmentController>(TYPES.EnrollmentController);

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
  validateObjectId("mentorId"),
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
import { validateBody, validateObjectId } from "../middleware/validate.middleware";
import { updateMentorProfileSchema } from "../validators/mentor.validator";
import { updateStudentProfileSchema } from "../validators/student.validator";



adminRouter.put(
  ADMIN_ROUTES.MENTOR_UPDATE,
  requireAuth,
  requireRole("admin"),
  validateObjectId("mentorId"),
  validateBody(updateMentorProfileSchema),
  adminController.updateMentor
);



adminRouter.put(
  ADMIN_ROUTES.STUDENT_UPDATE,
  requireAuth,
  requireRole("admin"),
  validateObjectId("studentId"),
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
  validateObjectId("studentId"),
  (req, res, next) => studentController.getStudentProfile(req, res, next)
);

adminRouter.get(
  ADMIN_ROUTES.AVAILABLE_MENTORS,
  requireAuth,
  requireRole("admin"),
  adminController.getAvailableMentors
);

adminRouter.post(
  ADMIN_ROUTES.COURSES_ONE_TO_ONE,
  requireAuth,
  requireRole("admin"),
  courseAdminController.createEnrollment
);
adminRouter.put(
  "/courses/one-to-one/:courseId",
  requireAuth,
  requireRole("admin"),
  courseAdminController.updateOneToOneCourse
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

adminRouter.get(
  ADMIN_ROUTES.ENROLLMENTS,
  requireAuth,
  requireRole("admin"),
  enrollmentController.getAllEnrollments
);




// [DEPRECATED] This route now internally delegates to the approval flow via AdminService.assignMentor
adminRouter.post(
  "/student/assign-mentor",
  requireAuth,
  requireRole("admin"),
  adminController.assignMentor
);


adminRouter.post(
  "/student/reassign-mentor",
  requireAuth,
  requireRole("admin"),
  adminController.reassignMentor
);


// Mentor Request routes
adminRouter.get(
  ADMIN_ROUTES.MENTOR_REQUESTS,
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const mentorRequestService = container.get<any>(TYPES.IMentorRequestService);
      const requests = await mentorRequestService.getPendingRequests();
      res.status(HttpStatusCode.OK).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  `${ADMIN_ROUTES.MENTOR_REQUESTS}/:requestId/approve`,
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { requestId } = req.params;
      const adminId = req.user?.id;
      const mentorRequestService = container.get<any>(TYPES.IMentorRequestService);
      await mentorRequestService.approveRequest(requestId, adminId);
      res.status(HttpStatusCode.OK).json({ success: true, message: "Request approved" });
    } catch (error) {
      next(error);
    }
  }
);

adminRouter.patch(
  `${ADMIN_ROUTES.MENTOR_REQUESTS}/:requestId/reject`,
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id;
      const mentorRequestService = container.get<any>(TYPES.IMentorRequestService);
      await mentorRequestService.rejectRequest(requestId, adminId, reason);
      res.status(HttpStatusCode.OK).json({ success: true, message: "Request rejected" });
    } catch (error) {
      next(error);
    }
  }
);

export default adminRouter;
