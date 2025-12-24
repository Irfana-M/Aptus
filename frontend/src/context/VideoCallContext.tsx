import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import socketService from '../services/socketService';
import { getErrorMessage } from '../utils/errorUtils';
import { Socket } from 'socket.io-client';

interface VideoCallContextType {
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
  remoteMediaState: { isMuted: boolean; isVideoOff: boolean };
  joinCall: (props: { trialClassId: string; userId: string; userType: 'student' | 'mentor' }) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  isMinimized: boolean;
  setMinimized: (val: boolean) => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trialClassId, setTrialClassId] = useState<string | null>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [status, setStatus] = useState('Idle'); 
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isMinimized, setMinimized] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const hasCreatedOffer = useRef(false);
  const iceCandidatesBuffer = useRef<RTCIceCandidateInit[]>([]);

  const iceServers = useMemo(() => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  }), []);

  const [remoteMediaState, setRemoteMediaState] = useState({
    isMuted: false,
    isVideoOff: false,
  });

  const createFakeStream = useCallback((): MediaStream => {
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
    const stream = canvas.captureStream(30);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  const initializeMedia = useCallback(async () => {
    setStatus('Requesting Media Permissions...');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return createFakeStream();
    }
    const constraintSets = [
      { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true },
      { video: true, audio: true },
      { video: true, audio: false },
      { video: false, audio: true }
    ];
    for (const constraints of constraintSets) {
      try {
        console.log('📽️ [VideoCall] Requesting media with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;
        console.log('✅ [VideoCall] Media granted:', { hasAudio, hasVideo, tracks: stream.getTracks().length });
        setStatus(stream.getAudioTracks().length === 0 ? 'Video Only (No Mic)' : 'Media Connected');
        return stream;
      } catch (err: any) {
        console.warn(`⚠️ [VideoCall] Constraint set failed (${err.name}):`, constraints);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') break;
      }
    }
    return createFakeStream();
  }, [createFakeStream]);

  const endCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    socketService.disconnect();
    hasCreatedOffer.current = false;
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStream(null);
    setIsConnected(false);
    setIsSocketConnected(false);
    setConnectionState('disconnected');
    setStatus('Call Ended');
    setTrialClassId(null);
    setRemoteMediaState({ isMuted: false, isVideoOff: false });
    setMinimized(false);
  }, []);

  const handleIceRestart = useCallback(async () => {
    if (!pcRef.current || pcRef.current.signalingState === 'closed' || !remoteSocketIdRef.current || !trialClassId) return;
    try {
      const offer = await pcRef.current.createOffer({ iceRestart: true });
      await pcRef.current.setLocalDescription(offer);
      socketRef.current?.emit('webrtc-offer', {
        trialClassId,
        toSocketId: remoteSocketIdRef.current,
        offer: pcRef.current.localDescription,
      });
    } catch (err) {
      console.error('ICE Restart failed:', err);
    }
  }, [trialClassId]);

  const createPeerConnection = useCallback((stream: MediaStream | null) => {
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;
    if (stream) {
      stream.getTracks().forEach(track => {
         console.log('📤 [WebRTC] Adding track to PC:', track.kind, track.label);
         pc.addTrack(track, stream);
      });
    } else {
      console.log('📥 [WebRTC] Setup receive-only transceivers');
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });
    }
    pc.ontrack = (event) => {
      const track = event.track;
      console.log('🎵 [WebRTC] Track detected:', track.kind, track.id, { 
          enabled: track.enabled, 
          readyState: track.readyState,
          streams: event.streams.length
      });
      
      const incomingStream = event.streams[0] || new MediaStream([track]);
      if (incomingStream) {
        setRemoteStream(prev => {
          if (!prev) {
             console.log('📺 [WebRTC] Creating first remote stream container');
             return new MediaStream(incomingStream.getTracks());
          }
          const currentTracks = prev.getTracks();
          const newTracks = incomingStream.getTracks();
          const finalStream = new MediaStream(currentTracks);
          newTracks.forEach(t => {
            if (!currentTracks.find(existing => existing.id === t.id)) {
                console.log('📺 [WebRTC] Adding new track to remote stream:', t.kind);
                finalStream.addTrack(t);
            }
          });
          return finalStream;
        });
      }
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && remoteSocketIdRef.current && trialClassId) {
        console.log('🧊 [WebRTC] Emitting ICE candidate');
        socketRef.current.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          trialClassId,
          toSocketId: remoteSocketIdRef.current,
        });
      }
    };
    pc.oniceconnectionstatechange = () => {
      console.log('🧊 [WebRTC] ICE state change:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') handleIceRestart();
    };
    pc.onconnectionstatechange = () => {
       console.log('🌐 [WebRTC] Connection state change:', pc.connectionState);
       setIsConnected(pc.connectionState === 'connected');
       setConnectionState(pc.connectionState);
    };
    pc.onsignalingstatechange = () => {
       console.log('🚥 [WebRTC] Signaling state change:', pc.signalingState);
    };
    return pc;
  }, [trialClassId, iceServers, handleIceRestart]);

  const joinCall = useCallback(async ({ trialClassId: tid, userId: uid, userType: utype }: { trialClassId: string; userId: string; userType: 'student' | 'mentor' }) => {
    if (trialClassId === tid && isConnected) return; 
    
    try {
      setTrialClassId(tid);
      setError(null);
      setStatus('Starting...');
      
      socketRef.current = socketService.connect(utype);
      const socket = socketRef.current;
      
      // Clear any existing listeners to prevent duplication
      socket.off('connect');
      socket.off('disconnect');
      socket.off('user-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('media-state-change');

      setIsSocketConnected(socket.connected);
      socket.on('connect', () => setIsSocketConnected(true));
      socket.on('disconnect', () => setIsSocketConnected(false));

      const stream = await initializeMedia();
      setLocalStream(stream); 
      localStreamRef.current = stream;
      
      const pc = createPeerConnection(stream); 

      const processIceBuffer = async () => {
        if (!pc || !pc.remoteDescription || iceCandidatesBuffer.current.length === 0) return;
        console.log(`🧊 [WebRTC] Processing ${iceCandidatesBuffer.current.length} buffered ICE candidates`);
        while (iceCandidatesBuffer.current.length > 0) {
          const candidate = iceCandidatesBuffer.current.shift();
          if (candidate) await pc.addIceCandidate(candidate).catch(console.error);
        }
      };

      socketRef.current.emit('join-call', { trialClassId: tid, userId: uid, userType: utype });

      socketRef.current.on('user-joined', (data: any) => {
        console.log('🤝 [Socket] User joined room:', data);
        if (data.socketId === socketRef.current?.id) return;
        remoteSocketIdRef.current = data.socketId;
        if (!hasCreatedOffer.current && pc.signalingState === 'stable') {
          console.log('📞 [WebRTC] Creating offer for new participant...');
          hasCreatedOffer.current = true;
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
              console.log('📤 [Socket] Sending offer...');
              socketRef.current?.emit('webrtc-offer', {
                trialClassId: tid,
                toSocketId: remoteSocketIdRef.current,
                offer: pc.localDescription,
              });
            })
            .catch(console.error);
        }
      });

      socket.on('webrtc-offer', async (data: any) => {
        console.log('📥 [Socket] Received offer from:', data.fromSocketId);
        remoteSocketIdRef.current = data.fromSocketId || data.toSocketId;
        if (pc.signalingState !== 'stable') {
            console.warn('⚠️ [WebRTC] Signaling state not stable, ignoring offer');
            return;
        }
        try {
          await pc.setRemoteDescription(data.offer);
          console.log('✅ [WebRTC] Remote description set (offer)');
          await processIceBuffer();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('📤 [Socket] Sending answer...');
          socket.emit('webrtc-answer', {
            trialClassId: tid,
            toSocketId: remoteSocketIdRef.current,
            answer: pc.localDescription,
          });
        } catch (err) { console.error('❌ [WebRTC] Error handling offer:', err); }
      });

      socket.on('webrtc-answer', async (data: any) => {
        if (pc.signalingState !== 'have-local-offer') {
          console.warn('⚠️ [WebRTC] Ignite answer in state:', pc.signalingState);
          return;
        }
        try {
          console.log('📥 [Socket] Received answer, setting remote description');
          await pc.setRemoteDescription(data.answer);
          await processIceBuffer();
        } catch (err) { console.error('❌ [WebRTC] Answer error:', err); }
      });

      socket.on('webrtc-ice-candidate', async (data: any) => {
        if (data.candidate) {
          console.log('🧊 [Socket] Received ICE candidate from:', data.fromSocketId);
          if (!pc.remoteDescription) {
              console.log('🧊 [WebRTC] Buffering ICE candidate');
              iceCandidatesBuffer.current.push(data.candidate);
          } else {
              await pc.addIceCandidate(data.candidate).catch(console.error);
          }
        }
      });

      socket.on('media-state-change', (data: any) => {
        setRemoteMediaState(prev => ({
          ...prev,
          [data.type === 'audio' ? 'isMuted' : 'isVideoOff']: !data.enabled
        }));
      });

    } catch (err: any) {
      setError('Failed to join call: ' + getErrorMessage(err));
    }
  }, [trialClassId, isConnected, initializeMedia, createPeerConnection]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = !newMutedState);
    setIsMuted(newMutedState);
    if (socketRef.current && remoteSocketIdRef.current && trialClassId) {
      socketRef.current.emit('media-state-change', {
        type: 'audio',
        enabled: !newMutedState,
        trialClassId,
        toSocketId: remoteSocketIdRef.current
      });
    }
  }, [isMuted, trialClassId]);

  const toggleVideo = useCallback(() => {
    const newVideoState = !isVideoOff;
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = !newVideoState);
    setIsVideoOff(newVideoState);
    if (socketRef.current && remoteSocketIdRef.current && trialClassId) {
      socketRef.current.emit('media-state-change', {
        type: 'video',
        enabled: !newVideoState,
        trialClassId,
        toSocketId: remoteSocketIdRef.current
      });
    }
  }, [isVideoOff, trialClassId]);

  return (
    <VideoCallContext.Provider value={{
      trialClassId, localStream, remoteStream, isConnected, isSocketConnected,
      connectionState, status, error, isMuted, isVideoOff, remoteMediaState,
      joinCall, endCall, toggleMute, toggleVideo, isMinimized, setMinimized
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (context === undefined) throw new Error('useVideoCall must be used within a VideoCallProvider');
  return context;
};
