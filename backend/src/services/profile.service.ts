import type { IProfileService } from "../interfaces/services/IProfileService.js";
import type { MentorAuthUser } from "../interfaces/auth/auth.interface.js";
import { logger } from "../utils/logger.js";

export class ProfileService implements IProfileService {
  isMentorProfileComplete(mentor: MentorAuthUser): boolean {
    const complete =
      Boolean(mentor.fullName) &&
      Boolean(mentor.academicQualification?.length) &&
      Boolean(mentor.subjectProficiency?.length);

    logger.info(`Checked mentor profile completion for ${mentor.email}: ${complete}`);
    return complete;
  }
}
