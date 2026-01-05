import { Router } from "express";
import { STUDENT_ROUTES } from "../constants/routes";
import { container } from "@/inversify.config";
import { TYPES } from "@/types";
import { TrialClassController } from "@/controllers/trialClass.controller";
import { GradeController } from "@/controllers/grade.controller";
import { SubjectController } from "@/controllers/subject.controller";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "@/middleware/role.middleware";
import { requireAccess } from "@/middleware/studentAccessMiddleware";
import { AccessState } from "@/constants/accessControl";

const studentRouter = Router();

const trialClassController = container.get<TrialClassController>(TYPES.TrialClassController);
const gradeController = container.get<GradeController>(TYPES.GradeController);
const subjectController = container.get<SubjectController>(TYPES.SubjectController);

// === TRIAL CLASS ROUTES ===
studentRouter.post(
  STUDENT_ROUTES.TRIAL_CLASSES_REQUEST,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.TRIAL_BOOKING),
  trialClassController.createTrialRequest.bind(trialClassController)
);

studentRouter.get(
  STUDENT_ROUTES.TRIAL_CLASSES,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.TRIAL_BOOKING),
  trialClassController.getStudentTrialClasses.bind(trialClassController)
);

studentRouter.get(
  STUDENT_ROUTES.TRIAL_CLASS_BY_ID,
  requireAuth,
  requireRole(["student", "mentor"]),
  trialClassController.getTrialClassById.bind(trialClassController)
);

studentRouter.patch(
  STUDENT_ROUTES.TRIAL_CLASS_BY_ID,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.TRIAL_BOOKING),
  trialClassController.updateTrialClass.bind(trialClassController)
);

studentRouter.post(
  STUDENT_ROUTES.TRIAL_CLASS_FEEDBACK,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.TRIAL_BOOKING),
  trialClassController.submitFeedback.bind(trialClassController)
);

// === GRADE & SUBJECT ROUTES (Public-ish/General Access) ===
studentRouter.get(
  STUDENT_ROUTES.GRADES,
  gradeController.getAllGrades.bind(gradeController)
);

studentRouter.get(
  STUDENT_ROUTES.GRADES_SYLLABUS,
  gradeController.getGradesBySyllabus.bind(gradeController)
);

studentRouter.get(
  STUDENT_ROUTES.SUBJECTS,
  subjectController.getAllSubjects.bind(subjectController)
);

studentRouter.get(
  STUDENT_ROUTES.SUBJECTS_GRADE,
  subjectController.getSubjectsByGrade.bind(subjectController)
);

studentRouter.get(
  STUDENT_ROUTES.SUBJECTS_FILTER,
  subjectController.getSubjectsByGradeAndSyllabus.bind(subjectController)
);

// === FULL ACCESS ROUTES (Requires Active Subscription) ===
import { CourseRequestController } from "@/controllers/courseRequest.controller";
const courseRequestController = container.get<CourseRequestController>(TYPES.CourseRequestController);

studentRouter.post(
  STUDENT_ROUTES.COURSE_REQUEST,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  courseRequestController.createRequest.bind(courseRequestController)
);

import { CourseController } from "@/controllers/course.controller";
const courseController = container.get<CourseController>(TYPES.CourseController);

studentRouter.get(
  STUDENT_ROUTES.AVAILABLE_COURSES,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  courseController.getAvailableCourses.bind(courseController)
);

studentRouter.get(
  STUDENT_ROUTES.MY_COURSES,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  courseController.getStudentCourses.bind(courseController)
);

// === ACCOUNT & PROFILE ROUTES ===
import { StudentController } from "@/controllers/student.controller";
import upload from "../middleware/upload.middleware";
const studentController = container.get<StudentController>(TYPES.StudentController);

studentRouter.get(
  STUDENT_ROUTES.PROFILE,
  requireAuth,
  requireRole("student"),
  // Note: Profile viewing only requires successful registration/verification
  requireAccess(AccessState.PROFILE_COMPLETION), 
  studentController.getMyProfile.bind(studentController)
);

studentRouter.put(
  STUDENT_ROUTES.PROFILE,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.PROFILE_COMPLETION),
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "idProof", maxCount: 1 }
  ]),
  studentController.updateProfile.bind(studentController)
);

studentRouter.patch(
  STUDENT_ROUTES.PREFERENCES,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.PAYMENT_REQUIRED), // Minimum access to SET preferences is having paid
  studentController.updatePreferences.bind(studentController)
);

studentRouter.post(
  "/request-mentor",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.PAYMENT_REQUIRED),
  studentController.requestMentor.bind(studentController)
);

studentRouter.get(
  "/mentor-requests",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.PAYMENT_REQUIRED),
  studentController.getMyMentorRequests.bind(studentController)
);

studentRouter.get(
  "/wallet",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  studentController.getWallet.bind(studentController)
);

studentRouter.get(
  "/wallet/transactions",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  studentController.getTransactions.bind(studentController)
);

export default studentRouter;
