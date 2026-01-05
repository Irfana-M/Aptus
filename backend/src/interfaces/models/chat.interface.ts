import { Schema, Document } from "mongoose";

export interface IChatRoom extends Document {
  sessionId: Schema.Types.ObjectId;
  mentorId: Schema.Types.ObjectId;
  participantIds: Schema.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatMessage extends Document {
  chatRoomId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  senderRole: 'mentor' | 'student' | 'admin';
  messageType: 'text' | 'system';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
