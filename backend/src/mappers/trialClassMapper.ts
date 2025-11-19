import type { ITrialClassDocument } from "@/models/student/trialClass.model";
import type { TrialClassResponseDto } from "@/dto/student/trialClassDTO";

export class TrialClassMapper {
  static toResponseDto(entity: ITrialClassDocument): TrialClassResponseDto {
    
    const studentData = (entity.student as any)?._id 
      ? {
          id: (entity.student as any)._id.toString(),
          fullName: (entity.student as any).fullName || (entity.student as any).name || 'Unknown',
          email: (entity.student as any).email || '',
          phoneNumber: (entity.student as any).phoneNumber || '',
        }
      : {
          id: entity.student.toString(),
          fullName: 'Unknown Student',
          email: '',
          phoneNumber: '',
        };
    // Handle subject population
    const subjectData = (entity.subject as any)?._id 
      ? { 
          id: (entity.subject as any)._id.toString(),
          subjectName: (entity.subject as any).subjectName || (entity.subject as any).name || 'Unknown Subject',
          syllabus: (entity.subject as any).syllabus,
          grade: (entity.subject as any).grade,
        }
      : { 
          id: entity.subject.toString(),
          subjectName: 'Unknown Subject', 
          syllabus: '',
          grade: 0,
        };

    // Handle mentor population
    const mentorData = entity.mentor && (entity.mentor as any)?._id
      ? {
          id: (entity.mentor as any)._id.toString(),
          name: (entity.mentor as any).fullName || (entity.mentor as any).name || 'Unknown Mentor',
          email: (entity.mentor as any).email || '',
        }
      : undefined;

    // Handle student population - THIS IS WHAT'S MISSING
   const feedbackData = entity.feedback
      ? {
          rating: entity.feedback.rating || 0,
          comment: entity.feedback.comment || '',
          submittedAt: entity.updatedAt?.toISOString() || new Date().toISOString(),
        }
      : undefined;

    return {
      id: entity._id!.toString(),
      student: studentData,
      subject: subjectData,
      status: entity.status,
      preferredDate: entity.preferredDate?.toISOString() || new Date().toISOString(),
      preferredTime: entity.preferredTime || '',
      scheduledDateTime: (entity as any).scheduledDateTime?.toISOString(), // Handle optional field
      mentor: mentorData,
      meetLink: entity.meetLink,
      notes: entity.notes,
      feedback: feedbackData,
      createdAt: entity.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}