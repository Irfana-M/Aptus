import { injectable, inject } from "inversify";
import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { logger } from "@/utils/logger.js";
import { TYPES } from "@/types.js";
import type { IVideoCallService } from "@/interfaces/services/IVideoCallService.js";
import type { ISocketService } from "@/interfaces/services/ISocketService.js";
import type {
  JoinCallRequestDto,
  WebRTCOfferDto,
  WebRTCAnswerDto,
  WebRTCIceCandidateDto,
  CallEndedDto
} from "../dtos/webrtcDTO.js";
import fs from "fs";
import jwt from 'jsonwebtoken';
import type { IUserRoleService } from "@/interfaces/services/IUserRoleSrvice.js";

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

          console.log('📞 [JOIN-CALL] Event received:', {
            socketId: socket.id,
            socketUser: socketUser,
            requestData: data
          });

          // Verify socket user exists
          if (!socketUser) {
            console.error('[JOIN-CALL] No user attached to socket');
            return socket.emit('join-error', { error: 'Authentication required' });
          }

          // Verify request matches socket user
          if (socketUser.id !== data.userId) {
            console.error(`[JOIN-CALL] User ID mismatch! Socket: ${socketUser.id}, Request: ${data.userId}`);
            return socket.emit('join-error', { error: 'User ID mismatch' });
          }

          if (socketUser.role !== data.userType) {
            console.error(`[JOIN-CALL] Role mismatch! Socket: ${socketUser.role}, Request: ${data.userType}`);
            return socket.emit('join-error', { error: 'Role mismatch' });
          }

          const videoRoom = `call:${data.sessionType}:${data.sessionMode}:${data.sessionId}`;
          const chatRoom = `chat:${data.sessionType}:${data.sessionMode}:${data.sessionId}`;
          
          await socket.join(videoRoom);
          await socket.join(chatRoom);

          console.log(`[JOIN-CALL] User ${socketUser.email} joined rooms: ${videoRoom}, ${chatRoom}.`);

          // Call video service to join call
          const result = await this._videoCallService.joinCall({
            ...data,
            socketId: socket.id
          });

          if (!result.success) {
            socket.emit('join-error', { error: result.error });
            return;
          }

          // Notify OTHERS in the room (exclude sender)
          console.log(`[JOIN-CALL] Broadcasting user-joined to room: ${videoRoom} (excluding sender)`);
          socket.to(videoRoom).emit('user-joined', {
            userId: data.userId,
            userType: data.userType,
            socketId: socket.id,
            sessionId: data.sessionId,
            sessionType: data.sessionType,
            sessionMode: data.sessionMode,
            userEmail: socketUser.email
          });

          socket.emit('join-success', {
            room: videoRoom,
            socketId: socket.id
          });

          logger.info("User joined call room", {
            socketId: socket.id,
            sessionId: data.sessionId,
            sessionType: data.sessionType,
            sessionMode: data.sessionMode,
            userId: data.userId,
            email: socketUser.email
          });
        } catch (error) {
          console.error('[JOIN-CALL] Error:', error);
          socket.emit('join-error', { error: 'Internal server error' });
        }
      });

      socket.on('join-chat', async (data: { sessionId: string, sessionType: 'trial' | 'regular', sessionMode: 'one-to-one' | 'group' }) => {
        const chatRoom = `chat:${data.sessionType}:${data.sessionMode}:${data.sessionId}`;
        await socket.join(chatRoom);
        console.log(`💬 [JOIN-CHAT] User joined room: ${chatRoom}`);
      });
      // ===== WEBRTC SIGNALING =====
      socket.on('webrtc-offer', (data: WebRTCOfferDto) => {
        logger.info("WebRTC offer forwarded", {
          fromSocketId: socket.id,
          toSocketId: data.toSocketId,
          sessionId: data.sessionId
        });
        socket.to(data.toSocketId).emit('webrtc-offer', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc-answer', (data: WebRTCAnswerDto) => {
        logger.info("WebRTC answer forwarded", {
          fromSocketId: socket.id,
          toSocketId: data.toSocketId,
          sessionId: data.sessionId
        });
        socket.to(data.toSocketId).emit('webrtc-answer', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('webrtc-ice-candidate', (data: WebRTCIceCandidateDto) => {
        logger.info("ICE candidate forwarded", {
          fromSocketId: socket.id,
          toSocketId: data.toSocketId,
          sessionId: data.sessionId
        });
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
        sessionType: 'trial' | 'regular',
        sessionMode: 'one-to-one' | 'group',
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
        const videoRoom = `call:${data.sessionType}:${data.sessionMode}:${data.sessionId}`;
        this._io.to(videoRoom).emit('call-ended', data);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 [DISCONNECT] Socket ${socket.id} disconnected`);
        logger.info(`Client disconnected: ${socket.id}`);
      });
      socket.on('leave-room', (data: { sessionId: string, sessionType: 'trial' | 'regular', sessionMode: 'one-to-one' | 'group' }) => {
        const videoRoom = `call:${data.sessionType}:${data.sessionMode}:${data.sessionId}`;
        const chatRoom = `chat:${data.sessionType}:${data.sessionMode}:${data.sessionId}`;

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