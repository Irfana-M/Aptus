import api, { type ApiResponse } from "./api";

export interface ChatMessage {
  _id: string;
  chatRoomId: string;
  senderId: string;
  senderRole: 'mentor' | 'student' | 'admin';
  messageType: 'text' | 'image' | 'system';
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatRoom {
  _id: string;
  sessionId: string;
  mentorId: string;
  participantIds: string[];
  isActive: boolean;
}

export const chatApi = {
  getHistory: async (sessionId: string): Promise<ApiResponse<ChatMessage[]>> => {
    const response = await api.get<ApiResponse<ChatMessage[]>>(`/chat/${sessionId}/history`);
    return response.data;
  },

  sendMessage: async (sessionId: string, content: string): Promise<ApiResponse<ChatMessage>> => {
    const response = await api.post<ApiResponse<ChatMessage>>(`/chat/${sessionId}/send`, { content });
    return response.data;
  },

  initiateChat: async (sessionId: string): Promise<ApiResponse<ChatRoom>> => {
    const response = await api.post<ApiResponse<ChatRoom>>(`/chat/${sessionId}/initiate`);
    return response.data;
  }
};
