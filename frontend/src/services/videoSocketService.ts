import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../utils/authContext';

class VideoSocketService {
  private socket: Socket | null = null;

  private resolveToken(): string | null {
    
    const auth = AuthContext.getInstance();
    const fromContext = auth.getTokenForCurrentRole();
    if (fromContext) return fromContext;

    
    return (
      localStorage.getItem('student_accessToken') ||
      localStorage.getItem('mentor_accessToken') ||
      null
    );
  }

  connect(): Socket {
    
    if (this.socket?.connected) {
      return this.socket;
    }

   
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const token = this.resolveToken();

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    let socketUrl = apiUrl;
    try {
      socketUrl = new URL(apiUrl).origin;
    } catch {
      console.warn('[VideoSocket] Invalid VITE_API_URL, using as-is:', apiUrl);
    }



    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      
      forceNew: true,
    });

    this.socket.on('connect', () => {
     
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [VideoSocket] Connection error:', error.message);
    });

    this.socket.on('disconnect', () => {
      
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new VideoSocketService();
