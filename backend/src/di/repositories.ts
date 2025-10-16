import { AuthRepository } from "../repositories/auth.repository.js";
import { MentorAuthRepository } from "../repositories/mentorAuth.repository.js";
import { StudentAuthRepository
     } from "../repositories/studentAuth.repository.js";

export const authRepo = new AuthRepository(
  new MentorAuthRepository(),
  new StudentAuthRepository()
);
