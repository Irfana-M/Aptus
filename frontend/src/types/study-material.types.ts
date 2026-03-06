export interface StudyMaterial {
  _id: string;
  sessionId: string | unknown;
  courseId: string;
  mentorId: string | unknown;
  studentId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'pdf' | 'video' | 'image' | 'other';
  originalName: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadStudyMaterialRequest {
  sessionId: string;
  title: string;
  description?: string;
  file: File;
}
