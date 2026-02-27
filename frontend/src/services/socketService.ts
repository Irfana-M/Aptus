import { io, Socket } from 'socket.io-client';
import { AuthContext } from '../utils/authContext';

class SocketService {
  private socket: Socket | null = null;
  private currentToken: string | null = null;

  connect(role?: string): Socket {

    let token = null;

    if (role === 'admin') {
      token = localStorage.getItem('admin_accessToken') || localStorage.getItem('adminAccessToken');
    } else {

      const auth = AuthContext.getInstance();
      token = auth.getTokenForCurrentRole();


      if (!token && role && role !== 'video') {
        token = localStorage.getItem(`${role}_accessToken`);
      }


      if (!token) {
        token = localStorage.getItem('accessToken') ||
          localStorage.getItem('student_accessToken') ||
          localStorage.getItem('mentor_accessToken') ||
          localStorage.getItem('admin_accessToken');
      }
    }


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
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });


    this.socket.on('connect', () => {

    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error details:', {
        message: error.message,
        url: socketUrl,
        tokenPresent: !!token,
        transport: this.socket?.io?.opts?.transports
      });

      if (error.message === 'Invalid namespace') {
        console.error('⚠️ Check if server is running on a different namespace or path.');
      }
    });

    this.socket.on('disconnect', () => {

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