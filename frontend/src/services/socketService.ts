import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(role?: string): Socket {
    if (this.socket?.connected) {
      console.log('⚡ Using existing socket connection');
      return this.socket;
    }

    // Get correct token from localStorage
    let token = null;
    
    if (role === 'admin') {
      token = localStorage.getItem('admin_accessToken') || localStorage.getItem('adminAccessToken');
    } else if (role) {
      token = localStorage.getItem(`${role}_accessToken`) || localStorage.getItem('accessToken');
    } else {
      // Smart discovery
      token = localStorage.getItem('student_accessToken') || 
              localStorage.getItem('mentor_accessToken') || 
              localStorage.getItem('accessToken');
    }
    
    console.log('🔌 Connecting to WebSocket...');
    console.log('📝 Token exists:', !!token);

    // Use VITE_API_URL if available, otherwise default to localhost:5000
    // We want the ORIGIN of the API URL.
    // e.g. http://localhost:5000/api/v1 -> http://localhost:5000
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    let socketUrl = apiUrl;
    try {
      socketUrl = new URL(apiUrl).origin;
    } catch {
      console.warn('Invalid VITE_API_URL, using as is:', apiUrl);
    }

    console.log('🌐 Connecting to Socket URL:', socketUrl);
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'], // Try websocket first, then polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    // Add connection event listeners
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected! Socket ID:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      // Helpful for debugging namespacing issues
      if (error.message === 'Invalid namespace') {
        console.error('⚠️ Check if server is running on a different namespace or path.');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.removeAllListeners(); // Clean up listeners to prevent memory leaks on reconnect
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export default new SocketService();