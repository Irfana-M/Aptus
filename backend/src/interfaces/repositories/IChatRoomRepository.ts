import { IChatRoom } from "../models/chat.interface";
import { IBaseRepository } from "./IBaseRepository";

export interface IChatRoomRepository extends IBaseRepository<IChatRoom> {
  findBySessionId(sessionId: string): Promise<IChatRoom | null>;
}
