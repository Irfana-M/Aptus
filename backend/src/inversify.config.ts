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
import { TrialClassRepository } from "./repositories/trialClass.repository";
import { GradeRepository } from "@/repositories/grade.repository";
import { SubjectRepository } from "@/repositories/subject.repository";

// Import services
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

// Import controllers
import { AuthController } from "./controllers/auth.controller";
import { AdminController } from "./controllers/admin.controller";
import { MentorController } from "./controllers/mentor.controller";
import { OtpController } from "./controllers/otp.controller";
import { TrialClassController } from "./controllers/trialClass.controller";
import { GradeController } from "@/controllers/grade.controller";
import { SubjectController } from "@/controllers/subject.controller";

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
import type { ITrialClassRepository } from "./interfaces/repositories/ITrialClassRepository";
import type { ITrialClassService } from "./interfaces/services/ITrialClassService";
import type { IGradeService } from "./interfaces/services/IGradeService";
import type { IGradeRepository } from "./interfaces/repositories/IGradeRepository";
import type { ISubjectService } from "./interfaces/services/ISubjectService";
import type { ISubjectRepository } from "./interfaces/repositories/ISubjectRepository";

const container = new Container();


container.bind<IAuthRepository>(TYPES.IAuthRepository).to(AuthRepository);
container.bind<IAdminRepository>(TYPES.IAdminRepository).to(AdminRepository);
container.bind<IMentorRepository>(TYPES.IMentorRepository).to(MentorRepository);
container.bind<IStudentRepository>(TYPES.IStudentRepository).to(StudentRepository);
container.bind<IOtpRepository>(TYPES.IOtpRepository).to(OtpRepository);
container.bind<IStudentAuthRepository>(TYPES.IStudentAuthRepository).to(StudentAuthRepository);
container.bind<IMentorAuthRepository>(TYPES.IMentorAuthRepository).to(MentorAuthRepository);
container.bind<IVerificationRepository>(TYPES.IVerificationRepository).to(StudentAuthRepository);
container.bind<ITrialClassRepository>(TYPES.ITrialClassRepository).to(TrialClassRepository);
container.bind<IGradeRepository>(TYPES.IGradeRepository).to(GradeRepository);
container.bind<ISubjectRepository>(TYPES.ISubjectRepository).to(SubjectRepository);


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
container.bind<ITrialClassService>(TYPES.ITrialClassService).to(TrialClassService);
container.bind<IGradeService>(TYPES.IGradeService).to(GradeService);
container.bind<ISubjectService>(TYPES.ISubjectService).to(SubjectService);

// Controller Bindings
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);
container.bind<MentorController>(TYPES.MentorController).to(MentorController);
container.bind<OtpController>(TYPES.OtpController).to(OtpController);
container.bind<TrialClassController>(TYPES.TrialClassController).to(TrialClassController);
container.bind<GradeController>(TYPES.GradeController).to(GradeController);
container.bind<SubjectController>(TYPES.SubjectController).to(SubjectController);

export { container };