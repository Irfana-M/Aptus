import api from "./api";
import type { ApiResponse } from "../types/api.types";
import type { ChatMessage, ChatRoom } from "../types/classroom.types";

export type { ChatMessage, ChatRoom };

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
