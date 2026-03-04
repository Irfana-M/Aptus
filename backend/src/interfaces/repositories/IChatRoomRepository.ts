import type { IChatRoom } from "../models/chat.interface.js";
import type { IBaseRepository } from "./IBaseRepository.js";

export interface IChatRoomRepository extends IBaseRepository<IChatRoom> {
  findBySessionId(sessionId: string): Promise<IChatRoom | null>;
}
