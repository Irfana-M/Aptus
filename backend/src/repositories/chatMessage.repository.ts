import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository";
import type { IChatMessage } from "../interfaces/models/chat.interface";
import { ChatMessageModel } from "../models/scheduling/chatMessage.model";
import type { IChatMessageRepository } from "../interfaces/repositories/IChatMessageRepository";

@injectable()
export class ChatMessageRepository extends BaseRepository<IChatMessage> implements IChatMessageRepository {
  constructor() {
    super(ChatMessageModel);
  }

  async findByRoomId(roomId: string): Promise<IChatMessage[]> {
    return await this.model.find({ chatRoomId: roomId }).sort({ createdAt: 1 }).lean().exec() as unknown as IChatMessage[];
  }
}
