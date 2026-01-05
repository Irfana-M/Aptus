import type { ITrialClassDocument } from "@/models/student/trialClass.model";
import type { TrialClassResponseDto } from "@/dto/student/trialClassDTO";

import mongoose from "mongoose";

interface PopulatedUser { _id: mongoose.Types.ObjectId | string; fullName?: string; name?: string; email?: string; phoneNumber?: string; }
interface PopulatedSubject { _id: mongoose.Types.ObjectId | string; subjectName?: string; name?: string; syllabus?: string; grade?: Record<string, unknown> | string | number; gradeId?: string | number; }
interface PopulatedMentor { _id: mongoose.Types.ObjectId | string; fullName?: string; name?: string; email?: string; }

interface GradeInfo { level?: string | number | unknown; gradeLevel?: string | number | unknown; value?: string | number | unknown }

export class TrialClassMapper {
  static toResponseDto(entity: ITrialClassDocument): TrialClassResponseDto {
    if (!entity) {
        throw new Error("TrialClassMapper: Entity is null or undefined");
    }
    
    // SAFE ID ACCESS
    const entityId = entity._id ? entity._id.toString() : 'unknown_id';
    
    // SAFE STUDENT ACCESS
    let studentData;
    if (entity.student && typeof entity.student === 'object' && '_id' in entity.student) {
        const studentObj = entity.student as PopulatedUser;
        studentData = {
          id: studentObj._id?.toString() || 'unknown_student_id',
          fullName: studentObj.fullName || studentObj.name || 'Unknown',
          email: studentObj.email || '',
          phoneNumber: studentObj.phoneNumber || '',
        };
    } else if (entity.student) {
        studentData = {
          id: entity.student.toString(),
          fullName: 'Unknown Student',
          email: '',
          phoneNumber: '',
        };
    } else {
        studentData = {
            id: 'missing_student',
            fullName: 'Deleted Student',
            email: '',
            phoneNumber: '',
        };
    }

    // SAFE SUBJECT ACCESS
    let subjectData;
    if (entity.subject && typeof entity.subject === 'object' && '_id' in entity.subject) {
      const subjectObj = entity.subject as PopulatedSubject;
      subjectData = { 
          id: subjectObj._id?.toString() || 'unknown_subject_id',
          subjectName: subjectObj.subjectName || subjectObj.name || 'Unknown Subject',
          syllabus: subjectObj.syllabus || '',
          grade: (() => {
            const gradeVal = subjectObj.grade;
            if (gradeVal && typeof gradeVal === "object") {
              const info = gradeVal as GradeInfo;
              const potentialGrade = info.level || info.gradeLevel || info.value;
              if (potentialGrade !== undefined) return parseInt(potentialGrade as string, 10);
            }
            const finalGrade = gradeVal || subjectObj.gradeId;
            return typeof finalGrade === "string" || typeof finalGrade === "number"
              ? parseInt(finalGrade.toString(), 10) || 0
              : 0;
          })(),
        };
    } else if (entity.subject) {
        subjectData = { 
          id: entity.subject.toString(),
          subjectName: 'Unknown Subject', 
          syllabus: '',
          grade: 0, 
        };
    } else {
        subjectData = {
            id: 'missing_subject',
            subjectName: 'Deleted Subject',
            syllabus: '',
            grade: 0
        };
    }
    
    // SAFE MENTOR ACCESS
    const mentorData = entity.mentor && typeof entity.mentor === 'object' && '_id' in entity.mentor
      ? {
          id: (entity.mentor as PopulatedMentor)._id.toString(),
          name: (entity.mentor as PopulatedMentor).fullName || (entity.mentor as PopulatedMentor).name || 'Unknown Mentor',
          email: (entity.mentor as PopulatedMentor).email || '',
        }
      : undefined;

    
   const feedbackData = entity.feedback
      ? {
          rating: entity.feedback.rating || 0,
          comment: entity.feedback.comment || '',
          submittedAt: entity.updatedAt?.toISOString() || new Date().toISOString(),
        }
      : undefined;

    return {
      id: entityId,
      student: studentData,
      subject: subjectData,
      status: entity.status || "requested", // Default if missing
      preferredDate: entity.preferredDate?.toISOString() || new Date().toISOString(),
      preferredTime: entity.preferredTime || '',
      scheduledDateTime: (entity as ITrialClassDocument & { scheduledDateTime?: Date }).scheduledDateTime?.toISOString(), // Handle optional field
      mentor: mentorData,
      meetLink: entity.meetLink || 
        ((entity.status === 'assigned' || entity.status === 'completed') 
          ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/trial-class/${entityId}/call` 
          : undefined),
      notes: entity.notes,
      feedback: feedbackData,
      sessionType: 'trial',
      trialClassId: entityId,
      createdAt: entity.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}