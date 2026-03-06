import { Router } from "express";
import { ADMIN_ROUTES } from "../constants/routes.js";
import { AdminController } from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { container } from "../inversify.config.js";
import { TYPES } from "../types.js";
import { CourseAdminController } from "../controllers/courseAdmin.controller.js";
import { StudentController } from "../controllers/student.controller.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { type IMentorRequestService } from "../interfaces/services/IMentorRequestService.js";

import { validateBody, validateObjectId } from "../middlewares/validate.middleware.js";
import { updateMentorProfileSchema } from "../validators/mentor.validator.js";
import { updateStudentProfileSchema } from "../validators/student.validator.js";
const adminRouter = Router();

const adminController = container.get<AdminController>(TYPES.AdminController);
const courseAdminController = container.get<CourseAdminController>(
  TYPES.CourseAdminController
);


const studentController = container.get<StudentController>(TYPES.StudentController);
import { MentorController } from "../controllers/mentor.controller.js";
const mentorController = container.get<MentorController>(TYPES.MentorController);
import { CourseRequestController } from "../controllers/courseRequest.controller.js";
const courseRequestController = container.get<CourseRequestController>(TYPES.CourseRequestController);
import { PaymentController } from "../controllers/payment.controller.js";
const paymentController = container.get<PaymentController>(TYPES.PaymentController);
import { EnrollmentController } from "../controllers/enrollment.controller.js";
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
adminRouter.get(
  "/students/search",
  requireAuth,
  requireRole("admin"),
  adminController.searchStudents
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

adminRouter.post(
  "/courses/:courseId/enroll",
  requireAuth,
  requireRole("admin"),
  courseAdminController.enrollStudentToCourse
);

adminRouter.delete(
  "/courses/:courseId/unenroll/:studentId",
  requireAuth,
  requireRole("admin"),
  courseAdminController.unenrollStudentFromCourse
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
      const mentorRequestService = container.get<IMentorRequestService>(TYPES.IMentorRequestService);
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
      if (!requestId) {
  return res
    .status(HttpStatusCode.BAD_REQUEST)
    .json({ success: false, message: "Request ID is required" });
}
      const adminId = req.user?.id;
      if (!adminId) throw new Error("Admin ID not found");
      const mentorRequestService = container.get<IMentorRequestService>(TYPES.IMentorRequestService);
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
      if (!adminId) throw new Error("Admin ID not found");
      if (!requestId) {
  return res
    .status(HttpStatusCode.BAD_REQUEST)
    .json({ success: false, message: "Request ID is required" });
}
      const mentorRequestService = container.get<IMentorRequestService>(TYPES.IMentorRequestService);
      await mentorRequestService.rejectRequest(requestId, adminId, reason);
      res.status(HttpStatusCode.OK).json({ success: true, message: "Request rejected" });
    } catch (error) {
      next(error);
    }
  }
);
adminRouter.patch(
  ADMIN_ROUTES.MENTOR_LEAVE_APPROVE,
  requireAuth,
  requireRole("admin"),
  mentorController.approveLeave
);
adminRouter.patch(
  ADMIN_ROUTES.MENTOR_LEAVE_REJECT,
  requireAuth,
  requireRole("admin"),
  mentorController.rejectLeave
);
adminRouter.get(
  ADMIN_ROUTES.ALL_LEAVES,
  requireAuth,
  requireRole("admin"),
  mentorController.getAllLeaves
);

export default adminRouter;
