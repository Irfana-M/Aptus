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

export default studentRouter;