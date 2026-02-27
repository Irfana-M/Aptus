import type { IStudyMaterial, IAssignmentSubmission } from "../models/studyMaterial.interface";

export interface IStudyMaterialService {
  uploadMaterial(data: {
    sessionId?: string;
    slotId?: string;
    mentorId: string;
    studentId?: string;
    subjectId?: string;
    title: string;
    description?: string;
    file: Express.Multer.File;
  }): Promise<IStudyMaterial>;

  createAssignment(data: {
    mentorId: string;
    subjectId: string;
    slotId?: string;
    title: string;
    description: string;
    dueDate: Date;
    assignedTo: string[];
    allowLateSubmission?: boolean;
    file: Express.Multer.File;
  }): Promise<IStudyMaterial>;

  submitAssignment(data: {
    assignmentId: string;
    studentId: string;
    files: Express.Multer.File[];
  }): Promise<IAssignmentSubmission>;

  provideFeedback(submissionId: string, mentorId: string, feedback: string): Promise<IAssignmentSubmission>;

  getSessionMaterials(sessionId: string): Promise<IStudyMaterial[]>;
  getStudentMaterials(studentId: string): Promise<IStudyMaterial[]>;
  getCourseMaterials(courseId: string): Promise<IStudyMaterial[]>;
  getMentorMaterials(mentorId: string, type?: 'study_material' | 'assignment'): Promise<IStudyMaterial[]>;
  getStudentAssignments(studentId: string): Promise<IStudyMaterial[]>;
  getAssignmentSubmissions(assignmentId: string, mentorId: string): Promise<IAssignmentSubmission[]>;
  getStudentSubmission(assignmentId: string, studentId: string): Promise<IAssignmentSubmission | null>;
  deleteMaterial(materialId: string, mentorId: string): Promise<boolean>;
  sendDueReminders(from: Date, to: Date): Promise<void>;
}
