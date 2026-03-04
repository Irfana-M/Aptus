import { Router } from "express";
import { container } from "../inversify.config.js";
import { TYPES } from "../types.js";
import { ExamController } from "../controllers/exam.controller.js";
import { AuthMiddleware } from "../middlewares/authMiddleware.js";
import { requireAccess } from "../middlewares/studentAccessMiddleware.js";
import { AccessState } from "../constants/accessControl.js";

const examRouter = Router();
const examController = container.get<ExamController>(TYPES.ExamController);

// Mentor Routes
examRouter.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorizeRole("mentor"),
  examController.createExam
);

examRouter.get(
  "/mentor/my-exams",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorizeRole("mentor"),
  examController.getExamsByMentor
);

// Student Results specific route - specific routes must be defined before generic parameter routes
examRouter.get(
  "/student/results",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorizeRole("student"),
  requireAccess(AccessState.PROFILE_COMPLETION), 
  examController.getStudentResults
);

examRouter.get(
  "/:examId/results",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorizeRole("mentor"),
  examController.getExamResults
);

examRouter.patch(
  "/results/:resultId/grade",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorizeRole("mentor"),
  examController.gradeExam
);



examRouter.post(
  "/submit",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorizeRole("student"),
  requireAccess(AccessState.PROFILE_COMPLETION), 
  examController.submitExam
);

// Student Routes - Get exams available for logged-in student based on their enrolled subjects/grades
examRouter.get(
  "/student",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorizeRole("student"),
  requireAccess(AccessState.PROFILE_COMPLETION),
  examController.getExamsForStudent
);

examRouter.get(
  "/:id",
  AuthMiddleware.verifyToken,
  examController.getExamById
);

export default examRouter;
