import type { Socket } from 'socket.io-client';

export interface RemoteMediaState {
  isMuted: boolean;
  isVideoOff: boolean;
}

export interface JoinCallProps {
  sessionId: string;
  sessionType: 'trial' | 'regular';
  sessionMode: 'one-to-one' | 'group';
  userId: string;
  userType: 'student' | 'mentor';
}

export interface VideoCallContextType {
  sessionId: string | null;
  sessionType: 'trial' | 'regular' | null;
  sessionMode: 'one-to-one' | 'group' | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  participants: string[];
  isConnected: boolean;
  isSocketConnected: boolean;
  connectionState: string;
  status: string;
  error: string | null;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteMediaStates: Record<string, RemoteMediaState>;
  socket: Socket | null;
  joinCall: (props: JoinCallProps) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isMinimized: boolean;
  setMinimized: (val: boolean) => void;
}
