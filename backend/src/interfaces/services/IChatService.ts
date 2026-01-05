import type { IChatRoom, IChatMessage } from "../models/chat.interface";

export interface IChatService {
  /**
   * Initializes a chat room for a session. 
   * Usually called when session status moves to 'in_progress'.
   */
  initiateChatRoom(sessionId: string): Promise<IChatRoom>;

  /**
   * Sends a message to a chat room.
   * Validates session status and participant membership.
   */
  sendMessage(
    sessionId: string, 
    senderId: string, 
    senderRole: 'mentor' | 'student' | 'admin',
    content: string
  ): Promise<IChatMessage>;

  /**
   * Retrieves chat history for a session.
   * Validates participant membership.
   */
  getChatHistory(sessionId: string, userId: string): Promise<IChatMessage[]>;

  /**
   * Adds system messages to the chat (e.g. "Mentor joined").
   */
  sendSystemMessage(sessionId: string, content: string): Promise<IChatMessage>;
}
