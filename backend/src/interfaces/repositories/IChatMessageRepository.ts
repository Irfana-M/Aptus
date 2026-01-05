import { IChatMessage } from "../models/chat.interface";
import { IBaseRepository } from "./IBaseRepository";

export interface IChatMessageRepository extends IBaseRepository<IChatMessage> {
  findByRoomId(roomId: string): Promise<IChatMessage[]>;
}
