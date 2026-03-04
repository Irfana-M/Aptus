import type { IChatMessage } from "../models/chat.interface.js";
import type { IBaseRepository } from "./IBaseRepository.js";

export interface IChatMessageRepository extends IBaseRepository<IChatMessage> {
  findByRoomId(roomId: string): Promise<IChatMessage[]>;
}
