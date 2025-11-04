import type { MentorProfile } from "../features/mentor/mentorSlice";

export interface AdminMentorProfile extends MentorProfile {
  studentsCount?: number;
  averageRating?: number;
}

export const hasAdminProperties = (
  mentor: MentorProfile
): mentor is AdminMentorProfile => {
  return "studentsCount" in mentor || "averageRating" in mentor;
};
