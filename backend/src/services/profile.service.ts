import { injectable } from 'inversify';
import type { IProfileService } from "../interfaces/services/IProfileService.js";
import type { MentorAuthUser } from "../interfaces/auth/auth.interface.js";
import { logger } from "../utils/logger.js";

@injectable()
export class ProfileService implements IProfileService {
  isMentorProfileComplete(mentor: MentorAuthUser): boolean {
    const complete =
      Boolean(mentor.fullName) &&
      Boolean(mentor.academicQualifications?.length) &&
      Boolean(mentor.subjectProficiency?.length);

    logger.info(
      `Checked mentor profile completion for ${mentor.email}: ${complete}`
    );
    return complete;
  }
}