import type { ITrialClassDocument } from "../models/student/trialClass.model";
import type { TrialClassResponseDto } from "../dtos/student/trialClassDTO";

import mongoose from "mongoose";

interface PopulatedUser { _id: mongoose.Types.ObjectId | string; fullName?: string; name?: string; email?: string; phoneNumber?: string; }
interface PopulatedSubject { _id: mongoose.Types.ObjectId | string; subjectName?: string; name?: string; syllabus?: string; grade?: Record<string, unknown> | string | number; gradeId?: string | number; }
interface PopulatedMentor { _id: mongoose.Types.ObjectId | string; fullName?: string; name?: string; email?: string; }

interface GradeInfo { 
  name?: string | number | unknown; 
  grade?: string | number | unknown; 
  level?: string | number | unknown; 
  gradeLevel?: string | number | unknown; 
  value?: string | number | unknown;
}

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
            
            // Check if grade is a populated object with name or grade field
            if (gradeVal && typeof gradeVal === "object") {
              const info = gradeVal as GradeInfo;
              
              // First check for 'name' field (from Grade model)
              if (info.level !== undefined) {
                const parsed = parseInt(info.level as string, 10);
                if (!isNaN(parsed)) return parsed;
              }
              
              // Check for 'grade' field
              if (info.gradeLevel !== undefined) {
                const parsed = parseInt(info.gradeLevel as string, 10);
                if (!isNaN(parsed)) return parsed;
              }
              
              // Check for 'value' field
              if (info.value !== undefined) {
                const parsed = parseInt(info.value as string, 10);
                if (!isNaN(parsed)) return parsed;
              }
              
              // If it's a populated object with 'name' property (Grade document)
              if ('name' in info && info.name) {
                const parsed = parseInt(info.name as string, 10);
                if (!isNaN(parsed)) return parsed;
              }
              
              // If it's a populated object with 'grade' property
              if ('grade' in info && info.grade) {
                const parsed = parseInt(info.grade as string, 10);
                if (!isNaN(parsed)) return parsed;
              }
            }
            
            // Fallback to gradeId or direct value
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
          ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/trial-class/${entityId}/call` 
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