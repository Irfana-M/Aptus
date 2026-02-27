import type { IChatRoom, IChatMessage } from "../models/chat.interface";

export interface IChatService {

  initiateChatRoom(sessionId: string): Promise<IChatRoom>;

 
  sendMessage(
    sessionId: string, 
    senderId: string, 
    senderRole: 'mentor' | 'student' | 'admin',
    content: string
  ): Promise<IChatMessage>;

 
  getChatHistory(sessionId: string, userId: string, userRole?: string): Promise<IChatMessage[]>;

  
  sendSystemMessage(sessionId: string, content: string): Promise<IChatMessage>;
}
