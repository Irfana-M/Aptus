import { injectable, inject } from "inversify";
import { TYPES } from "../../types.js";
import type { IChatService } from "../../interfaces/services/IChatService.js";
import type { IChatRoomRepository } from "../../interfaces/repositories/IChatRoomRepository.js";
import type { ITrialClassRepository } from "../../interfaces/repositories/ITrialClassRepository.js";
import type { IChatMessageRepository } from "../../interfaces/repositories/IChatMessageRepository.js";
import type { ISessionRepository } from "../../interfaces/repositories/ISessionRepository.js";
import type { ISocketService } from "../../interfaces/services/ISocketService.js";
import type { IChatRoom, IChatMessage } from "../../interfaces/models/chat.interface.js";
import { AppError } from "../../utils/AppError.js";
import { HttpStatusCode } from "../../constants/httpStatus.js";
import { logger } from "../../utils/logger.js";

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
      sessionType: 'trial' | 'regular';
      sessionMode: 'one-to-one' | 'group';
  } | null> {
    // 1. Try finding a standard Session (Booking)
    try {
        const session = await this._sessionRepo.findById(id);
        if (session) {
             const s = session as unknown as { 
               _id: { toString(): string }, 
               mentorId?: { toString(): string },
               mentor?: { toString(): string },
               participants?: Array<{ studentId: { toString(): string } }>,
               status: string,
               title?: string
             };
              return {
                  _id: s._id.toString(),
                  mentorId: s.mentorId ? s.mentorId.toString() : (s.mentor ? s.mentor.toString() : ''),
                  participants: s.participants ? s.participants.map((participant) => ({ studentId: participant.studentId.toString() })) : [],
                  status: s.status,
                  title: s.title || 'Session',
                  sessionType: 'regular',
                  sessionMode: (session as unknown as { sessionType: string }).sessionType === 'group' ? 'group' : 'one-to-one'
              };
        }
    } catch(_e) {
        // Session not found, this is expected in some cases. Proceed to check Trial Class.
    }

    // 2. Try finding a Trial Class
    try {
        const trial = await this._trialClassRepo.findById(id);
        
        if (trial) {
            const trialWithIds = trial as unknown as { 
                _id: { toString(): string }, 
                mentor: string | { _id: { toString(): string } },
                student: string | { _id: { toString(): string } },
                status: string
            };
            
            const mentorId = typeof trialWithIds.mentor === 'object' && trialWithIds.mentor._id 
                ? trialWithIds.mentor._id.toString() 
                : trialWithIds.mentor.toString();
                
            const studentId = typeof trialWithIds.student === 'object' && trialWithIds.student._id 
                ? trialWithIds.student._id.toString() 
                : trialWithIds.student.toString();

            return {
                _id: trialWithIds._id.toString(),
                mentorId,
                participants: [{ studentId }],
                status: trialWithIds.status === 'assigned' ? 'in_progress' : trialWithIds.status, 
                title: 'Trial Class',
                sessionType: 'trial',
                sessionMode: 'one-to-one'
            };
        }
    } catch (_e) {
        // Log error if TrialClass find fails
        logger.error(`Error finding TrialClass ${id}:`, _e);
    }

    logger.warn(`_findSessionOrTrial failed for ID: ${id} (Neither Session nor Trial)`);
    return null;
  }

  async initiateChatRoom(sessionId: string): Promise<IChatRoom> {
    const session = await this._findSessionOrTrial(sessionId);
    if (!session) throw new AppError("Session/TrialClass not found", HttpStatusCode.NOT_FOUND);

    let room = await this._chatRoomRepo.findBySessionId(sessionId);
    if (!room) {
      room = await this._chatRoomRepo.create({
        sessionId: session._id as unknown as import('mongoose').Schema.Types.ObjectId,
        mentorId: session.mentorId as unknown as import('mongoose').Schema.Types.ObjectId,
        participantIds: session.participants.map(participant => participant.studentId) as unknown as import('mongoose').Schema.Types.ObjectId[],
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
    const isEnrolled = session.participants.some(participant => participant.studentId.toString() === senderId);
    
    if (!isMentor && !isEnrolled && senderRole !== 'admin') {
      throw new AppError("Access denied to this chat room", HttpStatusCode.FORBIDDEN);
    }

    const message = await this._chatMessageRepo.create({
      chatRoomId: (room._id as unknown as { toString(): string }).toString() as unknown as import('mongoose').Schema.Types.ObjectId,
      senderId: senderId as unknown as import('mongoose').Schema.Types.ObjectId,
      senderRole,
      messageType: 'text',
      content
    });

    // Notify participants via socket
    const chatRoom = `chat:${session.sessionType}:${session.sessionMode}:${sessionId}`;
    
    logger.info("Chat message broadcasted", {
        sessionId,
        sessionType: session.sessionType,
        sessionMode: session.sessionMode,
        senderId,
        messageId: message._id
    });

    this._socketService.emitToRoom(chatRoom, 'new_message', message);

    return message;
  }

  async getChatHistory(sessionId: string, userId: string, userRole?: string): Promise<IChatMessage[]> {
    const session = await this._findSessionOrTrial(sessionId);
    if (!session) throw new AppError("Session not found", HttpStatusCode.NOT_FOUND);

    // Membership check for history access
    const isMentor = session.mentorId.toString() === userId;
    const isEnrolled = session.participants.some(participant => participant.studentId.toString() === userId);
    const isAdmin = userRole === 'admin';
    
    if (!isMentor && !isEnrolled && !isAdmin) {
      throw new AppError("Access denied to this chat history", HttpStatusCode.FORBIDDEN);
    }

    const room = await this._chatRoomRepo.findBySessionId(sessionId);
    
    // Auto-create room if missing for history (returns empty, but ensures room exists for next time)
    if (!room) {
         try {
            await this.initiateChatRoom(sessionId);
         } catch (_e) { console.error('Failed to auto-init chat room on history fetch', _e); }
         return [];
    }

    return await this._chatMessageRepo.findByRoomId((room._id as unknown as { toString(): string }).toString());
  }

  async sendSystemMessage(sessionId: string, content: string): Promise<IChatMessage> {
    const room = await this._chatRoomRepo.findBySessionId(sessionId);
    if (!room) throw new AppError("Chat room not found", HttpStatusCode.NOT_FOUND);

    const message = await this._chatMessageRepo.create({
      chatRoomId: (room._id as unknown as { toString(): string }).toString() as unknown as import('mongoose').Schema.Types.ObjectId,
      senderId: (room.mentorId as unknown as { toString(): string }).toString() as unknown as import('mongoose').Schema.Types.ObjectId, 
      senderRole: 'mentor',
      messageType: 'system',
      content
    });

    const session = await this._findSessionOrTrial(sessionId);
    const chatRoom = session ? `chat:${session.sessionType}:${session.sessionMode}:${sessionId}` : `chat:regular:one-to-one:${sessionId}`;
    this._socketService.emitToRoom(chatRoom, 'system_message', message);
    return message;
  }
}
