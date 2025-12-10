import { Router } from "express";
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
  "/trial-classes/request",
  requireAuth,
  requireRole("student"),
  trialClassController.createTrialRequest.bind(trialClassController)
);

studentRouter.get(
  "/trial-classes",
  requireAuth,
  requireRole("student"),
  trialClassController.getStudentTrialClasses.bind(trialClassController)
);

studentRouter.get(
  "/trial-classes/:id",
  requireAuth,
  requireRole("student"),
  trialClassController.getTrialClassById.bind(trialClassController)
);
studentRouter.patch(
  "/trial-classes/:id",
  requireAuth,
  requireRole("student"),
  trialClassController.updateTrialClass.bind(trialClassController)
);

// Submit feedback for trial class
studentRouter.post(
  "/trial-classes/:id/feedback",
  requireAuth,
  requireRole("student"),
  trialClassController.submitFeedback.bind(trialClassController)
);


studentRouter.get(
  "/grades",
  gradeController.getAllGrades.bind(gradeController)
);

studentRouter.get(
  "/grades/syllabus",
  gradeController.getGradesBySyllabus.bind(gradeController)
);


studentRouter.get(
  "/subjects",
  subjectController.getAllSubjects.bind(subjectController)
);

studentRouter.get(
  "/subjects/grade",
  subjectController.getSubjectsByGrade.bind(subjectController)
);

studentRouter.get(
  "/subjects/filter",
  subjectController.getSubjectsByGradeAndSyllabus.bind(subjectController)
);

// ... (existing imports)
import { CourseRequestController } from "@/controllers/courseRequest.controller";

// ... (existing controller instantiations)
const courseRequestController = container.get<CourseRequestController>(TYPES.CourseRequestController);

studentRouter.post(
  "/course-request",
  requireAuth,
  requireRole("student"),
  courseRequestController.createRequest.bind(courseRequestController)
);

import { CourseController } from "@/controllers/course.controller";
const courseController = container.get<CourseController>(TYPES.CourseController);

studentRouter.get(
  "/available-courses",
  requireAuth,
  requireRole("student"),
  courseController.getAvailableCourses.bind(courseController)
);

// ... (existing exports)

import { validateBody } from "../middleware/validate.middleware";
import { updateStudentProfileSchema } from "../validators/student.validator";
import { StudentController } from "@/controllers/student.controller";
import upload from "../middleware/upload.middleware";

const studentController = container.get<StudentController>(TYPES.StudentController);

studentRouter.put(
  "/profile",
  requireAuth,
  requireRole("student"),
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "idProof", maxCount: 1 }
  ]),
  // validateBody(updateStudentProfileSchema), // Skip validation for FormData with files
  studentController.updateProfile.bind(studentController)
);

export default studentRouter;