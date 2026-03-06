export interface ChatMessage {
  _id: string;
  chatRoomId?: string;
  sessionId?: string;
  senderId: string;
  senderRole: 'mentor' | 'student' | 'admin';
  messageType?: 'text' | 'image' | 'system';
  content: string;
  isRead?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  timestamp?: string;
  createdAt?: string;
}

export interface ChatRoom {
  _id: string;
  sessionId: string;
  mentorId: string;
  participantIds: string[];
  isActive: boolean;
}

export interface Student {
  _id: string;
  fullName: string;
  email: string;
}

export interface CourseGroup {
  key: string;
  subjectId: string;
  subjectName: string;
  gradeId: string;
  gradeName: string;
  syllabus: string;
  students: Student[];
}
