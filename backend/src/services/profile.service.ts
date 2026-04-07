import { injectable } from 'inversify';
import type { IProfileService } from "../interfaces/services/IProfileService";
import type { MentorAuthUser } from "../interfaces/auth/auth.interface";
import { logger } from "../utils/logger";

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