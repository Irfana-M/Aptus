const TYPES = {
  // Repositories
  IAuthRepository: Symbol.for("IAuthRepository"),
  IAdminRepository: Symbol.for("IAdminRepository"),
  IMentorRepository: Symbol.for("IMentorRepository"),
  IStudentRepository: Symbol.for("IStudentRepository"),
  IOtpRepository: Symbol.for("IOtpRepository"),
  IStudentAuthRepository: Symbol.for("IStudentAuthRepository"),
  IMentorAuthRepository: Symbol.for("IMentorAuthRepository"),
  IVerificationRepository: Symbol.for("IVerificationRepository"),
  ITrialClassRepository: Symbol.for("ITrialClassRepository"),
  IGradeRepository: Symbol.for("IGradeRepository"),
  ISubjectRepository: Symbol.for("ISubjectRepository"),
  IVideoCallRepository: Symbol.for("IVideoCallRepository"),
  VerificationRepositoryMap: Symbol.for("VerificationRepositoryMap"),
  AuthRepositoryMap: Symbol.for("AuthRepositoryMap"),
  ICourseRepository: Symbol.for("ICourseRepository"),
  ITimeSlotRepository: Symbol.for("ITimeSlotRepository"),
  IBookingRepository: Symbol.for("IBookingRepository"),
  IEnrollmentRepository: Symbol.for("IEnrollmentRepository"),
  INotificationRepository: Symbol.for("INotificationRepository"),
  ISessionRepository: Symbol.for("ISessionRepository"),
  IChatRoomRepository: Symbol.for("IChatRoomRepository"),
  IChatMessageRepository: Symbol.for("IChatMessageRepository"),
  IAvailabilityRepository: Symbol.for("IAvailabilityRepository"),
  IEnrollmentLinkRepository: Symbol.for("IEnrollmentLinkRepository"),
  IMentorAssignmentRequestRepository: Symbol.for("IMentorAssignmentRequestRepository"),


  // Services
  IAuthService: Symbol.for("IAuthService"),
  IAdminService: Symbol.for("IAdminService"),
  IMentorService: Symbol.for("IMentorService"),
  IStudentService: Symbol.for("IStudentService"),
  IOtpService: Symbol.for("IOtpService"),
  IEmailService: Symbol.for("IEmailService"),
  IProfileService: Symbol.for("IProfileService"),
  ImageService: Symbol.for("ImageService"),
  ITrialClassService: Symbol.for("ITrialClassService"),
  IGradeService: Symbol.for("IGradeService"),
  ISubjectService: Symbol.for("ISubjectService"),
  IVideoCallService: Symbol.for("IVideoCallService"),
  ISocketService: Symbol.for("ISocketService"),
  IUserRoleService: Symbol.for('IUserRoleService'),
  ICourseAdminService: Symbol.for('ICourseAdminService'),
  IAvailabilityService: Symbol.for('IAvailabilityService'),
  ISchedulingService: Symbol.for('ISchedulingService'),
  IPaymentService: Symbol.for("IPaymentService"),
  IEnrollmentService: Symbol.for("IEnrollmentService"),
  ISessionService: Symbol.for("ISessionService"), // New Session Domain Service
  IAttendanceService: Symbol.for("IAttendanceService"),
  IMentorDashboardService: Symbol.for("IMentorDashboardService"),
  IWalletService: Symbol.for("IWalletService"),
  INotificationService: Symbol.for("INotificationService"),
  INotificationManager: Symbol.for("INotificationManager"),
  ISessionAccessService: Symbol.for("ISessionAccessService"),
  IChatService: Symbol.for("IChatService"),
  ISubscriptionService: Symbol.for("ISubscriptionService"),

  // Controllers
  AuthController: Symbol.for("AuthController"),
  AdminController: Symbol.for("AdminController"),
  MentorController: Symbol.for("MentorController"),
  OtpController: Symbol.for("OtpController"),
  TrialClassController: Symbol.for("TrialClassController"),
  GradeController: Symbol.for("GradeController"),
  SubjectController: Symbol.for("SubjectController"),
  RoleController: Symbol.for("RoleController"),
  VideoCallController: Symbol.for("VideoCallController"),
  MentorTrialClassController: Symbol.for("MentorTrialClassController"),
  StudentController: Symbol.for("StudentController"),
  CourseAdminController: Symbol.for("CourseAdminController"),
  PaymentController: Symbol.for("PaymentController"),
  AvailabilityController: Symbol.for("AvailabilityController"),
  EnrollmentController: Symbol.for("EnrollmentController"),
  MentorDashboardController: Symbol.for("MentorDashboardController"),
  ChatController: Symbol.for("ChatController"),

  // Middleware
  AuthMiddleware: Symbol.for("AuthMiddleware"),
  RoleMiddleware: Symbol.for("RoleMiddleware"),

  // Utils
  PassportConfig: Symbol.for("PassportConfig"),
  EmailService: Symbol.for("EmailService"),

  // Course Request
  ICourseRequestRepository: Symbol.for("ICourseRequestRepository"),
  ICourseRequestService: Symbol.for("ICourseRequestService"),
  CourseRequestController: Symbol.for("CourseRequestController"),
  CourseController: Symbol.for("CourseController"),
  ICourseService: Symbol.for("ICourseService"),

  // Policies
  SchedulingPolicy: Symbol.for("SchedulingPolicy"),
  TrialEligibilityPolicy: Symbol.for("TrialEligibilityPolicy"),
  SessionAttendancePolicy: Symbol.for("SessionAttendancePolicy"),

  SchedulingOrchestrator: Symbol.for("SchedulingOrchestrator"),
  CronService: Symbol.for("CronService"),
  InternalEventEmitter: Symbol.for("InternalEventEmitter"),
  IMentorRequestService: Symbol.for("IMentorRequestService"),
  NotificationController: Symbol.for("NotificationController"),

};

export { TYPES };