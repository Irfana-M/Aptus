import type { ChatMessage } from "../../types/classroom.types";

export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  activeSessionId: string | null;
}
