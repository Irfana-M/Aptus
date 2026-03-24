import { io, Socket } from "socket.io-client";
import { TokenManager } from "../utils/tokenManager";

class VideoSocketService {
  private socket: Socket | null = null;

private resolveToken(): string | null {
  return TokenManager.getToken();
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

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    let socketUrl = apiUrl;
    try {
      socketUrl = new URL(apiUrl).origin;
    } catch {
      console.warn("[VideoSocket] Invalid VITE_API_URL:", apiUrl);
    }

    this.socket = io(socketUrl, {
      auth: token ? { token } : undefined,
      transports: ["websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      forceNew: false,
    });

    this.socket.on("connect", () => {
      console.log("✅ [VideoSocket] Connected:", this.socket?.id);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ [VideoSocket] Connection error:", error.message);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("⚠️ [VideoSocket] Disconnected:", reason);
    });

    this.socket.io.on("reconnect_attempt", () => {
      const newToken = this.resolveToken();
      if (newToken && this.socket) {
        this.socket.auth = { token: newToken };
      }
    });
    this.socket.on("join-error", (err) => {
  console.error("[CLIENT] [SOCKET] join-error:", err);
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