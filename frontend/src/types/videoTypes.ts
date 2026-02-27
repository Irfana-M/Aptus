import type { Socket } from 'socket.io-client';

export interface RemoteMediaState {
  isMuted: boolean;
  isVideoOff: boolean;
}

export interface JoinCallProps {
  trialClassId: string;
  userId: string;
  userType: 'student' | 'mentor';
}

export interface VideoCallContextType {
  trialClassId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isSocketConnected: boolean;
  connectionState: string;
  status: string;
  error: string | null;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteMediaState: RemoteMediaState;
  socket: Socket | null;
  joinCall: (props: JoinCallProps) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isMinimized: boolean;
  setMinimized: (val: boolean) => void;
}
