import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";

// Import repositories
import { AuthRepository } from "./repositories/auth.repository";
import { AdminRepository } from "./repositories/admin.repository";
import { MentorRepository } from "./repositories/mentorRepository";
import { StudentRepository } from "./repositories/studentRepository";
import { OtpRepository } from "./repositories/otp.repository";
import { StudentAuthRepository } from "./repositories/studentAuth.repository";
import { MentorAuthRepository } from "./repositories/mentorAuth.repository";

// Import services
import { AuthService } from "./services/auth.service";
import { AdminService } from "./services/admin.service";
import { MentorService } from "./services/mentor.services";
import { OtpService } from "./services/otp.services";
import { NodemailerService } from "./services/email.service";
import { ProfileService } from "./services/profile.service";
import { StudentService } from "./services/student.services"

// Import controllers
import { AuthController } from "./controllers/auth.controller";
import { AdminController } from "./controllers/admin.controller";
import { MentorController } from "./controllers/mentor.controller";
import { OtpController } from "./controllers/otp.controller";

// Import interfaces
import type { IAuthRepository } from "./interfaces/auth/IAuthRepository";
import type { IAdminRepository } from "./interfaces/repositories/IAdminRepository";
import type { IMentorRepository } from "./interfaces/repositories/IMentorRepository";
import type { IStudentRepository } from "./interfaces/repositories/IStudentRepository";
import type { IOtpRepository } from "./interfaces/repositories/IOtpRepository";
import type { IStudentAuthRepository } from "./interfaces/repositories/IStudentAuthRepository";
import type { IMentorAuthRepository } from "./interfaces/repositories/IMentorAuthRepository";
import type { IVerificationRepository } from "./interfaces/repositories/IVerificationRepository";
import type { IAuthService } from "./interfaces/services/IauthService";
import type { IAdminService } from "./interfaces/services/IAdminService";
import type { IMentorService } from "./interfaces/services/IMentorService";
import type { IOtpService } from "./interfaces/services/IOtpService";
import type { IEmailService } from "./interfaces/services/IEmailService";
import type { IProfileService } from "./interfaces/services/IProfileService";
import type { IStudentService } from "./interfaces/services/IStudentService";

const container = new Container();


container.bind<IAuthRepository>(TYPES.IAuthRepository).to(AuthRepository);
container.bind<IAdminRepository>(TYPES.IAdminRepository).to(AdminRepository);
container.bind<IMentorRepository>(TYPES.IMentorRepository).to(MentorRepository);
container.bind<IStudentRepository>(TYPES.IStudentRepository).to(StudentRepository);
container.bind<IOtpRepository>(TYPES.IOtpRepository).to(OtpRepository);
container.bind<IStudentAuthRepository>(TYPES.IStudentAuthRepository).to(StudentAuthRepository);
container.bind<IMentorAuthRepository>(TYPES.IMentorAuthRepository).to(MentorAuthRepository);
container.bind<IEmailService>(TYPES.EmailService).to(NodemailerService);
container.bind<IVerificationRepository>(TYPES.IVerificationRepository).to(StudentAuthRepository);


container.bind<Map<string, IVerificationRepository>>(TYPES.VerificationRepositoryMap).toDynamicValue(() => {
  const map = new Map<string, IVerificationRepository>();
  map.set('student', container.get<IStudentAuthRepository>(TYPES.IStudentAuthRepository));
  map.set('mentor', container.get<IMentorAuthRepository>(TYPES.IMentorAuthRepository));
  return map;
});


container.bind<Map<string, IAuthRepository>>(TYPES.AuthRepositoryMap).toDynamicValue(() => {
  const map = new Map<string, IAuthRepository>();
  map.set('student', container.get<IStudentAuthRepository>(TYPES.IStudentAuthRepository));
  map.set('mentor', container.get<IMentorAuthRepository>(TYPES.IMentorAuthRepository));
  return map;
});

container.bind<IStudentService>(TYPES.IStudentService).to(StudentService);
container.bind<IAuthService>(TYPES.IAuthService).to(AuthService); 
container.bind<IAdminService>(TYPES.IAdminService).to(AdminService);
container.bind<IMentorService>(TYPES.IMentorService).to(MentorService);
container.bind<IOtpService>(TYPES.IOtpService).to(OtpService);
container.bind<IEmailService>(TYPES.IEmailService).to(NodemailerService);
container.bind<IProfileService>(TYPES.IProfileService).to(ProfileService);

// Controller Bindings
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);
container.bind<MentorController>(TYPES.MentorController).to(MentorController);
container.bind<OtpController>(TYPES.OtpController).to(OtpController);

export { container };