import { Server } from 'socket.io';

export interface ISocketService {
  initialize(): void;
  getIO(): Server;
  emitToRoom(room: string, event: string, data: any): void;
  emitToUser(socketId: string, event: string, data: any): void;
}