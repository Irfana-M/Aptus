import { Router } from "express";
import { STUDENT_ROUTES } from "../constants/routes";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { TrialClassController } from "../controllers/trialClass.controller";
import { GradeController } from "../controllers/grade.controller";
import { SubjectController } from "../controllers/subject.controller";
import { requireAuth } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/role.middleware";
import { requireAccess } from "../middlewares/studentAccessMiddleware";
import { AccessState } from "../constants/accessControl";
import { validateBody } from "../middlewares/validate.middleware";
import { updateStudentProfileSchema } from "../validators/student.validator";
import type { ISessionService } from "../interfaces/services/ISessionService";
import type { ITimeSlotRepository } from "../interfaces/repositories/ITimeSlotRepository";
import type { ITimeSlot } from "../interfaces/models/timeSlot.interface";

import { StudyMaterialController } from "../controllers/studyMaterial.controller";

const studentRouter = Router();

const trialClassController = container.get<TrialClassController>(TYPES.TrialClassController);
const gradeController = container.get<GradeController>(TYPES.GradeController);
const subjectController = container.get<SubjectController>(TYPES.SubjectController);
const studyMaterialController = container.get<StudyMaterialController>(TYPES.StudyMaterialController);

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
  STUDENT_ROUTES.AVAILABLE_SLOTS,
  requireAuth,
  requireRole("student"),
  trialClassController.getAvailableSlots.bind(trialClassController)
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
import { CourseRequestController } from "../controllers/courseRequest.controller";
const courseRequestController = container.get<CourseRequestController>(TYPES.CourseRequestController);

studentRouter.post(
  STUDENT_ROUTES.COURSE_REQUEST,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  courseRequestController.createRequest.bind(courseRequestController)
);

import { CourseController } from "../controllers/course.controller";
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
import { StudentController } from "../controllers/student.controller";
import { upload } from "../middlewares/upload.middleware";
const studentController = container.get<StudentController>(TYPES.StudentController);
const sessionService = container.get<ISessionService>(TYPES.ISessionService);

studentRouter.get(
  "/sessions/upcoming",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  studentController.getUpcomingSessions.bind(studentController)
);

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
  validateBody(updateStudentProfileSchema),
  studentController.updateProfile.bind(studentController)
);

studentRouter.post(
  STUDENT_ROUTES.PREFERENCES,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.PAYMENT_REQUIRED),
  studentController.updatePreferences.bind(studentController)
);

studentRouter.post(
  "/preferences/save",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.PAYMENT_REQUIRED),
  studentController.updatePreferences.bind(studentController)
);

studentRouter.patch(
  STUDENT_ROUTES.PREFERENCES,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.PAYMENT_REQUIRED), // Minimum access to SET preferences is having paid
  studentController.updatePreferences.bind(studentController)
);

studentRouter.patch(
  "/preferences/basic",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.PAYMENT_REQUIRED),
  studentController.updateBasicPreferences.bind(studentController)
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


  // DEBUG ENDPOINT
  studentRouter.get(
    "/debug/session-status",
    requireAuth,
    async (req, res) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const studentId = req.user.id;
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            
            const bookings = await import("../models/scheduling/booking.model").then(m => m.BookingModel.find({ studentId, status: 'scheduled' }).lean());
            
            const debugInfo = {
                studentId,
                now: now.toISOString(),
                bookingCount: bookings.length,
                bookings: bookings,
                slotsFound: [] as unknown[],
                slotsInWindow: [] as unknown[]
            };

            if (bookings.length > 0) {
                const timeSlotIds = bookings.map(b => b.timeSlotId);
                const timeSlotRepo = container.get<ITimeSlotRepository>(TYPES.ITimeSlotRepository);
                
                const slots = await timeSlotRepo.find({ _id: { $in: timeSlotIds } });
                debugInfo.slotsFound = slots;
                debugInfo.slotsInWindow = slots.filter((s: ITimeSlot) => 
                    new Date(s.startTime) >= new Date(now.getTime() - 60 * 60 * 1000) && 
                    new Date(s.startTime) <= tomorrow
                );
            }
            
            res.json(debugInfo);
        } catch (error) {
            const err = error as Error;
            res.status(500).json({ error: err.message, stack: err.stack });
        }
    }
  );


studentRouter.get(
  STUDENT_ROUTES.STUDY_MATERIALS,
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  studyMaterialController.getStudentMaterials.bind(studyMaterialController)
);

// === ASSIGNMENT ROUTES ===

// Get student's assigned assignments
studentRouter.get(
  "/assignments",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  studyMaterialController.getStudentAssignments.bind(studyMaterialController)
);

// Submit assignment
studentRouter.post(
  "/assignments/:assignmentId/submit",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  upload.array("files", 5),
  studyMaterialController.submitAssignment.bind(studyMaterialController)
);

// Get my submission for an assignment (includes feedback)
studentRouter.get(
  "/assignments/:assignmentId/my-submission",
  requireAuth,
  requireRole("student"),
  requireAccess(AccessState.FULLY_QUALIFIED),
  studyMaterialController.getStudentSubmission.bind(studyMaterialController)
);

// Get download URL for file
studentRouter.get(
  "/download/:fileKey",
  requireAuth,
  requireRole("student"),
  studyMaterialController.getDownloadUrl.bind(studyMaterialController)
);
export default studentRouter;
