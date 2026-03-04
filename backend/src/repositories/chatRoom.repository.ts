import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository.js";
import type { IChatRoom } from "../interfaces/models/chat.interface.js";
import { ChatRoomModel } from "../models/scheduling/chatRoom.model.js";
import type { IChatRoomRepository } from "../interfaces/repositories/IChatRoomRepository.js";

@injectable()
export class ChatRoomRepository extends BaseRepository<IChatRoom> implements IChatRoomRepository {
  constructor() {
    super(ChatRoomModel);
  }

  async findBySessionId(sessionId: string): Promise<IChatRoom | null> {
    return await this.model.findOne({ sessionId }).lean().exec() as IChatRoom | null;
  }
}
