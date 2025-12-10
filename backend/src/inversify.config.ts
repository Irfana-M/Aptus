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
import { VideoCallRepository } from "./repositories/VideoCallRepository";

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

import { AuthController } from "./controllers/auth.controller";
import { AdminController } from "./controllers/admin.controller";
import { MentorController } from "./controllers/mentor.controller";
import { OtpController } from "./controllers/otp.controller";
import { TrialClassController } from "./controllers/trialClass.controller";
import { GradeController } from "@/controllers/grade.controller";
import { SubjectController } from "@/controllers/subject.controller";
import { RoleController } from "./controllers/role.controller";
import { VideoCallController } from "./controllers/videoCall.controller";
import { CourseAdminController } from "./controllers/courseAdmin.controller";
import { CourseRepository } from "./repositories/course.repository";
import { CourseAdminService } from "./services/courseAdminService";
import { CourseService } from "./services/course.service";

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

// === MAPS — FIXED FOR NEW INVERSIFY ===
container.bind(TYPES.VerificationRepositoryMap).toDynamicValue(() => {
  const map = new Map<string, any>();
  map.set('student', container.get(TYPES.IStudentAuthRepository));
  map.set('mentor', container.get(TYPES.IMentorAuthRepository));
  return map;
}).inSingletonScope();

container.bind(TYPES.AuthRepositoryMap).toDynamicValue(() => {
  const map = new Map<string, any>();
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
container.bind(TYPES.ISubjectService).to(SubjectService);
container.bind(TYPES.IVideoCallService).to(VideoCallService);
container.bind(TYPES.ISocketService).to(SocketService).inSingletonScope();
container.bind(TYPES.IUserRoleService).to(UserRoleService);
container.bind(TYPES.ICourseAdminService).to(CourseAdminService);
container.bind(TYPES.ICourseService).to(CourseService);

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
container.bind(TYPES.StudentController).to(StudentController);
container.bind(TYPES.CourseAdminController).to(CourseAdminController);


// Course Request Bindings
import { CourseRequestRepository } from "@/repositories/courseRequestRepository";
import { CourseRequestService } from "@/services/courseRequestService";
import { CourseRequestController } from "@/controllers/courseRequest.controller";

container
  .bind<CourseRequestRepository>(TYPES.CourseRequestRepository)
  .to(CourseRequestRepository);
container
  .bind<CourseRequestService>(TYPES.ICourseRequestService)
  .to(CourseRequestService);
container
import { CourseController } from "@/controllers/course.controller";

container
  .bind<CourseRequestController>(TYPES.CourseRequestController)
  .to(CourseRequestController);

container
  .bind<CourseController>(TYPES.CourseController)
  .to(CourseController);

// Enrollment Bindings
import { EnrollmentRepository } from "./repositories/enrollment.repository";
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

export { container };