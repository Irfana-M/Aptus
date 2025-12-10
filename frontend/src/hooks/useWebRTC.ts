import { useEffect, useRef, useState, useCallback } from 'react';
import socketService from '../services/socketService';
import { getErrorMessage } from '../utils/errorUtils';

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
  const socketRef = useRef<any>(null);
  const remoteSocketIdRef = useRef<string | null>(null);
  const hasCreatedOffer = useRef(false);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Helper to create a fake video stream (canvas) for testing
  const createFakeStream = (): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Draw a moving animation
    let x = 0;
    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(0, 0, 640, 480);
      
      ctx.fillStyle = '#48bb78';
      ctx.font = '40px Arial';
      ctx.fillText('Testing Mode', 200, 240);
      
      ctx.fillStyle = '#ed8936';
      ctx.beginPath();
      ctx.arc(x % 640, 300, 50, 0, Math.PI * 2);
      ctx.fill();
      x += 5;
      requestAnimationFrame(draw);
    };
    draw();
    
    // Get video track from canvas
    const stream = canvas.captureStream(30);
    
    // Add a fake audio track
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const dest = audioCtx.createMediaStreamDestination();
    
    oscillator.connect(gainNode);
    gainNode.connect(dest);
    
    // Configure beep sound (Low volume)
    oscillator.type = 'sine';
    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.1; // 10% volume
    oscillator.start();
    
    // Make it beep every second
    setInterval(() => {
        if (audioCtx.state === 'running') {
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.1); // Beep for 100ms
        }
    }, 1000);
    
    const audioTrack = dest.stream.getAudioTracks()[0];
    stream.addTrack(audioTrack);
    
    return stream;
  };

  const initializeMedia = async () => {
    setStatus('Requesting Media Permissions...');
    console.log('🎥 [WebRTC] Requesting media permissions...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log('✅ [WebRTC] Media stream obtained');
      return stream;
    } catch (err: unknown) {
      console.warn('❌ [WebRTC] Camera failed (Device in use?), falling back to FAKE STREAM');
      setStatus('Using Virtual Camera (Testing Mode)');
      return createFakeStream();
    }
  };

  const createPeerConnection = (stream: MediaStream | null) => {
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
      
      if (event.streams && event.streams[0]) {
        console.log('✅ [WebRTC] Setting remote stream:', event.streams[0].id);
        const stream = event.streams[0];
        
        // Force update logic:
        // We create a new MediaStream to force React to update, 
        // BUT we ensure we include all tracks currently on the incoming stream.
        setRemoteStream(new MediaStream(stream.getTracks()));
      } else if (event.track) {
        console.warn('⚠️ [WebRTC] No stream in ontrack, using track fallback');
        setRemoteStream(prev => {
           const newStream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
           newStream.addTrack(event.track);
           return newStream;
        });
      }
    };
    
    // ... (keep existing handlers)
    pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && remoteSocketIdRef.current) {
             socketRef.current.emit('webrtc-ice-candidate', {
                candidate: event.candidate,
                trialClassId,
                toSocketId: remoteSocketIdRef.current,
            });
        }
    };

    pc.oniceconnectionstatechange = () => console.log('🧊 [WebRTC] ICE connection state:', pc.iceConnectionState);
    pc.onsignalingstatechange = () => console.log('📡 [WebRTC] Signaling state:', pc.signalingState);
    pc.onconnectionstatechange = () => {
       console.log('🔗 [WebRTC] Connection state:', pc.connectionState);
       setIsConnected(pc.connectionState === 'connected');
       setConnectionState(pc.connectionState);
    };

    return pc;
  };

  const joinCall = useCallback(async () => {
    try {
        // ... (socket connection logic remains same)
      setStatus('Starting Join Process...');
      console.log('🚀 [WebRTC] STARTING JOIN CALL PROCESS');
      // ...
      
      // Step 1: Connect socket
      setStatus('Connecting Socket...');
      socketRef.current = socketService.connect();
      
      if (socketRef.current.connected) setIsSocketConnected(true);
      socketRef.current.on('connect', () => setIsSocketConnected(true));
      socketRef.current.on('disconnect', () => setIsSocketConnected(false));


      // Step 2: Get media stream (Handle NULL)
      console.log('🎥 [WebRTC] Getting media stream...');
      const stream = await initializeMedia();
      setLocalStream(stream); // Can be null
      localStreamRef.current = stream;
      
      if (stream) {
        console.log('✅ [WebRTC] Media stream set to state');
      } else {
        console.log('⚠️ [WebRTC] Media stream is NULL (Spectator)');
      }

      // Step 3: Create peer connection
      console.log('🔗 [WebRTC] Creating peer connection...');
      const pc = createPeerConnection(stream); // Passes null safely

      // Step 4: Join the room
      // ...

      // Step 4: Join the room
      setStatus('Emitting Join Call Event...');
      console.log('📤 [WebRTC] Emitting join-call...');
      socketRef.current.emit('join-call', { trialClassId, userId, userType });

      // ========== SOCKET EVENT HANDLERS ==========
      
      socketRef.current.on('join-success', (data: any) => {
        console.log('✅ [WebRTC] JOIN-SUCCESS from server:', data);
      });

      socketRef.current.on('join-error', (data: any) => {
        console.error('❌ [WebRTC] JOIN-ERROR from server:', data);
        setError('Failed to join call: ' + (data.error || 'Unknown error'));
      });

      socketRef.current.on('user-joined', (data: any) => {
        console.log('👤 [WebRTC] USER-JOINED event:', {
          remoteSocketId: data.socketId,
          mySocketId: socketRef.current?.id,
          userId: data.userId,
          userType: data.userType
        });

        if (data.socketId === socketRef.current.id) {
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
              
              socketRef.current.emit('webrtc-offer', {
                trialClassId,
                toSocketId: remoteSocketIdRef.current,
                offer: pc.localDescription,
              });
            })
            .catch(err => {
              console.error('❌ [WebRTC] Error creating/sending offer:', err);
            });
        }
      });

      socketRef.current.on('webrtc-offer', async (data: any) => {
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

          console.log('🔧 [WebRTC] Creating answer...');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('✅ [WebRTC] Answer created and local description set');

          console.log('📤 [WebRTC] Sending answer to:', remoteSocketIdRef.current);
          socketRef.current.emit('webrtc-answer', {
            trialClassId,
            toSocketId: remoteSocketIdRef.current,
            answer: pc.localDescription,
          });
        } catch (err) {
          console.error('❌ [WebRTC] Error handling offer:', err);
        }
      });

      socketRef.current.on('webrtc-answer', async (data: any) => {
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
        } catch (err) {
          console.error('❌ [WebRTC] Error setting remote description:', err);
        }
      });

      socketRef.current.on('webrtc-ice-candidate', async (data: any) => {
        console.log('🧊 [WebRTC] Received ICE candidate:', {
          from: data.fromSocketId,
          hasCandidate: !!data.candidate,
          currentState: pc.iceConnectionState
        });

        if (data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
            console.log('✅ [WebRTC] ICE candidate added');
          } catch (err) {
            console.error('❌ [WebRTC] Error adding ICE candidate:', err);
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
  }, [trialClassId, userId, userType]);

  const [remoteMediaState, setRemoteMediaState] = useState({
    isMuted: false,
    isVideoOff: false,
  });

  const toggleMute = () => {
    console.log('🔇 [WebRTC] Toggling mute:', !isMuted);
    let newMutedState = !isMuted;
    
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
    let newVideoState = !isVideoOff;

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