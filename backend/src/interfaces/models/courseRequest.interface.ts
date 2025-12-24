
export interface ICourseRequest {
  student: string; 
  mentor?: string;
  subject: string;
  grade: string;
  mentoringMode: 'one-to-one' | 'one-to-many';
  preferredDays: string[];
  timeSlot: string;
  timezone?: string;
  status: 'pending' | 'reviewed' | 'fulfilled' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
