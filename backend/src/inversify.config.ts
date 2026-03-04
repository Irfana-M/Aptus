import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types.js";

// Import ALL classes
import { AuthRepository } from "./repositories/auth.repository.js";
import { AdminRepository } from "./repositories/admin.repository.js";
import { MentorRepository } from "./repositories/mentorRepository.js";
import { StudentRepository } from "./repositories/studentRepository.js";
import { OtpRepository } from "./repositories/otp.repository.js";
import { StudentAuthRepository } from "./repositories/studentAuth.repository.js";
import { MentorAuthRepository } from "./repositories/mentorAuth.repository.js";
import { TrialClassRepository } from "./repositories/trialClass.repository.js";
import { GradeRepository } from "./repositories/grade.repository.js";
import { SubjectRepository } from "./repositories/subject.repository.js";
import type { ICourseRequestRepository } from "./interfaces/repositories/ICourseRequestRepository.js";
// import type { ISessionService } from "./interfaces/services/ISessionService";
// import { SessionService } from "./services/session/session.service";
import type { IAttendanceService } from "./interfaces/services/IAttendanceService.js";
import { AttendanceService } from "./services/session/AttendanceService.js";
import { VideoCallRepository } from "./repositories/VideoCallRepository.js";
import { TimeSlotRepository } from "./repositories/timeSlot.repository.js";
import { BookingRepository } from "./repositories/booking.repository.js";
import { SubscriptionService } from "./services/subscription.service.js";
import { NotificationRepository } from "./repositories/notification.repository.js";
import { ChatRoomRepository } from "./repositories/chatRoom.repository.js";
import { ChatMessageRepository } from "./repositories/chatMessage.repository.js";
import { SchedulingOrchestrator } from "./services/scheduling/SchedulingOrchestrator.js";
import { SchedulingPolicy } from "./domain/scheduling/SchedulingPolicy.js";
import { TrialEligibilityPolicy } from "./domain/policy/TrialEligibilityPolicy.js";
import { SessionAttendancePolicy } from "./domain/policy/SessionAttendancePolicy.js";
import { NotificationService } from "./services/NotificationService.js";
import { NotificationManager } from "./services/NotificationManager.js";
import { SessionAccessService } from "./services/scheduling/SessionAccessService.js";
import { CronService } from "./services/CronService.js";
import { InternalEventEmitter } from "./utils/InternalEventEmitter.js";
import type { IEnrollmentLinkRepository } from "./interfaces/repositories/IEnrollmentLinkRepository.js";
import { EnrollmentLinkRepository } from "./repositories/enrollmentLink.repository.js";
import type { IAvailabilityRepository } from "./interfaces/repositories/IAvailabilityRepository.js";
import { AvailabilityRepository } from "./repositories/availability.repository.js";
import { MentorAssignmentRequestRepository } from "./repositories/mentorAssignmentRequest.repository.js";
import { AttendanceRepository } from "./repositories/attendance.repository.js";
import type { IAttendanceRepository } from "./interfaces/repositories/IAttendanceRepository.js";

import { AuthService } from "./services/auth.service.js";
import { AdminService } from "./services/admin.service.js";
import { MentorService } from "./services/mentor.services.js";
import { OtpService } from "./services/otp.services.js";
import { NodemailerService } from "./services/email.service.js";
import { ProfileService } from "./services/profile.service.js";
import { StudentService } from "./services/student.services.js";
import { TrialClassService } from "./services/trialClass.service.js";
import { GradeService } from "./services/grade.service.js";
import { SubjectService } from "./services/subject.service.js";
import { VideoCallService } from "./services/VideoCallService.js";
import { SocketService } from "./services/SocketService.js";
import { UserRoleService } from "./services/userRole.service.js";
import { SchedulingService } from "./services/scheduling.service.js";
import { AvailabilityService } from "./services/availability.service.js";
import { ChatService } from "./services/scheduling/ChatService.js";
import { ImageService } from "./services/imageService.js";

import { AuthController } from "./controllers/auth.controller.js";
import { AdminController } from "./controllers/admin.controller.js";
import { MentorController } from "./controllers/mentor.controller.js";
import { OtpController } from "./controllers/otp.controller.js";
import { TrialClassController } from "./controllers/trialClass.controller.js";
import { GradeController } from "./controllers/grade.controller.js";
import { SubjectController } from "./controllers/subject.controller.js";
import { RoleController } from "./controllers/role.controller.js";
import { VideoCallController } from "./controllers/videoCall.controller.js";
import { MentorTrialClassController } from "./controllers/mentorTrialClass.controller.js";
import { AttendanceController } from "./controllers/attendance.controller.js";
import { ChatController } from "./controllers/chat.controller.js";
import { CourseAdminController } from "./controllers/courseAdmin.controller.js";
import { AvailabilityController } from "./controllers/availability.controller.js";
import { CourseRepository } from "./repositories/course.repository.js";
import { CourseAdminService } from "./services/courseAdminService.js";
import { CourseService } from "./services/course.service.js";

// Session (Consolidated)
import { MentorRequestService } from "./services/mentorRequest.service.js";
import type { ISessionRepository } from "./interfaces/repositories/ISessionRepository.js";
import { SessionRepository } from "./repositories/session.repository.js";
import type { ISessionService } from "./interfaces/services/ISessionService.js";
import { SessionService } from "./services/session.service.js";
import { SessionPolicyService } from "./services/session/SessionPolicyService.js";
import { LeaveEligibilityService } from "./services/scheduling/LeaveEligibilityService.js";
import type { ISessionPolicyService } from "./interfaces/services/ISessionPolicyService.js";
import type { ILeaveEligibilityService } from "./interfaces/services/ILeaveEligibilityService.js";

import { StudyMaterialRepository } from "./repositories/studyMaterial.repository.js";
import { StudyMaterialService } from "./services/studyMaterial.service.js";
import { StudyMaterialController } from "./controllers/studyMaterial.controller.js";
import type { IStudyMaterialRepository } from "./interfaces/repositories/IStudyMaterialRepository.js";
import type { IStudyMaterialService } from "./interfaces/services/IStudyMaterialService.js";
import { ExampleRepository } from "./repositories/ExampleRepository.js";
import { ExampleService } from "./services/ExampleService.js";
import { ExampleController } from "./controllers/example.controller.js";
import { PaymentRepository } from "./repositories/payment.repository.js";
import { SubscriptionRepository } from "./repositories/subscription.repository.js";
import type { IPaymentRepository } from "./interfaces/repositories/IPaymentRepository.js";
import type { ISubscriptionRepository } from "./interfaces/repositories/ISubscriptionRepository.js";

const container = new Container({ defaultScope: "Singleton" });

// === REPOSITORIES ===
container.bind(TYPES.IAuthRepository).to(AuthRepository);
container.bind(TYPES.IAdminRepository).to(AdminRepository);
container.bind(TYPES.IMentorRepository).to(MentorRepository);
container.bind(TYPES.IStudentRepository).to(StudentRepository);
container.bind(TYPES.IOtpRepository).to(OtpRepository);
container.bind(TYPES.IStudentAuthRepository).to(StudentAuthRepository);
container.bind(TYPES.IMentorAuthRepository).to(MentorAuthRepository);
container.bind(TYPES.IVerificationRepository).to(StudentAuthRepository);
container.bind(TYPES.ITrialClassRepository).to(TrialClassRepository);
container.bind(TYPES.IGradeRepository).to(GradeRepository);
container.bind(TYPES.ISubjectRepository).to(SubjectRepository);
container.bind(TYPES.IVideoCallRepository).to(VideoCallRepository);
container.bind(TYPES.ICourseRepository).to(CourseRepository);
container.bind(TYPES.ITimeSlotRepository).to(TimeSlotRepository);
container.bind(TYPES.IBookingRepository).to(BookingRepository);
container.bind(TYPES.INotificationRepository).to(NotificationRepository);

container.bind(TYPES.IChatRoomRepository).to(ChatRoomRepository);
container.bind(TYPES.IChatMessageRepository).to(ChatMessageRepository);
container.bind<IAvailabilityRepository>(TYPES.IAvailabilityRepository).to(AvailabilityRepository);
container.bind<IEnrollmentLinkRepository>(TYPES.IEnrollmentLinkRepository).to(EnrollmentLinkRepository);
container.bind(TYPES.IMentorAssignmentRequestRepository).to(MentorAssignmentRequestRepository);
container.bind<IAttendanceRepository>(TYPES.IAttendanceRepository).to(AttendanceRepository);
container.bind<IStudyMaterialRepository>(TYPES.IStudyMaterialRepository).to(StudyMaterialRepository);
container.bind(TYPES.IExampleRepository).to(ExampleRepository);
container.bind<IPaymentRepository>(TYPES.IPaymentRepository).to(PaymentRepository);
container.bind<ISubscriptionRepository>(TYPES.ISubscriptionRepository).to(SubscriptionRepository);

import { AssignmentSubmissionRepository } from "./repositories/studyMaterial.repository.js";
import type { IAssignmentSubmissionRepository } from "./interfaces/repositories/IAssignmentSubmissionRepository.js";
container.bind<IAssignmentSubmissionRepository>(TYPES.IAssignmentSubmissionRepository).to(AssignmentSubmissionRepository);

import { StudentSubjectRepository } from "./repositories/studentSubject.repository.js";
import type { IStudentSubjectRepository } from "./interfaces/repositories/IStudentSubjectRepository.js";
container.bind<IStudentSubjectRepository>(TYPES.IStudentSubjectRepository).to(StudentSubjectRepository);

import { MentorAvailabilityRepository } from "./repositories/mentorAvailability.repository.js";
import type { IMentorAvailabilityRepository } from "./interfaces/repositories/IMentorAvailabilityRepository.js";
container.bind<IMentorAvailabilityRepository>(TYPES.IMentorAvailabilityRepository).to(MentorAvailabilityRepository);

import { StudentEnrollmentRepository } from "./repositories/studentEnrollment.repository.js";
import type { IStudentEnrollmentRepository } from "./interfaces/repositories/IStudentEnrollmentRepository.js";
container.bind<IStudentEnrollmentRepository>(TYPES.IStudentEnrollmentRepository).to(StudentEnrollmentRepository);

// === DOMAIN POLICIES ===
container.bind<SchedulingPolicy>(TYPES.SchedulingPolicy).to(SchedulingPolicy);
container.bind<TrialEligibilityPolicy>(TYPES.TrialEligibilityPolicy).to(TrialEligibilityPolicy);
container.bind<SessionAttendancePolicy>(TYPES.SessionAttendancePolicy).to(SessionAttendancePolicy);

// === MAPS — FIXED FOR NEW INVERSIFY ===
container.bind(TYPES.VerificationRepositoryMap).toDynamicValue(() => {
  const map = new Map<string, unknown>();
  map.set('student', container.get(TYPES.IStudentAuthRepository));
  map.set('mentor', container.get(TYPES.IMentorAuthRepository));
  return map;
}).inSingletonScope();

container.bind(TYPES.AuthRepositoryMap).toDynamicValue(() => {
  const map = new Map<string, unknown>();
  map.set('student', container.get(TYPES.IStudentAuthRepository));
  map.set('mentor', container.get(TYPES.IMentorAuthRepository));
  return map;
}).inSingletonScope();

// === SERVICES ===
container.bind(TYPES.IStudentService).to(StudentService);
container.bind(TYPES.IAuthService).to(AuthService);
container.bind(TYPES.IAdminService).to(AdminService);
container.bind(TYPES.IMentorService).to(MentorService);
container.bind(TYPES.IOtpService).to(OtpService);
container.bind(TYPES.IEmailService).to(NodemailerService);
container.bind(TYPES.IProfileService).to(ProfileService);
container.bind(TYPES.ITrialClassService).to(TrialClassService);
container.bind(TYPES.IGradeService).to(GradeService);
container.bind<ISubjectService>(TYPES.ISubjectService).to(SubjectService);
container.bind(TYPES.ImageService).to(ImageService);

container.bind<IAttendanceService>(TYPES.IAttendanceService).to(AttendanceService);
container.bind(TYPES.IVideoCallService).to(VideoCallService);
container.bind(TYPES.ISocketService).to(SocketService).inSingletonScope();
container.bind(TYPES.IUserRoleService).to(UserRoleService);
container.bind(TYPES.ICourseAdminService).to(CourseAdminService);
container.bind(TYPES.IAvailabilityService).to(AvailabilityService);
container.bind(TYPES.ICourseService).to(CourseService);
container.bind(TYPES.ISchedulingService).to(SchedulingService);
container.bind(TYPES.SchedulingOrchestrator).to(SchedulingOrchestrator);
container.bind(TYPES.INotificationService).to(NotificationService);
container.bind(TYPES.INotificationManager).to(NotificationManager).inSingletonScope();
container.bind(TYPES.ISessionAccessService).to(SessionAccessService);
container.bind(TYPES.CronService).to(CronService);
container.bind(TYPES.IChatService).to(ChatService);
container.bind(TYPES.ISubscriptionService).to(SubscriptionService);
container.bind(TYPES.InternalEventEmitter).to(InternalEventEmitter).inSingletonScope();

import { PricingService } from "./services/session/PricingService.js";
container.bind(TYPES.IPricingService).to(PricingService);
container.bind<IStudyMaterialService>(TYPES.IStudyMaterialService).to(StudyMaterialService);
container.bind(TYPES.IExampleService).to(ExampleService);

import { BookingSyncService } from "./services/scheduling/BookingSyncService.js";
import type { IBookingSyncService } from "./interfaces/services/IBookingSyncService.js";
container.bind<IBookingSyncService>(TYPES.IBookingSyncService).to(BookingSyncService);

import { LeaveManagementService } from "./services/scheduling/LeaveManagementService.js";
import type { ILeaveManagementService } from "./interfaces/services/ILeaveManagementService.js";
container.bind<ILeaveManagementService>(TYPES.ILeaveManagementService).to(LeaveManagementService);

import { TimeSlotQueryService } from "./services/scheduling/TimeSlotQueryService.js";
import type { ITimeSlotQueryService } from "./interfaces/services/ITimeSlotQueryService.js";
container.bind<ITimeSlotQueryService>(TYPES.ITimeSlotQueryService).to(TimeSlotQueryService);

import { SlotGenerationService } from "./services/scheduling/SlotGenerationService.js";
import type { ISlotGenerationService } from "./interfaces/services/ISlotGenerationService.js";
container.bind<ISlotGenerationService>(TYPES.ISlotGenerationService).to(SlotGenerationService);

// === CONTROLLERS ===
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.AdminController).to(AdminController);
container.bind(TYPES.MentorController).to(MentorController);
container.bind(TYPES.OtpController).to(OtpController);
container.bind(TYPES.TrialClassController).to(TrialClassController);
container.bind(TYPES.GradeController).to(GradeController);
container.bind(TYPES.SubjectController).to(SubjectController);
import { StudentController } from "./controllers/student.controller.js";

container.bind(TYPES.RoleController).to(RoleController);
container.bind(TYPES.VideoCallController).to(VideoCallController).inSingletonScope();
container.bind(TYPES.MentorTrialClassController).to(MentorTrialClassController);
container.bind(TYPES.StudentController).to(StudentController);
container.bind(TYPES.CourseAdminController).to(CourseAdminController);
container.bind(TYPES.AvailabilityController).to(AvailabilityController);
container.bind<ChatController>(TYPES.ChatController).to(ChatController);
container.bind<AttendanceController>(TYPES.AttendanceController).to(AttendanceController);
container.bind(TYPES.StudyMaterialController).to(StudyMaterialController);
container.bind(TYPES.IExampleController).to(ExampleController);


import { SubscriptionController } from "./controllers/subscription.controller.js";
container.bind(TYPES.SubscriptionController).to(SubscriptionController);


// NotificationController import removed due to being unused



// Course Request Bindings
import { CourseRequestRepository } from "./repositories/courseRequestRepository.js";
import { CourseRequestService } from "./services/courseRequestService.js";
import { CourseRequestController } from "./controllers/courseRequest.controller.js";

import type { ICourseRequestService } from "./interfaces/services/ICourseRequestService.js";
import type { ISubjectService } from "./interfaces/services/ISubjectService.js";

container
  .bind<ICourseRequestRepository>(TYPES.ICourseRequestRepository)
  .to(CourseRequestRepository);

container
  .bind<ICourseRequestService>(TYPES.ICourseRequestService)
  .to(CourseRequestService);

import { CourseController } from "./controllers/course.controller.js";

container
  .bind<CourseRequestController>(TYPES.CourseRequestController)
  .to(CourseRequestController);

container
  .bind<CourseController>(TYPES.CourseController)
  .to(CourseController);

// Payment Bindings
import { PaymentService } from "./services/payment.service.js";
import { PaymentController } from "./controllers/payment.controller.js";

container.bind(TYPES.IPaymentService).to(PaymentService);
container.bind(TYPES.PaymentController).to(PaymentController);

// Enrollment Bindings
import { EnrollmentRepository } from "./repositories/enrollment.repository.js";
import { EnrollmentService } from "./services/enrollment.service.js";
import { EnrollmentController } from "./controllers/enrollment.controller.js";

container.bind(TYPES.IEnrollmentRepository).to(EnrollmentRepository);
container.bind(TYPES.IEnrollmentService).to(EnrollmentService);
container.bind(TYPES.EnrollmentController).to(EnrollmentController);

// Mentor Dashboard Bindings
import { MentorDashboardService } from "./services/mentorDashboard.service.js";
import { MentorDashboardController } from "./controllers/mentorDashboard.controller.js";

container.bind(TYPES.IMentorDashboardService).to(MentorDashboardService);
container.bind(TYPES.MentorDashboardController).to(MentorDashboardController);


// Mentor Request
import type { IMentorRequestService } from "./interfaces/services/IMentorRequestService.js"; // Add import
container.bind<IMentorRequestService>(TYPES.IMentorRequestService).to(MentorRequestService);

// Session
container.bind<ISessionRepository>(TYPES.ISessionRepository).to(SessionRepository);
container.bind<ISessionService>(TYPES.ISessionService).to(SessionService);
container.bind<ISessionPolicyService>(TYPES.ISessionPolicyService).to(SessionPolicyService);
container.bind<ILeaveEligibilityService>(TYPES.ILeaveEligibilityService).to(LeaveEligibilityService);


import type { IExamRepository } from "./interfaces/repositories/IExamRepository.js";
import { ExamRepository } from "./repositories/exam.repository.js";
import type { IExamService } from "./interfaces/services/IExamService.js";
import { ExamService } from "./services/exam.service.js";
import { ExamController } from "./controllers/exam.controller.js";
import { ExamAccessPolicyService } from "./services/exam/ExamAccessPolicyService.js";
import { ExamScoringService } from "./services/exam/ExamScoringService.js";
import { ExamResultEnricher } from "./services/exam/ExamResultEnricher.js";

// Exam Bindings
container
  .bind<IExamRepository>(TYPES.IExamRepository)
  .to(ExamRepository)
  .inSingletonScope();
container
  .bind<IExamService>(TYPES.IExamService)
  .to(ExamService)
  .inSingletonScope();
container
  .bind<ExamController>(TYPES.ExamController)
  .to(ExamController)
  .inSingletonScope();

container.bind(TYPES.ExamAccessPolicyService).to(ExamAccessPolicyService);
container.bind(TYPES.ExamScoringService).to(ExamScoringService);
container.bind(TYPES.ExamResultEnricher).to(ExamResultEnricher);

export { container };