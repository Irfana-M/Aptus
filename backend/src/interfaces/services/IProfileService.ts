import type { MentorAuthUser } from "../auth/auth.interface.js";
export interface IProfileService {
  isMentorProfileComplete(mentor: MentorAuthUser): boolean;
}
