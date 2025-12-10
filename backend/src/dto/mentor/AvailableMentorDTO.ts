import type { SubjectProficiencyDto } from "./MentorResponseDTO";
export class AvailableMentorDto {
  id: string;
  fullName: string;
  profilePicture?: string | null;
  rating: number;
  bio?: string;
  level: "intermediate" | "expert";
  availableSlots?: string[];

  constructor(mentorDoc: any, targetSubjectName: string) {
    this.id = mentorDoc._id.toString();
    this.fullName = mentorDoc.fullName;
    this.profilePicture = mentorDoc.profilePicture || null;
    this.rating = mentorDoc.rating || 0;
    this.bio = mentorDoc.bio;

    const proficiency = mentorDoc.subjectProficiency.find(
      (sp: SubjectProficiencyDto) => sp.subject === targetSubjectName
    );
    this.level = proficiency?.level === "expert" ? "expert" : "intermediate";
  }
}
