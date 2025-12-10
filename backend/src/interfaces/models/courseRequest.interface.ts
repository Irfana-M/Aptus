
export interface ICourseRequest {
  student: string; 
  subject: string;
  mentoringMode: 'one-to-one';
  preferredDay: string;
  timeRange: string;
  timezone?: string;
  status: 'pending' | 'reviewed' | 'fulfilled';
  createdAt: Date;
  updatedAt: Date;
}
