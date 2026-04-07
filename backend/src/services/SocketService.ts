import { injectable, inject } from "inversify";
import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { logger } from "@/utils/logger";
import { TYPES } from "@/types";
import type { IVideoCallService } from "@/interfaces/services/IVideoCallService";
import type { ISocketService } from "@/interfaces/services/ISocketService";
import type {
  JoinCallRequestDto,
  WebRTCOfferDto,
  WebRTCAnswerDto,
  WebRTCIceCandidateDto,
  CallEndedDto
} from "../dtos/webrtcDTO";
import fs from "fs";
import jwt from 'jsonwebtoken';
import type { IUserRoleService } from "@/interfaces/services/IUserRoleSrvice";

interface JwtPayload {
  id: string;
  email: string;
  role: 'mentor' | 'student' | 'admin';
  iat?: number;
  exp?: number;
}

interface SocketWithUser extends Socket {
  user?: JwtPayload;
}

@injectable()
export class SocketService implements ISocketService {
  private _io!: Server;
  private static httpServer: HttpServer | null = null;
  private userSocketMap = new Map<string, string>();
  constructor(
    @inject(TYPES.IVideoCallService) private _videoCallService: IVideoCallService,
    @inject(TYPES.IUserRoleService) private _userRoleService: IUserRoleService
  ) { }

  public static attach(server: HttpServer): void {
    SocketService.httpServer = server;
  }

  public initialize(): void {
    if (!SocketService.httpServer) {
      throw new Error("Call SocketService.attach(server) in server.ts first!");
    }

    this._io = new Server(SocketService.httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true
    });

    // ========== SOCKET AUTH MIDDLEWARE ==========
    this._io.use(async (socket, next) => {

      try { fs.appendFileSync('debug_socket.log', `[SOCKET AUTH] Middleware triggered for socket ${socket.id}\n`); } catch { /* ignore */ } console.log('🔐 [SOCKET AUTH] Middleware triggered');

      // Get token from auth or headers
      const token = socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')?.[1];

      console.log('[SOCKET AUTH] Token present:', !!token);

      if (!token) {
        console.error('[SOCKET AUTH] No token provided');
        return next(new Error('No token provided'));
      }

      try {
        // Verify and decode token
        const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        console.log('[SOCKET AUTH] Token decoded:', {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        });

        if (!['student', 'mentor', 'admin'].includes(decoded.role)) {
          console.error('[SOCKET AUTH] Invalid role:', decoded.role);
          return next(new Error('Invalid role'));
        }

        // Verify user exists in database with correct role
        const verification = await this._userRoleService.verifyUserRole(
          decoded.id,
          decoded.role
        );

        if (!verification.success) {
          console.error('[SOCKET AUTH] User verification failed:', verification.error);
          return next(new Error(verification.error || 'User verification failed'));
        }

        // Attach verified user to socket
        (socket as SocketWithUser).user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        };

        console.log('[SOCKET AUTH] User attached to socket:', (socket as SocketWithUser).user);
        next();
      } catch (error: unknown) {
        console.error('[SOCKET AUTH] Token verification failed:', error);
        return next(new Error('Invalid token'));
      }
    });

    // ========== SOCKET EVENT HANDLERS ==========
    this._io.on('connection', (socket: Socket) => {
      const user = (socket as SocketWithUser).user;
      logger.info(`New client connected: ${socket.id}, user: ${user?.email} (${user?.role})`);

      if (user) {
        socket.join(`user-${user.id}`);
        logger.info(`User ${user.id} joined private room user-${user.id} for notifications`);
      }

      socket.on('join-call', async (data: JoinCallRequestDto) => {
        try {
          const socketUser = (socket as SocketWithUser).user;

          console.log(`[SERVER] [JOIN-CALL] Event received. Socket: ${socket.id} Session: ${data.sessionId} User: ${data.userId}`);
          logger.info(`[SERVER] [JOIN-CALL] Event received: ${socket.id}`, { sessionId: data.sessionId, userId: data.userId });

          // Verify socket user exists
          if (!socketUser) {
            console.error('[JOIN-CALL] No user attached to socket');
            return socket.emit('join-error', { error: 'Authentication required' });
          }

          // Verify request matches socket user
          if (socketUser.id.toString() !== data.userId) {
            console.error(`[JOIN-CALL] ❌ User ID mismatch! Socket: "${socketUser.id.toString()}", Request: "${data.userId}"`);
            return socket.emit('join-error', { error: `User ID mismatch. Expected ${socketUser.id}, got ${data.userId}` });
          }

          if (socketUser.role !== data.userType) {
            console.error(`[JOIN-CALL] ❌ Role mismatch! Socket: "${socketUser.role}", Request: "${data.userType}"`);
            return socket.emit('join-error', { error: `Role mismatch. Socket is ${socketUser.role}, Request is ${data.userType}` });
          }

          const videoRoom = `call:${data.sessionId}`;
          const chatRoom = `chat:${data.sessionId}`;

          const existingSocketId = this.userSocketMap.get(data.userId);
          if (existingSocketId && existingSocketId !== socket.id) {
            console.warn(`⚠️ Removing old socket for user ${data.userId}: ${existingSocketId}`);

            const oldSocket = this._io.sockets.sockets.get(existingSocketId);
            if (oldSocket) {
              oldSocket.leave(`call:${data.sessionId}`);
              oldSocket.disconnect(true);
            }
          }

          // ✅ Save new socket
          this.userSocketMap.set(data.userId, socket.id);

          

          const roomSockets = Array.from(
            this._io.sockets.adapter.rooms.get(videoRoom) || []
          );

          await socket.join(videoRoom);
          await socket.join(chatRoom);
          // 🔥 convert socketIds → userIds (unique users only)
          const uniqueUserSockets: string[] = [];
          const seenUsers = new Set<string>();


          for (const sockId of roomSockets) {
            const sock = this._io.sockets.sockets.get(sockId) as SocketWithUser;
            const uid = sock?.user?.id;

            if (uid && !seenUsers.has(uid)) {
              seenUsers.add(uid);
              uniqueUserSockets.push(sockId);
            }
          }

          const existingParticipants = uniqueUserSockets;

          

          console.log(`[JOIN-CALL] User ${socketUser.email} joined rooms: ${videoRoom}, ${chatRoom}. Existing: ${existingParticipants.length}`);

          // Call video service to join call
          const result = await this._videoCallService.joinCall({
            ...data,
            socketId: socket.id
          });

          if (!result.success) {
            socket.emit('join-error', { error: result.error });
            return;
          }

          console.log(`[SERVER] [SIGNALING] Emitting user-joined to room ${videoRoom}. New user: ${socket.id}`);
          // Notify OTHERS in the room (exclude sender)
          socket.to(videoRoom).emit('user-joined', {
            userId: data.userId,
            userType: data.userType,
            socketId: socket.id,
            sessionId: data.sessionId,
            userEmail: socketUser.email
          });

          console.log(`[SERVER] [JOIN-SUCCESS] Emitting to ${socket.id} Session: ${data.sessionId}, Mode: ${result.callMode}`);
          socket.emit('join-success', {
            room: videoRoom,
            socketId: socket.id,
            existingParticipants,
            callMode: result.callMode // ADDED
          });

          logger.info("User joined call room", {
            socketId: socket.id,
            sessionId: data.sessionId,
            userId: data.userId,
            email: socketUser.email
          });
        } catch (error) {
          console.error('[JOIN-CALL] Error:', error);
          socket.emit('join-error', { error: 'Internal server error' });
        }
      });

      socket.on('join-chat', async (data: { sessionId: string }) => {
        const chatRoom = `chat:${data.sessionId}`;
        await socket.join(chatRoom);
        console.log(`💬 [JOIN-CHAT] User joined room: ${chatRoom}`);
      });
      // ===== WEBRTC SIGNALING =====
      socket.on('webrtc-offer', (data: WebRTCOfferDto) => {
        console.log(`[SERVER] [SIGNALING] Receiving webrtc-offer from ${socket.id} to ${data.toSocketId} Session: ${data.sessionId}`);
        logger.info("[SERVER] [SIGNALING] WebRTC offer received", {
          fromSocketId: socket.id,
          toSocketId: data.toSocketId,
          sessionId: data.sessionId
        });
        console.log(`[SERVER] [SIGNALING] Forwarding webrtc-offer to ${data.toSocketId}`);
        socket.to(data.toSocketId).emit('webrtc-offer', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc-answer', (data: WebRTCAnswerDto) => {
        console.log(`[SERVER] [SIGNALING] Receiving webrtc-answer from ${socket.id} to ${data.toSocketId} Session: ${data.sessionId}`);
        logger.info("[SERVER] [SIGNALING] WebRTC answer received", {
          fromSocketId: socket.id,
          toSocketId: data.toSocketId,
          sessionId: data.sessionId
        });
        console.log(`[SERVER] [SIGNALING] Forwarding webrtc-answer to ${data.toSocketId}`);
        socket.to(data.toSocketId).emit('webrtc-answer', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc-ice-candidate', (data: WebRTCIceCandidateDto) => {
        console.log(`[SERVER] [SIGNALING] Receiving ICE candidate from ${socket.id} to ${data.toSocketId} Session: ${data.sessionId}`);
        logger.info("[SERVER] [SIGNALING] ICE candidate received", {
          fromSocketId: socket.id,
          toSocketId: data.toSocketId,
          sessionId: data.sessionId
        });
        console.log(`[SERVER] [SIGNALING] Forwarding ICE candidate to ${data.toSocketId}`);
        socket.to(data.toSocketId).emit('webrtc-ice-candidate', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc-is-speaking', (data: { isSpeaking: boolean, sessionId: string, toSocketId: string }) => {
        socket.to(data.toSocketId).emit('webrtc-is-speaking', {
          isSpeaking: data.isSpeaking,
          fromSocketId: socket.id,
          sessionId: data.sessionId
        });
      });

      socket.on('media-state-change', (data: {
        type: 'audio' | 'video',
        enabled: boolean,
        sessionId: string,
        toSocketId: string
      }) => {
        console.log(`🎥 [MEDIA-STATE] ${data.type} is now ${data.enabled ? 'enabled' : 'disabled'} for ${socket.id}`);
        socket.to(data.toSocketId).emit('media-state-change', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('end-call', async (data: CallEndedDto) => {
        console.log('📞 [END-CALL] Ending call:', data);
        await this._videoCallService.endCall(data);
        const videoRoom = `call:${data.sessionId}`;
        this._io.to(videoRoom).emit('call-ended', data);
      });

      socket.on('disconnect', () => {
        logger.info(`🔌 [DISCONNECT] Socket ${socket.id} disconnected`);

        // 🔥 Remove from userSocketMap
        for (const [userId, sockId] of this.userSocketMap.entries()) {
          if (sockId === socket.id) {
            this.userSocketMap.delete(userId);
            logger.info(`🧹 Removed user ${userId} from socket map`);
            break;
          }
        }
      });
      socket.on('leave-room', (data: { sessionId: string }) => {
        const videoRoom = `call:${data.sessionId}`;
        const chatRoom = `chat:${data.sessionId}`;

        logger.info("User left call room", {
          socketId: socket.id,
          sessionId: data.sessionId
        });

        socket.leave(videoRoom);
        socket.leave(chatRoom);

        socket.to(videoRoom).emit('user-left', {
          socketId: socket.id,
          sessionId: data.sessionId
        });
      });

      socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
          if (room.startsWith('call:')) {
            socket.to(room).emit('user-left', {
              socketId: socket.id
            });
          }
        }
      });

    });
  }

  public getIO(): Server { return this._io; }
  public emitToRoom(room: string, event: string, data: unknown) {
    this._io.to(room).emit(event, data);
  }
  public emitToUser(socketId: string, event: string, data: unknown) {
    this._io.to(socketId).emit(event, data);
  }
}