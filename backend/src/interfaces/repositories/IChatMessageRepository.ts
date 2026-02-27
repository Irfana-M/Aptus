import type { IChatMessage } from "../models/chat.interface";
import type { IBaseRepository } from "./IBaseRepository";

export interface IChatMessageRepository extends IBaseRepository<IChatMessage> {
  findByRoomId(roomId: string): Promise<IChatMessage[]>;
}
