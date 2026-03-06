// This file is now only for the Provider to satisfy react-refresh
import React from 'react';
import { Socket } from 'socket.io-client';
import videoSocketService from '../services/videoSocketService';
import { getErrorMessage } from '../utils/errorUtils';
import type { RemoteMediaState, JoinCallProps } from '../types/video.types';
import { VideoCallContext } from './videoCallContextStore';

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trialClassId, setTrialClassId] = React.useState<string | null>(null);
  
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState('disconnected');
  const [status, setStatus] = React.useState('Idle'); 
  const [isSocketConnected, setIsSocketConnected] = React.useState(false);
  const [isMinimized, setMinimized] = React.useState(false);

  const trialClassIdRef = React.useRef<string | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const pcRef = React.useRef<RTCPeerConnection | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const remoteSocketIdRef = React.useRef<string | null>(null);
  const hasCreatedOffer = React.useRef(false);
  const iceCandidatesBuffer = React.useRef<RTCIceCandidateInit[]>([]);

  const iceServers = React.useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  }), []);

  const [remoteMediaState, setRemoteMediaState] = React.useState<RemoteMediaState>({
    isMuted: false,
    isVideoOff: false,
  });

  const createFakeStream = React.useCallback((): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let x = 0;
    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#3CB4B4';
      ctx.font = 'bold 30px Inter, Arial';
      ctx.fillText('Aptus Virtual Camera', 180, 220);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText('Hardware camera busy or unavailable', 185, 260);
      ctx.fillStyle = '#3CB4B4';
      ctx.beginPath();
      ctx.arc((x % 400) + 120, 320, 10, 0, Math.PI * 2);
      ctx.fill();
      x += 3;
      if (pcRef.current) requestAnimationFrame(draw);
    };
    draw();
    const stream = (canvas as unknown as { captureStream: (fps: number) => MediaStream }).captureStream(30);
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const dest = audioCtx.createMediaStreamDestination();
      oscillator.connect(gainNode);
      gainNode.connect(dest);
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.01;
      oscillator.start();
      setInterval(() => {
          if (audioCtx.state === 'running') {
              gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
              gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
          }
      }, 2000);
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    } catch (e) {
      console.warn('🔇 Could not create fallback audio:', e);
    }
    return stream;
  }, []);

  const initializeMedia = React.useCallback(async () => {
    setStatus('Requesting Media Permissions...');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('WebRTC Not Supported');
      return createFakeStream();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      console.log('✅ [Media] Local stream acquired');
      return stream;
    } catch (e) {
      console.warn('⚠️ [Media] Error getting real media, using fallback:', e);
      return createFakeStream();
    }
  }, [createFakeStream]);

  const hasJoinedRef = React.useRef(false);

  const createPeerConnection = React.useCallback((targetSocketId: string) => {
    // IDEMPOTENCY GUARD: Do not overwrite a valid active connection
    if (pcRef.current && (pcRef.current.connectionState === 'connected' || pcRef.current.connectionState === 'connecting')) {
      console.warn('⚠️ [WebRTC] PeerConnection already active. Skipping duplicate creation.');
      return pcRef.current;
    }

    console.log('🔄 [WebRTC] Creating new PC for:', targetSocketId);
    
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;

    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current!);
        });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-ice-candidate', {
          toSocketId: targetSocketId,
          candidate: event.candidate,
          trialClassId: trialClassIdRef.current
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📺 [Media] Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('📊 [PC] Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setStatus('Connected');
      }
    };

    return pc;
  }, [iceServers]);

  // MANAGED SOCKET LISTENERS
  React.useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isSocketConnected) return;

    console.log('🔗 [Socket] Registering synchronized listeners...');

    const handleUserJoined = async ({ socketId }: { socketId: string }) => {
      console.log('👋 [Socket] user-joined:', socketId);
      remoteSocketIdRef.current = socketId;
      const pc = createPeerConnection(socketId);
      if (!pc) return;
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', {
        toSocketId: socketId,
        sdp: pc.localDescription,
        trialClassId: trialClassIdRef.current
      });
      hasCreatedOffer.current = true;
    };

    const handleOffer = async ({ fromSocketId, sdp }: { fromSocketId: string, sdp: RTCSessionDescriptionInit }) => {
      console.log('📥 [Socket] webrtc-offer from:', fromSocketId);
      remoteSocketIdRef.current = fromSocketId;
      const pc = createPeerConnection(fromSocketId);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', {
        toSocketId: fromSocketId,
        sdp: pc.localDescription,
        trialClassId: trialClassIdRef.current
      });

      iceCandidatesBuffer.current.forEach(async (candidate) => {
          try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
              console.warn('Error adding buffered ice candidate', e);
          }
      });
      iceCandidatesBuffer.current = [];
    };

    const handleAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      console.log('📥 [Socket] webrtc-answer received');
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding ice candidate', e);
        }
      } else {
        iceCandidatesBuffer.current.push(candidate);
      }
    };

    const handleUserLeft = () => {
      console.log('👋 [Socket] user-left');
      setIsConnected(false);
      setRemoteStream(null);
      remoteSocketIdRef.current = null;
      setStatus('User Left');
      if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
      }
    };

    const handleMediaChange = (data: { type: string; enabled: boolean }) => {
      setRemoteMediaState(prev => ({
        ...prev,
        [data.type === 'audio' ? 'isMuted' : 'isVideoOff']: !data.enabled
      }));
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('user-left', handleUserLeft);
    socket.on('media-state-change', handleMediaChange);

    return () => {
      console.log('🧹 [Socket] Cleaning up listeners...');
      socket.off('user-joined', handleUserJoined);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('user-left', handleUserLeft);
      socket.off('media-state-change', handleMediaChange);
    };
  }, [isSocketConnected, createPeerConnection]);

  const joinCall = React.useCallback(async (props: JoinCallProps) => {
    // SINGLETON EXECUTION GUARD
    if (hasJoinedRef.current) {
      console.warn('⚠️ [VideoCall] joinCall already in progress or completed.');
      return;
    }
    hasJoinedRef.current = true;

    try {
      console.log('🚀 [VideoCall] Initializing signaling and media...');
      setTrialClassId(props.trialClassId);
      trialClassIdRef.current = props.trialClassId;
      
      const stream = await initializeMedia();
      setLocalStream(stream);
      localStreamRef.current = stream;

      const socket = videoSocketService.connect();
      socketRef.current = socket;

      // The socketService is a singleton — if the socket is already connected
      // (e.g. reused from a notifications session), the 'connect' event will
      // never fire again. We must emit join-call immediately in that case.
      const emitJoinCall = () => {
        console.log('✅ [Socket] Connected. Emitting join-call...');
        setIsSocketConnected(true);
        socket.emit('join-call', {
          trialClassId: props.trialClassId,
          userId: props.userId,
          userType: props.userType
        });
      };

      if (socket.connected) {
        console.log('⚡ [Socket] Already connected — emitting join-call immediately');
        emitJoinCall();
      } else {
        socket.on('connect', emitJoinCall);
      }

      socket.on('disconnect', () => {
        console.log('❌ [Socket] Disconnected');
        setIsSocketConnected(false);
      });

    } catch (err: unknown) {
      hasJoinedRef.current = false; // Allow retry on fatal error
      setError('Failed to join call: ' + getErrorMessage(err));
    }
  }, [initializeMedia]);

  const toggleMute = React.useCallback(() => {
    const newMutedState = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = !newMutedState;
    });
    setIsMuted(newMutedState);
    const currentTid = trialClassIdRef.current;
    if (socketRef.current && remoteSocketIdRef.current && currentTid) {
      socketRef.current.emit('media-state-change', {
        type: 'audio',
        enabled: !newMutedState,
        trialClassId: currentTid,
        toSocketId: remoteSocketIdRef.current
      });
    }
  }, [isMuted]);

  const toggleVideo = React.useCallback(() => {
    const newVideoState = !isVideoOff;
    localStreamRef.current?.getVideoTracks().forEach(t => {
      t.enabled = !newVideoState;
    });
    setIsVideoOff(newVideoState);
    const currentTid = trialClassIdRef.current;
    if (socketRef.current && remoteSocketIdRef.current && currentTid) {
      socketRef.current.emit('media-state-change', {
        type: 'video',
        enabled: !newVideoState,
        trialClassId: currentTid,
        toSocketId: remoteSocketIdRef.current
      });
    }
  }, [isVideoOff]);

  const endCall = React.useCallback(() => {
    console.log('🛑 Ending call and cleaning up resources...');
    
    // Stop all media tracks
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
            console.log(`Stopping track: ${track.kind}`);
            track.stop();
        });
        localStreamRef.current = null;
    }

    // Close Peer Connection
    if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
    }

    // Emit leave and disconnect socket
    if (socketRef.current) {
        socketRef.current.emit('leave-room', { trialClassId: trialClassIdRef.current });
        socketRef.current.disconnect();
        socketRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setIsSocketConnected(false);
    setTrialClassId(null);
    trialClassIdRef.current = null;
    hasJoinedRef.current = false; // Reset for next session
    setStatus('Idle');
    setError(null);
  }, []);

  return (
    <VideoCallContext.Provider value={{
      trialClassId, localStream, remoteStream, isConnected, isSocketConnected,
      connectionState, status, error, isMuted, isVideoOff, remoteMediaState,
      socket: socketRef.current,
      joinCall, endCall, toggleMute, toggleVideo, isMinimized, setMinimized
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

