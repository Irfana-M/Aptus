import { Document, Types } from "mongoose";

export interface IVideoCallParticipant {
  userId: Types.ObjectId;
  userType: 'student' | 'mentor' | 'admin';
  socketId?: string | undefined;
  joinedAt: Date;
  leftAt?: Date;
}

export interface IVideoCall {
  sessionId: Types.ObjectId;
  callStatus: 'active' | 'completed' | 'cancelled' | 'failed';
  meetLink: string;
  participants: IVideoCallParticipant[];
  callStartedAt: Date;
  callEndedAt?: Date;
  callDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoCallDocument extends IVideoCall, Document {
  _id: Types.ObjectId;
}