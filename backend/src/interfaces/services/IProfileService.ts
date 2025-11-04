import type { MentorAuthUser } from "../auth/auth.interface";
export interface IProfileService {
  isMentorProfileComplete(mentor: MentorAuthUser): boolean;
}
