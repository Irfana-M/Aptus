import { Router } from "express";
import { STUDENT_ROUTES } from "../constants/routes";
import { container } from "@/inversify.config";
import { TYPES } from "@/types";
import { TrialClassController } from "@/controllers/trialClass.controller";
import { GradeController } from "@/controllers/grade.controller";
import { SubjectController } from "@/controllers/subject.controller";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "@/middleware/role.middleware";

const studentRouter = Router();


const trialClassController = container.get<TrialClassController>(TYPES.TrialClassController);
const gradeController = container.get<GradeController>(TYPES.GradeController);
const subjectController = container.get<SubjectController>(TYPES.SubjectController);


studentRouter.post(
  STUDENT_ROUTES.TRIAL_CLASSES_REQUEST,
  requireAuth,
  requireRole("student"),
  trialClassController.createTrialRequest.bind(trialClassController)
);

studentRouter.get(
  STUDENT_ROUTES.TRIAL_CLASSES,
  requireAuth,
  requireRole("student"),
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
  trialClassController.updateTrialClass.bind(trialClassController)
);

// Submit feedback for trial class
studentRouter.post(
  STUDENT_ROUTES.TRIAL_CLASS_FEEDBACK,
  requireAuth,
  requireRole("student"),
  trialClassController.submitFeedback.bind(trialClassController)
);


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

// ... (existing imports)
import { CourseRequestController } from "@/controllers/courseRequest.controller";

// ... (existing controller instantiations)
const courseRequestController = container.get<CourseRequestController>(TYPES.CourseRequestController);

studentRouter.post(
  STUDENT_ROUTES.COURSE_REQUEST,
  requireAuth,
  requireRole("student"),
  courseRequestController.createRequest.bind(courseRequestController)
);

import { CourseController } from "@/controllers/course.controller";
const courseController = container.get<CourseController>(TYPES.CourseController);

studentRouter.get(
  STUDENT_ROUTES.AVAILABLE_COURSES,
  requireAuth,
  requireRole("student"),
  courseController.getAvailableCourses.bind(courseController)
);

// Get student's enrolled courses
studentRouter.get(
  STUDENT_ROUTES.MY_COURSES,
  requireAuth,
  requireRole("student"),
  courseController.getStudentCourses.bind(courseController)
);

// ... (existing exports)


import { StudentController } from "@/controllers/student.controller";
import upload from "../middleware/upload.middleware";

const studentController = container.get<StudentController>(TYPES.StudentController);

// GET own profile (for authenticated student)
studentRouter.get(
  STUDENT_ROUTES.PROFILE,
  requireAuth,
  requireRole("student"),
  studentController.getMyProfile.bind(studentController)
);

// UPDATE own profile
studentRouter.put(
  STUDENT_ROUTES.PROFILE,
  requireAuth,
  requireRole("student"),
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "idProof", maxCount: 1 }
  ]),
  // validateBody(updateStudentProfileSchema), // Skip validation for FormData with files
  studentController.updateProfile.bind(studentController)
);

// Wallet routes
studentRouter.get(
  "/wallet",
  requireAuth,
  requireRole("student"),
  studentController.getWallet.bind(studentController)
);

studentRouter.get(
  "/wallet/transactions",
  requireAuth,
  requireRole("student"),
  studentController.getTransactions.bind(studentController)
);

export default studentRouter;