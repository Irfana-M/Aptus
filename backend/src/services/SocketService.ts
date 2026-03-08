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
  ) {}

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

          const roomName = `trial-class-${data.trialClassId}`;
          const chatRoomName = `session_chat_${data.trialClassId}`;
          await socket.join(roomName);
          await socket.join(chatRoomName);

          const clientsInRoom = Array.from(this._io.sockets.adapter.rooms.get(roomName) || []);
          const clientsInChatRoom = Array.from(this._io.sockets.adapter.rooms.get(chatRoomName) || []);
          console.log(`[JOIN-CALL] User ${socketUser.email} joined rooms: ${roomName}, ${chatRoomName}.`);
          console.log(`[JOIN-CALL] Clients in Video Room:`, clientsInRoom);
          console.log(`[JOIN-CALL] Clients in Chat Room:`, clientsInChatRoom);

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
          console.log(`[JOIN-CALL] Broadcasting user-joined to room: ${roomName} (excluding sender)`);
          socket.to(roomName).emit('user-joined', {
            userId: data.userId,
            userType: data.userType,
            socketId: socket.id,
            trialClassId: data.trialClassId,
            userEmail: socketUser.email
          });

          socket.emit('join-success', { 
            room: roomName,
            socketId: socket.id 
          });
          
          logger.info(`${data.userType} (${socketUser.email}) joined room ${roomName}`);
        } catch (error) {
          console.error('[JOIN-CALL] Error:', error);
          socket.emit('join-error', { error: 'Internal server error' });
        }
      });

      // ===== WEBRTC SIGNALING =====
      socket.on('webrtc-offer', (data: WebRTCOfferDto) => {
        console.log('📨 [OFFER] Forwarding offer to:', data.toSocketId);
        socket.to(data.toSocketId).emit('webrtc-offer', { 
          ...data, 
          fromSocketId: socket.id 
        });
      });

      socket.on('webrtc-answer', (data: WebRTCAnswerDto) => {
        console.log('📨 [ANSWER] Forwarding answer to:', data.toSocketId);
        socket.to(data.toSocketId).emit('webrtc-answer', { 
          ...data, 
          fromSocketId: socket.id 
        });
      });

      socket.on('webrtc-ice-candidate', (data: WebRTCIceCandidateDto) => {
        console.log('🧊 [ICE] Forwarding candidate to:', data.toSocketId);
        socket.to(data.toSocketId).emit('webrtc-ice-candidate', { 
          ...data, 
          fromSocketId: socket.id 
        });
      });

      socket.on('webrtc-is-speaking', (data: { isSpeaking: boolean, trialClassId: string, toSocketId: string }) => {
         socket.to(data.toSocketId).emit('webrtc-is-speaking', {
            isSpeaking: data.isSpeaking,
            fromSocketId: socket.id
         });
      });

      socket.on('media-state-change', (data: { type: 'audio' | 'video', enabled: boolean, trialClassId: string, toSocketId: string }) => {
        console.log(`🎥 [MEDIA-STATE] ${data.type} is now ${data.enabled ? 'enabled' : 'disabled'} for ${socket.id}`);
        socket.to(data.toSocketId).emit('media-state-change', {
          ...data,
          fromSocketId: socket.id
        });
      });

      socket.on('end-call', async (data: CallEndedDto) => {
        console.log('📞 [END-CALL] Ending call:', data);
        await this._videoCallService.endCall(data);
        this._io.to(`trial-class-${data.trialClassId}`).emit('call-ended', data);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 [DISCONNECT] Socket ${socket.id} disconnected`);
        logger.info(`Client disconnected: ${socket.id}`);
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