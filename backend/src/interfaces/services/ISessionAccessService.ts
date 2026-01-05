export interface IJoinLinkTokenPayload {
  sessionId: string;
  userId: string;
  role: 'student' | 'mentor';
}

export interface ISessionAccessService {
  generateJoinLink(sessionId: string, userId: string, role: 'student' | 'mentor', startTime: Date): string;
  verifyJoinLink(token: string): IJoinLinkTokenPayload | null;
}
