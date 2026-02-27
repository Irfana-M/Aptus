export interface ICourseRequest {
  student: string; 
  mentor?: string;
  subject: string;
  grade: string;
  subjectId?: string;
  gradeId?: string;
  syllabus?: string;
  mentoringMode: 'one-to-one' | 'group';
  preferredDays: string[];
  timeSlot?: string;
  timezone?: string;
  status: 'pending' | 'reviewed' | 'fulfilled' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
