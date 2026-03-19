import { Schema, model } from "mongoose";
import type { IVideoCallDocument } from "@/interfaces/models/videoCall.interface.js";

const VideoCallParticipantSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    refPath: 'participants.userType'
  },
  userType: { 
    type: String, 
    enum: ['student', 'mentor', 'admin'], 
    required: true 
  },
  socketId: { type: String },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date }
});

const VideoCallSchema = new Schema<IVideoCallDocument>(
  {
    sessionId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      unique: true 
    },
    callStatus: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'failed'],
      default: 'active'
    },
    meetLink: { type: String, required: true },
    participants: [VideoCallParticipantSchema],
    callStartedAt: { type: Date, default: Date.now },
    callEndedAt: { type: Date },
    callDuration: { type: Number }
  },
  { timestamps: true }
);


VideoCallSchema.index({ callStatus: 1 });
VideoCallSchema.index({ 'participants.userId': 1 });

export const VideoCall = model<IVideoCallDocument>("VideoCall", VideoCallSchema);
