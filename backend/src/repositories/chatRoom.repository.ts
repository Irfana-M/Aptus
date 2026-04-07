import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository";
import type { IChatRoom } from "../interfaces/models/chat.interface";
import { ChatRoomModel } from "../models/scheduling/chatRoom.model";
import type { IChatRoomRepository } from "../interfaces/repositories/IChatRoomRepository";
import { logger } from "../utils/logger";

@injectable()
export class ChatRoomRepository extends BaseRepository<IChatRoom> implements IChatRoomRepository {
  constructor() {
    super(ChatRoomModel);
  }

  async findBySessionId(sessionId: string): Promise<IChatRoom | null> {
    const result = await this.model.findOne({ sessionId }).lean().exec() as IChatRoom | null;
    logger.info(`[CHAT TRACE][Repository] findBySessionId:`, { sessionId, found: !!result });
    return result;
  }

  async create(data: Partial<IChatRoom>, session?: any): Promise<IChatRoom> {
    try {
      logger.info(`[CHAT TRACE][Repository] create payload:`, data);
      return await super.create(data, session);
    } catch (error) {
      logger.error(`[CHAT TRACE][Repository] create FAILED:`, {
        error,
        message: (error as Error).message,
        stack: (error as Error).stack,
        payload: data
      });
      throw error;
    }
  }
}
