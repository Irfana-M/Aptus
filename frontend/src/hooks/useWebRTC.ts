import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import socketService from '../services/socketService';
import { getErrorMessage } from '../utils/errorUtils';
import { Socket } from 'socket.io-client';

interface UseWebRTCProps {
  trialClassId: string;
  userId: string;
  userType: 'student' | 'mentor';
}

export function useWebRTC({ trialClassId, userId, userType }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [status, setStatus] = useState('Idle'); 
  const [isSocketConnected, setIsSocketConnected] = useState(false);

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

  // Helper to create a fake video stream (canvas) for testing
  const createFakeStream = useCallback((): MediaStream => {
    console.log('🎨 [WebRTC] Creating fallback fake stream...');
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Draw a moving animation
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
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const dest = audioCtx.createMediaStreamDestination();
      
      oscillator.connect(gainNode);
      gainNode.connect(dest);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.01; // Extremely low volume beep
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
      console.warn('🔇 [WebRTC] Could not create fallback audio:', e);
    }
    
    return stream;
  }, []);

  const initializeMedia = useCallback(async () => {
    setStatus('Requesting Media Permissions...');
    console.log('🎥 [WebRTC] Requesting media permissions...');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ [WebRTC] MediaDevice API not supported');
      setStatus('System Unsupported');
      return createFakeStream();
    }

    if (!window.isSecureContext) {
      console.warn('❌ [WebRTC] NOT A SECURE CONTEXT! UserMedia will likely fail.');
    }

    // Attempt multiple constraint sets from best to basic
    const constraintSets = [
      { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true },
      { video: true, audio: true },
      { video: true, audio: false },
      { video: false, audio: true }
    ];

    for (const constraints of constraintSets) {
      try {
        console.log('📡 [WebRTC] Attempting constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ [WebRTC] Media stream obtained');
        
        let msg = 'Media Connected';
        if (stream.getAudioTracks().length === 0) msg = 'Video Only (No Mic)';
        if (stream.getVideoTracks().length === 0) msg = 'Audio Only (No Cam)';
        setStatus(msg);
        
        return stream;
      } catch (err: unknown) {
        const error = err as Error;
        console.warn(`⚠️ [WebRTC] Failed with constraints: ${JSON.stringify(constraints)} Error: ${error.name} - ${error.message}`);
        
        // If it's a security/permission error, we might want to stop trying everything
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          console.error('❌ [WebRTC] Permission denied by user');
          break;
        }
      }
    }

    console.error('❌ [WebRTC] All hardware media capture attempts failed');
    setStatus('Fallback Mode (Virtual Camera)');
    return createFakeStream();
  }, [createFakeStream]);

  // Handle ICE Restart (Reconnection)
  const handleIceRestart = useCallback(async () => {
    if (!pcRef.current || pcRef.current.signalingState === 'closed' || !remoteSocketIdRef.current) return;
    
    try {
      console.log('🔄 [WebRTC] Initiating ICE Restart...');
      const offer = await pcRef.current.createOffer({ iceRestart: true });
      await pcRef.current.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('webrtc-offer', {
          trialClassId,
          toSocketId: remoteSocketIdRef.current,
          offer: pcRef.current.localDescription,
        });
      }
    } catch (err) {
      console.error('❌ [WebRTC] ICE Restart failed:', err);
    }
  }, [trialClassId]);

  const createPeerConnection = useCallback((stream: MediaStream | null) => {
    console.log('🔗 [WebRTC] Creating RTCPeerConnection...');
    
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;

    // Add local tracks ONLY if stream exists
    if (stream) {
      console.log('🎥 [WebRTC] Adding local tracks to peer connection...');
      stream.getTracks().forEach(track => {
        console.log(`➕ [WebRTC] Adding ${track.kind} track:`, track.id);
        pc.addTrack(track, stream);
      });
    } else {
      console.log('👀 [WebRTC] No local stream - connection will be receive-only');
      console.log('📡 [WebRTC] Adding receive-only transceivers...');
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });
    }

    // Remote track handler - ENHANCED
    pc.ontrack = (event) => {
      console.log('📹 [WebRTC] REMOTE TRACK RECEIVED!', {
        trackKind: event.track.kind,
        trackId: event.track.id,
        streamId: event.streams[0]?.id,
        streamsCount: event.streams.length,
        trackEnabled: event.track.enabled,
        trackReadyState: event.track.readyState
      });
      
      const incomingStream = event.streams[0];
      
      if (incomingStream) {
        console.log('✅ [WebRTC] Setting remote stream:', incomingStream.id);
        
        // Use a functional update to ensure we keep all tracks from multiple ontrack events
        setRemoteStream(prev => {
           if (!prev) return new MediaStream(incomingStream.getTracks());
           
           const currentTracks = prev.getTracks();
           const newTracks = incomingStream.getTracks();
           
           const finalStream = new MediaStream(currentTracks);
           newTracks.forEach(track => {
             if (!currentTracks.find(t => t.id === track.id)) {
               console.log(`➕ [WebRTC] Adding new remote track: ${track.kind}`);
               finalStream.addTrack(track);
             }
           });
           return finalStream;
        });
      } else if (event.track) {
        console.warn('⚠️ [WebRTC] No stream in ontrack, using single track fallback');
        setRemoteStream(prev => {
           const finalStream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
           if (!finalStream.getTracks().find(t => t.id === event.track.id)) {
             console.log(`➕ [WebRTC] Adding single remote track fallback: ${event.track.kind}`);
             finalStream.addTrack(event.track);
           }
           return finalStream;
        });
      }
    };
    
    // ICE Candidate Handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && remoteSocketIdRef.current) {
        console.log('📤 [WebRTC] Sending ICE candidate');
        socketRef.current.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          trialClassId,
          toSocketId: remoteSocketIdRef.current,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 [WebRTC] ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        console.warn('⚠️ [WebRTC] Connection lost, attempting ICE restart...');
        handleIceRestart();
      }
    };
    
    pc.onsignalingstatechange = () => console.log('📡 [WebRTC] Signaling state:', pc.signalingState);
    pc.onconnectionstatechange = () => {
       console.log('🔗 [WebRTC] Connection state:', pc.connectionState);
       setIsConnected(pc.connectionState === 'connected');
       setConnectionState(pc.connectionState);
    };

    return pc;
  }, [trialClassId, iceServers, handleIceRestart]);



  const joinCall = useCallback(async () => {
    try {
       
      setStatus('Starting Join Process...');
      console.log('🚀 [WebRTC] STARTING JOIN CALL PROCESS');
      
      setStatus('Connecting Socket...');
      socketRef.current = socketService.connect(userType);
      
      if (socketRef.current.connected) setIsSocketConnected(true);
      socketRef.current.on('connect', () => setIsSocketConnected(true));
      socketRef.current.on('disconnect', () => setIsSocketConnected(false));


    
      console.log('🎥 [WebRTC] Getting media stream...');
      const stream = await initializeMedia();
      setLocalStream(stream); 
      localStreamRef.current = stream;
      
      if (stream) {
        console.log('✅ [WebRTC] Media stream set to state');
      } else {
        console.log('⚠️ [WebRTC] Media stream is NULL (Spectator)');
      }

      
      console.log('🔗 [WebRTC] Creating peer connection...');
      const pc = createPeerConnection(stream); 

      const processIceBuffer = async () => {
        if (!pc || !pc.remoteDescription || iceCandidatesBuffer.current.length === 0) return;
        console.log(`🧊 [WebRTC] Processing ${iceCandidatesBuffer.current.length} buffered candidates`);
        while (iceCandidatesBuffer.current.length > 0) {
          const candidate = iceCandidatesBuffer.current.shift();
          if (candidate) {
            try {
              await pc.addIceCandidate(candidate);
              console.log('✅ [WebRTC] Buffered ICE candidate added');
            } catch (err) {
              console.error('❌ [WebRTC] Error adding buffered ICE candidate:', err);
            }
          }
        }
      };

      setStatus('Emitting Join Call Event...');
      console.log('📤 [WebRTC] Emitting join-call...');
      socketRef.current.emit('join-call', { trialClassId, userId, userType });

      // ========== SOCKET EVENT HANDLERS ==========
      
      socketRef.current.on('join-success', (data: { message: string }) => {
        console.log('✅ [WebRTC] JOIN-SUCCESS from server:', data);
      });

      socketRef.current.on('join-error', (data: { error: string }) => {
        console.error('❌ [WebRTC] JOIN-ERROR from server:', data);
        setError('Failed to join call: ' + (data.error || 'Unknown error'));
      });

      socketRef.current.on('user-joined', (data: { socketId: string; userId: string; userType: string }) => {
        console.log('👤 [WebRTC] USER-JOINED event:', {
          remoteSocketId: data.socketId,
          mySocketId: socketRef.current?.id,
          userId: data.userId,
          userType: data.userType
        });

        if (!socketRef.current || data.socketId === socketRef.current.id) {
          console.log('⚠️ [WebRTC] Ignoring my own join event');
          return;
        }

        remoteSocketIdRef.current = data.socketId;
        console.log('🎯 [WebRTC] Set remote socket ID:', remoteSocketIdRef.current);

        if (!hasCreatedOffer.current && pc.signalingState === 'stable') {
          hasCreatedOffer.current = true;
          console.log('📨 [WebRTC] Creating WebRTC offer...');
          
          pc.createOffer()
            .then(offer => {
              console.log('✅ [WebRTC] Offer created:', {
                type: offer.type,
                hasSDP: !!offer.sdp,
                sdpLength: offer.sdp?.length
              });
              return pc.setLocalDescription(offer);
            })
            .then(() => {
              console.log('✅ [WebRTC] Local description set');
              console.log('📤 [WebRTC] Sending offer to:', remoteSocketIdRef.current);
              
              if (socketRef.current) {
                socketRef.current.emit('webrtc-offer', {
                  trialClassId,
                  toSocketId: remoteSocketIdRef.current,
                  offer: pc.localDescription,
                });
              }
            })
            .catch(err => {
              console.error('❌ [WebRTC] Error creating/sending offer:', err);
            });
        }
      });

      socketRef.current.on('webrtc-offer', async (data: { fromSocketId: string; toSocketId: string; offer: RTCSessionDescriptionInit }) => {
        console.log('📨 [WebRTC] Received OFFER:', {
          from: data.fromSocketId,
          offerType: data.offer?.type,
          currentState: pc.signalingState
        });

        remoteSocketIdRef.current = data.fromSocketId || data.toSocketId;

        if (pc.signalingState !== 'stable') {
          console.log('⚠️ [WebRTC] Can\'t handle offer, signaling state is:', pc.signalingState);
          return;
        }

        try {
          console.log('🔧 [WebRTC] Setting remote description (offer)...');
          await pc.setRemoteDescription(data.offer);
          console.log('✅ [WebRTC] Remote description set');
          await processIceBuffer();

          console.log('🔧 [WebRTC] Creating answer...');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('✅ [WebRTC] Answer created and local description set');

          console.log('📤 [WebRTC] Sending answer to:', remoteSocketIdRef.current);
          if (socketRef.current) {
            socketRef.current.emit('webrtc-answer', {
              trialClassId,
              toSocketId: remoteSocketIdRef.current,
              answer: pc.localDescription,
            });
          }
        } catch (err) {
          console.error('❌ [WebRTC] Error handling offer:', err);
        }
      });

      socketRef.current.on('webrtc-answer', async (data: { fromSocketId: string; answer: RTCSessionDescriptionInit }) => {
        console.log('📨 [WebRTC] Received ANSWER:', {
          from: data.fromSocketId,
          answerType: data.answer?.type,
          currentState: pc.signalingState
        });

        if (pc.signalingState !== 'have-local-offer') {
          console.log('⚠️ [WebRTC] Not in have-local-offer state, current:', pc.signalingState);
          return;
        }

        try {
          await pc.setRemoteDescription(data.answer);
          console.log('✅ [WebRTC] Remote description (answer) set');
          await processIceBuffer();
        } catch (err) {
          console.error('❌ [WebRTC] Error setting remote description:', err);
        }
      });

      socketRef.current.on('webrtc-ice-candidate', async (data: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
        console.log('🧊 [WebRTC] Received ICE candidate:', {
          from: data.fromSocketId,
          hasCandidate: !!data.candidate,
          currentState: pc.iceConnectionState,
          hasRemoteDesc: !!pc.remoteDescription
        });

        if (data.candidate) {
          if (!pc.remoteDescription) {
            console.log('⏳ [WebRTC] Buffering candidate - remote description not set');
            iceCandidatesBuffer.current.push(data.candidate);
          } else {
            try {
              await pc.addIceCandidate(data.candidate);
              console.log('✅ [WebRTC] ICE candidate added');
            } catch (err) {
              console.error('❌ [WebRTC] Error adding ICE candidate:', err);
            }
          }
        }
      });

      // Add media state listener
      socketRef.current.on('media-state-change', (data: { type: 'audio' | 'video', enabled: boolean }) => {
        console.log('🎥 [WebRTC] Remote media state changed:', data);
        setRemoteMediaState(prev => ({
          ...prev,
          [data.type === 'audio' ? 'isMuted' : 'isVideoOff']: !data.enabled
        }));
      });

    } catch (err: unknown) {
      console.error('❌ [WebRTC] Error in joinCall:', err);
      setError('Failed to join call: ' + getErrorMessage(err));
    }
  }, [trialClassId, userId, userType, initializeMedia, createPeerConnection]);

  const [remoteMediaState, setRemoteMediaState] = useState({
    isMuted: false,
    isVideoOff: false,
  });

  const toggleMute = () => {
    console.log('🔇 [WebRTC] Toggling mute:', !isMuted);
    const newMutedState = !isMuted;
    
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = !newMutedState; 
      console.log(`🎤 Audio track ${t.id} enabled:`, t.enabled);
    });
    
    setIsMuted(newMutedState);
    
    // Emit state change
    if (socketRef.current && remoteSocketIdRef.current) {
      socketRef.current.emit('media-state-change', {
        type: 'audio',
        enabled: !newMutedState,
        trialClassId,
        toSocketId: remoteSocketIdRef.current
      });
    }
  };

  const toggleVideo = () => {
    console.log('📹 [WebRTC] Toggling video:', !isVideoOff);
    const newVideoState = !isVideoOff;

    localStreamRef.current?.getVideoTracks().forEach(t => {
      t.enabled = !newVideoState;
      console.log(`📸 Video track ${t.id} enabled:`, t.enabled);
    });
    
    setIsVideoOff(newVideoState);

    // Emit state change
    if (socketRef.current && remoteSocketIdRef.current) {
      socketRef.current.emit('media-state-change', {
        type: 'video',
        enabled: !newVideoState,
        trialClassId,
        toSocketId: remoteSocketIdRef.current
      });
    }
  };

  // ... (rest of the file)

  const endCall = useCallback(() => {
    console.log('📞 [WebRTC] Ending call...');
    
    // Stop all tracks using REF
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => {
        console.log(`🛑 Stopping ${t.kind} track:`, t.id);
        t.stop();
      });
    }
    
    // Close peer connection
    if (pcRef.current) {
      console.log('🔗 Closing peer connection');
      pcRef.current.close();
      pcRef.current = null;
    }
    
    // Disconnect socket
    socketService.disconnect();
    
    // Reset state
    hasCreatedOffer.current = false;
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStream(null);
    setIsConnected(false);
    setIsSocketConnected(false); // Reset socket status
    setConnectionState('disconnected');
    setStatus('Call Ended');
    setRemoteMediaState({ isMuted: false, isVideoOff: false }); // Reset remote state
    
    console.log('✅ [WebRTC] Call ended');
  }, []);

  useEffect(() => {
    return () => {
      console.log('🧹 [WebRTC] Cleaning up...');
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    isConnected,
    isSocketConnected, 
    connectionState,
    status,
    error,
    isMuted,
    isVideoOff,
    remoteMediaState,
    joinCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}