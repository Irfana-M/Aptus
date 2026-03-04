import mongoose, { Schema } from "mongoose";
import type { IChatMessage } from "../../interfaces/models/chat.interface.js";

const chatMessageSchema = new Schema<IChatMessage>(
  {
    chatRoomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ["mentor", "student", "admin"], required: true },
    messageType: { type: String, enum: ["text", "system"], default: "text" },
    content: { type: String, required: true },
  },
  { timestamps: true }
);


chatMessageSchema.index({ chatRoomId: 1, createdAt: 1 });

export const ChatMessageModel = mongoose.model<IChatMessage>("ChatMessage", chatMessageSchema);
