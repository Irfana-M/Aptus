import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository";
import type { IChatRoom } from "../interfaces/models/chat.interface";
import { ChatRoomModel } from "../models/scheduling/chatRoom.model";
import type { IChatRoomRepository } from "../interfaces/repositories/IChatRoomRepository";

@injectable()
export class ChatRoomRepository extends BaseRepository<IChatRoom> implements IChatRoomRepository {
  constructor() {
    super(ChatRoomModel);
  }

  async findBySessionId(sessionId: string): Promise<IChatRoom | null> {
    return await this.model.findOne({ sessionId }).lean().exec() as IChatRoom | null;
  }
}
