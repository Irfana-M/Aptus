import { io, Socket } from 'socket.io-client';
import { TokenManager } from '../utils/tokenManager';

class SocketService {
  private socket: Socket | null = null;
  private currentToken: string | null = null;

  connect(): Socket {

    const token = TokenManager.getToken();

    if (this.socket && this.currentToken !== token) {
      this.disconnect();
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    this.currentToken = token;

    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      throw new Error('VITE_API_URL is not defined');
    }

    let socketUrl = apiUrl;

    try {
      socketUrl = new URL(apiUrl).origin;
    } catch {
      console.warn('Invalid VITE_API_URL, using as is:', apiUrl);
    }

    this.socket = io(socketUrl, {
      path: "/socket.io/",
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log("✅ Socket connected");
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    this.socket.on('disconnect', () => {
      console.log("🔌 Socket disconnected");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.currentToken = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();