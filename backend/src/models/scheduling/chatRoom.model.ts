import mongoose, { Schema } from "mongoose";
import type { IChatRoom } from "../../interfaces/models/chat.interface";

const chatRoomSchema = new Schema<IChatRoom>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: true, unique: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "Mentor", required: true },
    participantIds: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for quick lookup by sessionId
chatRoomSchema.index({ sessionId: 1 });

export const ChatRoomModel = mongoose.model<IChatRoom>("ChatRoom", chatRoomSchema);
