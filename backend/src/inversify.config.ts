import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";

// Import ALL classes
import { AuthRepository } from "./repositories/auth.repository";
import { AdminRepository } from "./repositories/admin.repository";
import { MentorRepository } from "./repositories/mentorRepository";
import { StudentRepository } from "./repositories/studentRepository";
import { OtpRepository } from "./repositories/otp.repository";
import { StudentAuthRepository } from "./repositories/studentAuth.repository";
import { MentorAuthRepository } from "./repositories/mentorAuth.repository";
import { TrialClassRepository } from "./repositories/trialClass.repository";
import { GradeRepository } from "@/repositories/grade.repository";
import { SubjectRepository } from "@/repositories/subject.repository";
import { type IEnrollmentRepository, type CreateEnrollmentDto } from "./interfaces/repositories/IEnrollmentRepository";
import type { ISubjectRepository } from "@/interfaces/repositories/ISubjectRepository";
import type { ICourseRequestRepository } from "@/interfaces/repositories/ICourseRequestRepository";
// import type { ISessionService } from "./interfaces/services/ISessionService";
// import { SessionService } from "./services/session/session.service";
import type { IAttendanceService } from "./interfaces/services/IAttendanceService";
import { AttendanceService } from "./services/session/AttendanceService";
import { VideoCallRepository } from "./repositories/VideoCallRepository";
import { TimeSlotRepository } from "./repositories/timeSlot.repository";
import { BookingRepository } from "./repositories/booking.repository";
import { SubscriptionService } from "./services/subscription.service";
import { NotificationRepository } from "./repositories/notification.repository";
import { ChatRoomRepository } from "./repositories/chatRoom.repository";
import { ChatMessageRepository } from "./repositories/chatMessage.repository";
import { SchedulingOrchestrator } from "./services/scheduling/SchedulingOrchestrator";
import { SchedulingPolicy } from "./domain/scheduling/SchedulingPolicy";
import { TrialEligibilityPolicy } from "./domain/policy/TrialEligibilityPolicy";
import { SessionAttendancePolicy } from "./domain/policy/SessionAttendancePolicy";
import { NotificationService } from "./services/NotificationService";
import { NotificationManager } from "./services/NotificationManager";
import { SessionAccessService } from "./services/scheduling/SessionAccessService";
import { CronService } from "./services/CronService";
import { InternalEventEmitter } from "./utils/InternalEventEmitter";
import type { IEnrollmentLinkRepository } from "./interfaces/repositories/IEnrollmentLinkRepository";
import { EnrollmentLinkRepository } from "./repositories/enrollmentLink.repository";
import type { IAvailabilityRepository } from "./interfaces/repositories/IAvailabilityRepository";
import { AvailabilityRepository } from "./repositories/availability.repository";
import { MentorAssignmentRequestRepository } from "./repositories/mentorAssignmentRequest.repository";

import { AuthService } from "./services/auth.service";
import { AdminService } from "./services/admin.service";
import { MentorService } from "./services/mentor.services";
import { OtpService } from "./services/otp.services";
import { NodemailerService } from "./services/email.service";
import { ProfileService } from "./services/profile.service";
import { StudentService } from "./services/student.services";
import { TrialClassService } from "./services/trialClass.service";
import { GradeService } from "@/services/grade.service";
import { SubjectService } from "@/services/subject.service";
import { VideoCallService } from "./services/VideoCallService";
import { SocketService } from "./services/SocketService";
import { UserRoleService } from "./services/userRole.service";
import { SchedulingService } from "./services/scheduling.service";
import { ChatService } from "./services/scheduling/ChatService";

import { AuthController } from "./controllers/auth.controller";
import { AdminController } from "./controllers/admin.controller";
import { MentorController } from "./controllers/mentor.controller";
import { OtpController } from "./controllers/otp.controller";
import { TrialClassController } from "./controllers/trialClass.controller";
import { GradeController } from "@/controllers/grade.controller";
import { SubjectController } from "@/controllers/subject.controller";
import { RoleController } from "./controllers/role.controller";
import { VideoCallController } from "./controllers/videoCall.controller";
import { MentorTrialClassController } from "./controllers/mentorTrialClass.controller";
import { ChatController } from "./controllers/chat.controller";
import { CourseAdminController } from "./controllers/courseAdmin.controller";
import { CourseRepository } from "./repositories/course.repository";
import { CourseAdminService } from "./services/courseAdminService";
import { CourseService } from "./services/course.service";

// Session (Consolidated)
import { MentorRequestService } from "./services/mentorRequest.service";
import type { ISessionRepository } from "./interfaces/repositories/ISessionRepository";
import { SessionRepository } from "./repositories/session.repository";
import type { ISessionService } from "./interfaces/services/ISessionService";
import { SessionService } from "./services/session.service";
import { SessionController } from "./controllers/session.controller";

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

container.bind<IAttendanceService>(TYPES.IAttendanceService).to(AttendanceService);
container.bind(TYPES.IVideoCallService).to(VideoCallService);
container.bind(TYPES.ISocketService).to(SocketService).inSingletonScope();
container.bind(TYPES.IUserRoleService).to(UserRoleService);
container.bind(TYPES.ICourseAdminService).to(CourseAdminService);
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

// === CONTROLLERS ===
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.AdminController).to(AdminController);
container.bind(TYPES.MentorController).to(MentorController);
container.bind(TYPES.OtpController).to(OtpController);
container.bind(TYPES.TrialClassController).to(TrialClassController);
container.bind(TYPES.GradeController).to(GradeController);
container.bind(TYPES.SubjectController).to(SubjectController);
import { StudentController } from "./controllers/student.controller";

container.bind(TYPES.RoleController).to(RoleController);
container.bind(TYPES.VideoCallController).to(VideoCallController).inSingletonScope();
container.bind(TYPES.MentorTrialClassController).to(MentorTrialClassController);
container.bind(TYPES.StudentController).to(StudentController);
container.bind(TYPES.CourseAdminController).to(CourseAdminController);
container.bind(TYPES.ChatController).to(ChatController);


import { NotificationController } from "./controllers/notification.controller";



// Course Request Bindings
import { CourseRequestRepository } from "@/repositories/courseRequestRepository";
import { CourseRequestService } from "@/services/courseRequestService";
import { CourseRequestController } from "@/controllers/courseRequest.controller";

import type { ICourseRequestService } from "@/interfaces/services/ICourseRequestService";
import type { ISubjectService } from "@/interfaces/services/ISubjectService";

container
  .bind<ICourseRequestRepository>(TYPES.ICourseRequestRepository)
  .to(CourseRequestRepository);

container
  .bind<ICourseRequestService>(TYPES.ICourseRequestService)
  .to(CourseRequestService);

import { CourseController } from "@/controllers/course.controller";

container
  .bind<CourseRequestController>(TYPES.CourseRequestController)
  .to(CourseRequestController);

container
  .bind<CourseController>(TYPES.CourseController)
  .to(CourseController);

// Payment Bindings
import { PaymentService } from "./services/payment.service";
import { PaymentController } from "./controllers/payment.controller";

container.bind(TYPES.IPaymentService).to(PaymentService);
container.bind(TYPES.PaymentController).to(PaymentController);

// Enrollment Bindings
import { EnrollmentRepository } from "./repositories/enrollment.repository";
import type { IEnrollment } from "./models/enrollment.model";
import { EnrollmentService } from "./services/enrollment.service";
import { EnrollmentController } from "./controllers/enrollment.controller";

container.bind(TYPES.IEnrollmentRepository).to(EnrollmentRepository);
container.bind(TYPES.IEnrollmentService).to(EnrollmentService);
container.bind(TYPES.EnrollmentController).to(EnrollmentController);

// Mentor Dashboard Bindings
import { MentorDashboardService } from "./services/mentorDashboard.service";
import { MentorDashboardController } from "./controllers/mentorDashboard.controller";

container.bind(TYPES.IMentorDashboardService).to(MentorDashboardService);
container.bind(TYPES.MentorDashboardController).to(MentorDashboardController);

// Wallet Service Bindings
import { WalletService } from "./services/wallet.service";
// Availability Bindings
import { AvailabilityService } from "./services/availability.service";
import { AvailabilityController } from "./controllers/availability.controller";

container.bind(TYPES.IAvailabilityService).to(AvailabilityService);
container.bind(TYPES.AvailabilityController).to(AvailabilityController);

container.bind(TYPES.IWalletService).to(WalletService);

// Mentor Request
import type { IMentorRequestService } from "./interfaces/services/IMentorRequestService"; // Add import
container.bind<IMentorRequestService>(TYPES.IMentorRequestService).to(MentorRequestService);

// Session
container.bind<ISessionRepository>(TYPES.ISessionRepository).to(SessionRepository);
container.bind<ISessionService>(TYPES.ISessionService).to(SessionService);


export { container };