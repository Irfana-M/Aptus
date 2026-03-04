import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository.js";
import type { IChatMessage } from "../interfaces/models/chat.interface.js";
import { ChatMessageModel } from "../models/scheduling/chatMessage.model.js";
import type { IChatMessageRepository } from "../interfaces/repositories/IChatMessageRepository.js";

@injectable()
export class ChatMessageRepository extends BaseRepository<IChatMessage> implements IChatMessageRepository {
  constructor() {
    super(ChatMessageModel);
  }

  async findByRoomId(roomId: string): Promise<IChatMessage[]> {
    return await this.model.find({ chatRoomId: roomId }).sort({ createdAt: 1 }).lean().exec() as unknown as IChatMessage[];
  }
}
