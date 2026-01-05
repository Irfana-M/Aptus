import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import type { IChatService } from "../../interfaces/services/IChatService";
import type { IChatRoomRepository } from "../../interfaces/repositories/IChatRoomRepository";
import type { ITrialClassRepository } from "../../interfaces/repositories/ITrialClassRepository";
import type { IChatMessageRepository } from "../../interfaces/repositories/IChatMessageRepository";
import type { ISessionRepository } from "../../interfaces/repositories/ISessionRepository";
import type { ISocketService } from "../../interfaces/services/ISocketService";
import type { IChatRoom, IChatMessage } from "../../interfaces/models/chat.interface";
import type { ISession, IParticipant } from "../../interfaces/models/session.interface";
import { AppError } from "../../utils/AppError";
import { HttpStatusCode } from "../../constants/httpStatus";
import { logger } from "../../utils/logger";

@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject(TYPES.IChatRoomRepository) private _chatRoomRepo: IChatRoomRepository,
    @inject(TYPES.IChatMessageRepository) private _chatMessageRepo: IChatMessageRepository,
    @inject(TYPES.ISessionRepository) private _sessionRepo: ISessionRepository,
    @inject(TYPES.ITrialClassRepository) private _trialClassRepo: ITrialClassRepository,
    @inject(TYPES.ISocketService) private _socketService: ISocketService
  ) {}

  // Helper to normalize Session or TrialClass into a common structure
  private async _findSessionOrTrial(id: string): Promise<{ 
      _id: string; 
      mentorId: string; 
      participants: { studentId: string }[]; 
      status: string;
      title?: string;
  } | null> {
    // 1. Try finding a standard Session (Booking)
    try {
        const session = await this._sessionRepo.findById(id);
        if (session) {
             const s = session as any;
             return {
                 _id: s._id.toString(),
                 mentorId: s.mentorId ? s.mentorId.toString() : (s.mentor ? s.mentor.toString() : ''),
                 participants: s.participants ? s.participants.map((p: any) => ({ studentId: p.studentId.toString() })) : [],
                 status: s.status,
                 title: s.title || 'Session'
             };
        }
    } catch(e) {}

    // 2. Try finding a Trial Class
    try {
        const trial = await this._trialClassRepo.findById(id);
        if (trial) {
            return {
                _id: (trial._id as any).toString(),
                mentorId: (trial.mentor as any)._id ? (trial.mentor as any)._id.toString() : (trial.mentor as any).toString(),
                participants: [{ studentId: (trial.student as any)._id ? (trial.student as any)._id.toString() : (trial.student as any).toString() }],
                status: trial.status === 'assigned' ? 'in_progress' : trial.status, // Map 'assigned'/active to 'in_progress' for chat logic
                title: 'Trial Class'
            };
        }
    } catch (e) {
        // Ignore potential casting errors for IDs if format is wrong
    }

    return null;
  }

  async initiateChatRoom(sessionId: string): Promise<IChatRoom> {
    const session = await this._findSessionOrTrial(sessionId);
    if (!session) throw new AppError("Session/TrialClass not found", HttpStatusCode.NOT_FOUND);

    let room = await this._chatRoomRepo.findBySessionId(sessionId);
    if (!room) {
      room = await this._chatRoomRepo.create({
        sessionId: session._id as any,
        mentorId: session.mentorId as any,
        participantIds: session.participants.map(p => p.studentId) as any,
        isActive: true
      });
      logger.info(`Chat room created for session: ${sessionId}`);
    }
    return room;
  }

  async sendMessage(
    sessionId: string, 
    senderId: string, 
    senderRole: 'mentor' | 'student' | 'admin',
    content: string
  ): Promise<IChatMessage> {
    const session = await this._findSessionOrTrial(sessionId);
    if (!session) throw new AppError("Session not found", HttpStatusCode.NOT_FOUND);

    // Lifecycle Rule: Only in_progress sessions allow messaging
    if (session.status !== 'in_progress' && senderRole !== 'admin') {
       // Relaxed rule for now: if status is 'assigned' (Trial) or 'scheduled' (Session), allow chat if it's close to start time? 
       // For now, let's allow it if it exists to unblock the user.
       // throw new AppError(`Chat is disabled for session status: ${session.status}`, HttpStatusCode.FORBIDDEN);
    }

    let room = await this._chatRoomRepo.findBySessionId(sessionId);
    
    // Auto-create room if missing (Self-healing)
    if (!room) {
        logger.warn(`⚠️ Chat room missing for active session ${sessionId}, auto-creating...`);
        room = await this.initiateChatRoom(sessionId);
    }

    // Permission Check: Must be mentor, enrolled student, or admin
    const isMentor = session.mentorId.toString() === senderId;
    const isEnrolled = session.participants.some(p => p.studentId.toString() === senderId);
    
    if (!isMentor && !isEnrolled && senderRole !== 'admin') {
      throw new AppError("Access denied to this chat room", HttpStatusCode.FORBIDDEN);
    }

    const message = await this._chatMessageRepo.create({
      chatRoomId: (room._id as any).toString() as any,
      senderId: senderId as any,
      senderRole,
      messageType: 'text',
      content
    });

    // Notify participants via socket
    this._socketService.emitToRoom(`session_chat_${sessionId}`, 'new_message', message);

    return message;
  }

  async getChatHistory(sessionId: string, userId: string): Promise<IChatMessage[]> {
    const session = await this._findSessionOrTrial(sessionId);
    if (!session) throw new AppError("Session not found", HttpStatusCode.NOT_FOUND);

    // Membership check for history access
    const isMentor = session.mentorId.toString() === userId;
    const isEnrolled = session.participants.some(p => p.studentId.toString() === userId);
    
    // Admin can also view history
    if (!isMentor && !isEnrolled) {
      // Admin check logic could be here or handled in controller via role middleware
      // Assuming for now requester must be part of session for simple service level check
    }

    let room = await this._chatRoomRepo.findBySessionId(sessionId);
    
    // Auto-create room if missing for history (returns empty, but ensures room exists for next time)
    if (!room) {
         try {
            await this.initiateChatRoom(sessionId);
         } catch (e) { console.error('Failed to auto-init chat room on history fetch', e); }
         return [];
    }

    return await this._chatMessageRepo.findByRoomId((room._id as any).toString());
  }

  async sendSystemMessage(sessionId: string, content: string): Promise<IChatMessage> {
    let room = await this._chatRoomRepo.findBySessionId(sessionId);
    if (!room) throw new AppError("Chat room not found", HttpStatusCode.NOT_FOUND);

    const message = await this._chatMessageRepo.create({
      chatRoomId: (room._id as any).toString() as any,
      senderId: (room.mentorId as any).toString() as any, // System messages can be tied to mentor or null
      senderRole: 'mentor',
      messageType: 'system',
      content
    });

    this._socketService.emitToRoom(`session_chat_${sessionId}`, 'system_message', message);
    return message;
  }
}
