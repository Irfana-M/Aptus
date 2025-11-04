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

  // Services
  IAuthService: Symbol.for("IAuthService"),
  IAdminService: Symbol.for("IAdminService"),
  IMentorService: Symbol.for("IMentorService"),
  IStudentService: Symbol.for("IStudentService"),
  IOtpService: Symbol.for("IOtpService"),
  IEmailService: Symbol.for("IEmailService"),
  IProfileService: Symbol.for("IProfileService"),
  ImageService: Symbol.for("ImageService"),

  // Controllers
  AuthController: Symbol.for("AuthController"),
  AdminController: Symbol.for("AdminController"),
  MentorController: Symbol.for("MentorController"),
  OtpController: Symbol.for("OtpController"),

  // Middleware
  AuthMiddleware: Symbol.for("AuthMiddleware"),
  RoleMiddleware: Symbol.for("RoleMiddleware"),

  // Utils
  PassportConfig: Symbol.for("PassportConfig"),
  EmailService: Symbol.for("EmailService"),
};

export { TYPES };