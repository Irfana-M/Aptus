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

  const trialClassIdRef = useRef<string | null>(null);
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
      setStatus('WebRTC Not Supported');
      return createFakeStream();
    }

    const constraintSets = [
      { name: 'HD Video + Audio', constraints: { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true } },
      { name: 'Standard Video + Audio', constraints: { video: true, audio: true } },
      { name: 'Video Only', constraints: { video: true, audio: false } },
      { name: 'Audio Only', constraints: { video: false, audio: true } }
    ];

    let lastErrorName = '';

    for (const set of constraintSets) {
      try {
        console.log(`📽️ [VideoCall] Trying ${set.name}:`, set.constraints);
        const stream = await navigator.mediaDevices.getUserMedia(set.constraints);
        
        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;
        
        console.log('✅ [VideoCall] Media granted:', { hasAudio, hasVideo, tracks: stream.getTracks().length });
        
        if (hasVideo && hasAudio) setStatus('Media Connected');
        else if (hasVideo) setStatus('Video Only (No Mic)');
        else if (hasAudio) {
            const isHardwareBusy = lastErrorName === 'NotReadableError';
            setStatus(isHardwareBusy ? 'Camera Busy (Using Audio)' : 'Audio Only (No Camera)');
        }
        
        return stream;
      } catch (err: any) {
        lastErrorName = err.name;
        console.warn(`⚠️ [VideoCall] ${set.name} failed (${err.name})`);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
           setStatus('Permissions Denied');
           break;
        }
      }
    }

    setStatus('Using Fallback Stream');
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
    trialClassIdRef.current = null;
    setRemoteMediaState({ isMuted: false, isVideoOff: false });
    setMinimized(false);
  }, []);

  const handleIceRestart = useCallback(async () => {
    if (!pcRef.current || pcRef.current.signalingState === 'closed' || !remoteSocketIdRef.current || !trialClassId) return;
    try {
      const offer = await pcRef.current.createOffer({ iceRestart: true });
      await pcRef.current.setLocalDescription(offer);
      socketRef.current?.emit('webrtc-offer', {
        trialClassId: trialClassIdRef.current,
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

    // Ensure we have transceivers for both audio and video regardless of local stream
    // This allows us to receive remote video even if our local camera is busy/failed.
    const hasAudioTrack = stream?.getAudioTracks().length ? true : false;
    const hasVideoTrack = stream?.getVideoTracks().length ? true : false;

    if (hasAudioTrack) {
        stream?.getAudioTracks().forEach(track => pc.addTrack(track, stream!));
    } else {
        console.log('📥 [WebRTC] No local audio track, adding receive-only audio transceiver');
        pc.addTransceiver('audio', { direction: 'recvonly' });
    }

    if (hasVideoTrack) {
        stream?.getVideoTracks().forEach(track => pc.addTrack(track, stream!));
    } else {
        console.log('📥 [WebRTC] No local video track, adding receive-only video transceiver');
        pc.addTransceiver('video', { direction: 'recvonly' });
    }
    pc.ontrack = (event) => {
      const track = event.track;
      console.log(`🎵 [WebRTC] Track detected: ${track.kind} (${track.id})`, { 
          enabled: track.enabled, 
          readyState: track.readyState,
          streams: event.streams.length
      });
      
      const incomingStream = event.streams[0];
      
      setRemoteStream(prev => {
        // If no remote stream state yet, create one
        if (!prev) {
          console.log('📺 [WebRTC] Creating first remote stream container');
          const newStream = new MediaStream();
          if (incomingStream) {
            incomingStream.getTracks().forEach(t => newStream.addTrack(t));
          } else {
            newStream.addTrack(track);
          }
          return newStream;
        }

        // If we already have a stream state, add the new tracks to it
        // Note: Adding a track to an existing MediaStream that is already set to a video.srcObject
        // should automatically start playing the new track if the video element is playing.
        const currentTracks = prev.getTracks();
        const tracksToAdd = incomingStream ? incomingStream.getTracks() : [track];
        
        let added = false;
        tracksToAdd.forEach(t => {
          if (!currentTracks.find(existing => existing.id === t.id)) {
              console.log(`📺 [WebRTC] Adding new ${t.kind} track to remote stream`);
              prev.addTrack(t);
              added = true;
          }
        });

        // Trigger a re-render if we added tracks, otherwise return unchanged
        return added ? new MediaStream(prev.getTracks()) : prev;
      });
    };
    pc.onicecandidate = (event) => {
      const currentTid = trialClassIdRef.current;
      if (event.candidate && socketRef.current && remoteSocketIdRef.current && currentTid) {
        console.log('🧊 [WebRTC] Emitting ICE candidate for room:', currentTid);
        socketRef.current.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          trialClassId: currentTid,
          toSocketId: remoteSocketIdRef.current,
        });
      } else if (event.candidate) {
        console.warn('⚠️ [WebRTC] ICE candidate ready but missing metadata:', { socket: !!socketRef.current, remoteId: !!remoteSocketIdRef.current, tid: currentTid });
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
      trialClassIdRef.current = tid;
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
      socket.off('join-success');
      socket.off('join-error');

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

      socket.on('join-success', (data: any) => {
          console.log('✅ [Socket] Join success:', data);
          setStatus('Connected to Room');
      });

      socket.on('join-error', (data: any) => {
          console.error('❌ [Socket] Join error:', data);
          setError(data.error || 'Failed to join room');
          setStatus('Join Error');
      });

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

  const toggleVideo = useCallback(() => {
    const newVideoState = !isVideoOff;
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = !newVideoState);
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
