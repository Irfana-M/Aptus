import React from "react";
import * as Sentry from "@sentry/react";
import { Socket } from "socket.io-client";
import videoSocketService from "../services/videoSocketService";
import { getErrorMessage } from "../utils/errorUtils";
import type { RemoteMediaState, JoinCallProps } from "../types/video.types";
import { VideoCallContext } from "./videoCallContextStore";

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [sessionType, setSessionType] = React.useState<
    "trial" | "regular" | null
  >(null);
  const [sessionMode, setSessionMode] = React.useState<
    "one-to-one" | "group" | null
  >(null);

  const [localStream, setLocalStream] = React.useState<MediaStream | null>(
    null,
  );
  const [remoteStreams, setRemoteStreams] = React.useState<
    Record<string, MediaStream>
  >({});
  const [participants, setParticipants] = React.useState<string[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState("disconnected");
  const [status, setStatus] = React.useState("Idle");
  const [isSocketConnected, setIsSocketConnected] = React.useState(false);
  const [isMinimized, setMinimized] = React.useState(false);

  const sessionIdRef = React.useRef<string | null>(null);
  const sessionTypeRef = React.useRef<"trial" | "regular" | null>(null);
  const sessionModeRef = React.useRef<"one-to-one" | "group" | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const pcsRef = React.useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = React.useRef<Socket | null>(null);
  const iceBuffersRef = React.useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const politePeersRef = React.useRef<Set<string>>(new Set());
  const userIdRef = React.useRef<string | null>(null);
  const userTypeRef = React.useRef<string | null>(null);
  const hasJoinedRoomRef = React.useRef(false);
 const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ],
};

  const [remoteMediaStates, setRemoteMediaStates] = React.useState<
    Record<string, RemoteMediaState>
  >({});

  const createFakeStream = React.useCallback((): MediaStream => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    let x = 0;
    const draw = () => {
      if (!ctx) return;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = "#3CB4B4";
      ctx.font = "bold 30px Inter, Arial";
      ctx.fillText("Aptus Virtual Camera", 180, 220);
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px Arial";
      ctx.fillText("Hardware camera busy or unavailable", 185, 260);
      ctx.fillStyle = "#3CB4B4";
      ctx.beginPath();
      ctx.arc((x % 400) + 120, 320, 10, 0, Math.PI * 2);
      ctx.fill();
      x += 3;
      if (pcsRef.current.size > 0) requestAnimationFrame(draw);
    };
    draw();
    const stream = (
      canvas as unknown as { captureStream: (fps: number) => MediaStream }
    ).captureStream(30);
    try {
      const audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const dest = audioCtx.createMediaStreamDestination();
      oscillator.connect(gainNode);
      gainNode.connect(dest);
      oscillator.type = "sine";
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.01;
      oscillator.start();
      const interval = setInterval(() => {
        if (audioCtx.state === "running") {
          gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
        }
      }, 2000);
      stream.getTracks()[0].addEventListener("ended", () => {
        clearInterval(interval);
      });
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    } catch (e) {
      console.warn("🔇 Could not create fallback audio:", e);
    }
    return stream;
  }, []);

  const initializeMedia = React.useCallback(async () => {
    setStatus("Requesting Media Permissions...");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("WebRTC Not Supported");
      return createFakeStream();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log(`[CLIENT] [MEDIA] Local stream acquired. Tracks: ${stream.getTracks().length}`);
      Sentry.addBreadcrumb({
        category: "media",
        message: "Local stream acquired",
        data: { trackCount: stream.getTracks().length },
      });
      return stream;
    } catch (e) {
      console.warn("⚠️ [Media] Error getting real media, using fallback:", e);
      return createFakeStream();
    }
  }, [createFakeStream]);

  const hasJoinedRef = React.useRef(false);

  const createPeerConnection = React.useCallback(
    (targetSocketId: string) => {
      if (pcsRef.current.has(targetSocketId)) {
        console.warn(
          `⚠️ [WebRTC] PeerConnection already exists for ${targetSocketId}.`,
        );
        return pcsRef.current.get(targetSocketId);
      }

      const pc = new RTCPeerConnection(iceServers);
      pcsRef.current.set(targetSocketId, pc);

      console.log(`[CLIENT] [WEBRTC] Creating new PC for: ${targetSocketId} Socket: ${socketRef.current?.id} Session: ${sessionIdRef.current}`);
      Sentry.addBreadcrumb({
        category: "webrtc",
        message: "Peer connection created",
        level: "info",
        data: { targetSocketId, socketId: socketRef.current?.id, sessionId: sessionIdRef.current },
      });

      if (localStreamRef.current) {
        console.log(`[CLIENT] [MEDIA] Adding ${localStreamRef.current.getTracks().length} tracks to PC for ${targetSocketId}`);
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          console.log(`[CLIENT] [ICE] Generated candidate for ${targetSocketId} Socket: ${socketRef.current.id}`);
          socketRef.current.emit("webrtc-ice-candidate", {
            toSocketId: targetSocketId,
            candidate: event.candidate,
            sessionId: sessionIdRef.current,
            sessionType: sessionTypeRef.current,
            sessionMode: sessionModeRef.current,
          });
          console.log(`[CLIENT] [ICE] Sent candidate to ${targetSocketId}`);
          Sentry.addBreadcrumb({
            category: "webrtc",
            message: "ICE candidate sent",
            data: { toSocketId: targetSocketId },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(`[CLIENT] [TRACK] ontrack fires from ${targetSocketId}: Kind: ${event.track.kind} StreamID: ${event.streams[0]?.id}`);
        Sentry.addBreadcrumb({
          category: "webrtc",
          message: "Remote track received",
          data: { fromSocketId: targetSocketId, kind: event.track.kind },
        });

        const [stream] = event.streams;

        if (!stream) return;

   setRemoteStreams((prev) => ({
  ...prev,
  [targetSocketId]: stream,
}));
      };

      pc.onconnectionstatechange = () => {
        console.log(`[CLIENT] [STATE] [PC:${targetSocketId}] Connection state changed: ${pc.connectionState} Signaling state: ${pc.signalingState} Socket: ${socketRef.current?.id}`);
        Sentry.addBreadcrumb({
          category: "webrtc",
          message: "Peer connection state change",
          level: "info",
          data: { targetSocketId, connectionState: pc.connectionState, signalingState: pc.signalingState },
        });
        setConnectionState(pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsConnected(true);
          setStatus("Connected");
        }
      };

      return pc;
    },
    [iceServers],
  );

  React.useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isSocketConnected) return;

    console.log("🔗 [Socket] Registering synchronized listeners...");

    const handleUserJoined = async ({ socketId }: { socketId: string }) => {
      console.log(`[CLIENT] [SOCKET] user-joined: ${socketId} MySocket: ${socket.id} Session: ${sessionIdRef.current}`);
      Sentry.addBreadcrumb({
        category: "webrtc",
        message: "User joined call",
        level: "info",
        data: { remoteSocketId: socketId, mySocketId: socket.id, sessionId: sessionIdRef.current },
      });
      setParticipants((prev) =>
        !prev.includes(socketId) ? [...prev, socketId] : prev,
      );

      if (!socket.id) {
        console.warn("[CLIENT] [SOCKET] No socket.id available in handleUserJoined");
        return;
      }

      // polite peer rule
      const willCreateOffer = socket.id < socketId;
      console.log(`[CLIENT] [NEGOTIATION] myId: ${socket.id} remoteId: ${socketId} willCreateOffer: ${willCreateOffer}`);

      if (socket.id > socketId) {
        politePeersRef.current.add(socketId);
      }

      const pc = createPeerConnection(socketId);
      if (!pc) return;

      // Only ONE side creates offer
      if (willCreateOffer) {
        console.log(`[CLIENT] [WEBRTC] Before createOffer() for ${socketId}. SignalingState: ${pc.signalingState}. Tracks: ${pc.getSenders().length}`);
        Sentry.addBreadcrumb({
          category: "webrtc",
          message: "Creating WebRTC offer",
          data: { toSocketId: socketId, trackCount: pc.getSenders().length },
        });
        
        const offer = await pc.createOffer();
        console.log(`[CLIENT] [WEBRTC] After createOffer() for ${socketId}`);
        
        await pc.setLocalDescription(offer);
        console.log(`[CLIENT] [WEBRTC] After setLocalDescription(offer) for ${socketId} SignalingState: ${pc.signalingState}`);

        socket.emit("webrtc-offer", {
          toSocketId: socketId,
          offer: pc.localDescription,
          sessionId: sessionIdRef.current,
          sessionType: sessionTypeRef.current,
          sessionMode: sessionModeRef.current,
        });
        console.log(`[CLIENT] [WEBRTC] Sending webrtc-offer to ${socketId}`);
      } else {
        console.log(`[CLIENT] [NEGOTIATION] Skipping offer creation for ${socketId} (I am the responder)`);
      }
    };

    const handleOffer = async ({
      fromSocketId,
      offer,
    }: {
      fromSocketId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      console.log(`[CLIENT] [WEBRTC] Receiving webrtc-offer from ${fromSocketId} Socket: ${socket.id} Session: ${sessionIdRef.current}`);
      Sentry.addBreadcrumb({
        category: "webrtc",
        message: "WebRTC offer received",
        data: { fromSocketId, sessionId: sessionIdRef.current },
      });
      
      setParticipants((prev) =>
        !prev.includes(fromSocketId) ? [...prev, fromSocketId] : prev,
      );

      const pc = createPeerConnection(fromSocketId);
      if (!pc) return;

      const offerCollision =
        offer.type === "offer" && pc.signalingState !== "stable";

      if (offerCollision) {
        console.log(`[CLIENT] [NEGOTIATION] Offer collision detected with ${fromSocketId}. signalingState: ${pc.signalingState}`);
        if (!politePeersRef.current.has(fromSocketId)) {
          console.warn(`[CLIENT] [NEGOTIATION] Ignoring offer collision (impolite) from ${fromSocketId}`);
          return;
        }
        console.log(`[CLIENT] [NEGOTIATION] Rolling back local offer for ${fromSocketId} (polite)`);
        await pc.setLocalDescription({ type: "rollback" });
      }

      console.log(`[CLIENT] [WEBRTC] Before setRemoteDescription(offer) from ${fromSocketId}`);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log(`[CLIENT] [WEBRTC] Before createAnswer() for ${fromSocketId}. SignalingState: ${pc.signalingState}`);
      const answer = await pc.createAnswer();
      console.log(`[CLIENT] [WEBRTC] After createAnswer() for ${fromSocketId}`);
      
      await pc.setLocalDescription(answer);
      console.log(`[CLIENT] [WEBRTC] After setLocalDescription(answer) for ${fromSocketId}. SignalingState: ${pc.signalingState}`);

      socket.emit("webrtc-answer", {
        toSocketId: fromSocketId,
        answer: pc.localDescription,
        sessionId: sessionIdRef.current,
        sessionType: sessionTypeRef.current,
        sessionMode: sessionModeRef.current,
      });
      console.log(`[CLIENT] [WEBRTC] Sending webrtc-answer to ${fromSocketId}`);
      Sentry.addBreadcrumb({
        category: "webrtc",
        message: "WebRTC answer sent",
        data: { toSocketId: fromSocketId },
      });

      const buffer = iceBuffersRef.current.get(fromSocketId) || [];
      buffer.forEach(async (candidate) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          Sentry.addBreadcrumb({
            category: "webrtc",
            message: "ICE candidate added (buffered)",
            data: { fromSocketId },
          });
        } catch (err) {
          console.warn(`ICE buffered error for ${fromSocketId}`, err);
          Sentry.captureException(err, {
            extra: { fromSocketId, context: "addIceCandidate_buffered" },
          });
        }
      });
      iceBuffersRef.current.delete(fromSocketId);
    };

    const handleAnswer = async ({
      fromSocketId,
      answer,
    }: {
      fromSocketId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log(`[CLIENT] [WEBRTC] Receiving webrtc-answer from ${fromSocketId} Socket: ${socket.id} Session: ${sessionIdRef.current}`);
      Sentry.addBreadcrumb({
        category: "webrtc",
        message: "WebRTC answer received",
        data: { fromSocketId, sessionId: sessionIdRef.current },
      });

      setParticipants((prev) =>
        !prev.includes(fromSocketId) ? [...prev, fromSocketId] : prev,
      );

      const pc = pcsRef.current.get(fromSocketId);
      if (!pc) {
        console.warn(`[CLIENT] [WEBRTC] No PC found for answer from ${fromSocketId}`);
        return;
      }

      console.log(`[CLIENT] [WEBRTC] Before setRemoteDescription(answer) for ${fromSocketId}. SignalingState: ${pc.signalingState}`);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`[CLIENT] [WEBRTC] After setRemoteDescription(answer) for ${fromSocketId}. SignalingState: ${pc.signalingState}`);

      const buffer = iceBuffersRef.current.get(fromSocketId) || [];
      buffer.forEach(async (candidate) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          Sentry.addBreadcrumb({
            category: "webrtc",
            message: "ICE candidate added (buffered_answer)",
            data: { fromSocketId },
          });
        } catch (e) {
          console.warn(`Error adding buffered ICE for ${fromSocketId}`, e);
          Sentry.captureException(e, {
            extra: { fromSocketId, context: "addIceCandidate_answer" },
          });
        }
      });
      iceBuffersRef.current.delete(fromSocketId);
    };

    const handleIceCandidate = async ({
      fromSocketId,
      candidate,
    }: {
      fromSocketId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      console.log(`[CLIENT] [ICE] candidate received from ${fromSocketId} Socket: ${socket.id} Session: ${sessionIdRef.current}`);
      Sentry.addBreadcrumb({
        category: "webrtc",
        message: "ICE candidate received",
        data: { fromSocketId, sessionId: sessionIdRef.current },
      });
      const pc = pcsRef.current.get(fromSocketId);

      if (pc && pc.remoteDescription) {
        try {
          console.log(`[CLIENT] [ICE] Adding candidate directly for ${fromSocketId}`);
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          Sentry.addBreadcrumb({
            category: "webrtc",
            message: "ICE candidate added",
            data: { fromSocketId },
          });
        } catch (e) {
          console.warn(`[CLIENT] [ICE] Error adding candidate for ${fromSocketId}`, e);
          Sentry.captureException(e, {
            extra: { fromSocketId, context: "addIceCandidate_direct" },
          });
        }
      } else {
        console.log(`[CLIENT] [ICE] Buffering candidate for ${fromSocketId} (Reason: no remoteDescription)`);
        const buffer = iceBuffersRef.current.get(fromSocketId) || [];
        buffer.push(candidate);
        iceBuffersRef.current.set(fromSocketId, buffer);
      }
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      console.log(`👋 [Socket] user-left: ${socketId}`);
      Sentry.addBreadcrumb({
        category: "webrtc",
        message: "User left call",
        level: "info",
        data: { socketId, sessionId: sessionIdRef.current },
      });

      const pc = pcsRef.current.get(socketId);
      if (pc) {
        pc.close();
        pcsRef.current.delete(socketId);
      }

      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });

      setRemoteMediaStates((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });

      setParticipants((prev) => prev.filter((id) => id !== socketId));
      iceBuffersRef.current.delete(socketId);
      politePeersRef.current.delete(socketId);

      if (pcsRef.current.size === 0) {
        setIsConnected(false);
        setStatus("Waiting for participants...");
      }
    };

    const handleMediaChange = (data: {
      fromSocketId?: string;
      toSocketId?: string;
      type: string;
      enabled: boolean;
    }) => {
      const socketId = data.fromSocketId;
      if (!socketId) return;

      setRemoteMediaStates((prev) => ({
        ...prev,
        [socketId]: {
          ...prev[socketId],
          [data.type === "audio" ? "isMuted" : "isVideoOff"]: !data.enabled,
        },
      }));
    };

    const handleJoinSuccess = ({
      existingParticipants,
    }: {
      room: string;
      socketId: string;
      existingParticipants: string[];
    }) => {
      console.log(`[CLIENT] [SOCKET] join-success received. MySocket: ${socket.id} Session: ${sessionIdRef.current} Existing: ${existingParticipants.length}`);
      Sentry.addBreadcrumb({
        category: "socket",
        message: "Join success received",
        data: { socketId: socket.id, sessionId: sessionIdRef.current, existingCount: existingParticipants.length },
      });
      if (existingParticipants && existingParticipants.length > 0) {
        existingParticipants.forEach((pid) => {
          handleUserJoined({ socketId: pid });
        });
      }
    };

    socket.on("join-success", handleJoinSuccess);
    socket.on("user-joined", handleUserJoined);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("user-left", handleUserLeft);
    socket.on("media-state-change", handleMediaChange);

    // After all listeners are registered, emit join-call if we haven't yet
    if (!hasJoinedRoomRef.current && sessionIdRef.current && userIdRef.current) {
      console.log(`[CLIENT] [SOCKET] All listeners ready. Emitting join-call signal. Session: ${sessionIdRef.current} MyId: ${userIdRef.current}`);
      hasJoinedRoomRef.current = true;
      socket.emit("join-call", {
        sessionId: sessionIdRef.current,
        sessionType: sessionTypeRef.current,
        sessionMode: sessionModeRef.current,
        userId: userIdRef.current,
        userType: userTypeRef.current,
      });
      Sentry.addBreadcrumb({
        category: "socket",
        message: "Emit join-call",
        data: { sessionId: sessionIdRef.current, userId: userIdRef.current },
      });
    }

    return () => {
      console.log("🧹 [Socket] Cleaning up listeners...");
      socket.off("join-success", handleJoinSuccess);
      socket.off("user-joined", handleUserJoined);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);
      socket.off("media-state-change", handleMediaChange);
    };
  }, [isSocketConnected, createPeerConnection]);

  const joinCall = React.useCallback(
    async (props: JoinCallProps) => {
      if (hasJoinedRef.current) {
        console.warn(
          "⚠️ [VideoCall] joinCall already in progress or completed.",
        );
        return;
      }
      hasJoinedRef.current = true;

      try {
        console.log("🚀 [VideoCall] Initializing signaling and media...");
        setSessionId(props.sessionId);
        setSessionType(props.sessionType);
        setSessionMode(props.sessionMode);
        sessionIdRef.current = props.sessionId;
        sessionTypeRef.current = props.sessionType;
        sessionModeRef.current = props.sessionMode;
        userIdRef.current = props.userId;
        userTypeRef.current = props.userType;

        const stream = await initializeMedia();
        console.log("✅ Media fully ready BEFORE socket connect");
        setLocalStream(stream);
        localStreamRef.current = stream;

        const socket = videoSocketService.connect();
        socketRef.current = socket;

        const setSocketReady = () => {
          console.log("✅ [Socket] Connected. Triggering listener registration...");
          setIsSocketConnected(true);
        };

        if (socket.connected) {
          setSocketReady();
        } else {
          socket.once("connect", setSocketReady);
        }

        socket.on("disconnect", () => {
          console.log("❌ [Socket] Disconnected");
          setIsSocketConnected(false);
        });
      } catch (err: unknown) {
        hasJoinedRef.current = false; // Allow retry on fatal error
        setError("Failed to join call: " + getErrorMessage(err));
      }
    },
    [initializeMedia],
  );

  const toggleMute = React.useCallback(() => {
    const newMutedState = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !newMutedState;
    });
    setIsMuted(newMutedState);
    const currentSid = sessionIdRef.current;
    if (socketRef.current && currentSid) {
      // Broadcast to all active peers
      pcsRef.current.forEach((_, targetSocketId) => {
        socketRef.current?.emit("media-state-change", {
          type: "audio",
          enabled: !newMutedState,
          sessionId: currentSid,
          sessionType: sessionTypeRef.current,
          sessionMode: sessionModeRef.current,
          toSocketId: targetSocketId,
        });
      });
    }
  }, [isMuted]);

  const toggleVideo = React.useCallback(() => {
    const newVideoState = !isVideoOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !newVideoState;
    });
    setIsVideoOff(newVideoState);
    const currentSid = sessionIdRef.current;
    if (socketRef.current && currentSid) {
      // Broadcast to all active peers
      pcsRef.current.forEach((_, targetSocketId) => {
        socketRef.current?.emit("media-state-change", {
          type: "video",
          enabled: !newVideoState,
          sessionId: currentSid,
          sessionType: sessionTypeRef.current,
          sessionMode: sessionModeRef.current,
          toSocketId: targetSocketId,
        });
      });
    }
  }, [isVideoOff]);

  const endCall = React.useCallback(() => {
    console.log("🛑 Ending call and cleaning up resources...");

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      localStreamRef.current = null;
    }

    pcsRef.current.forEach((pc, id) => {
      console.log(`Closing PC for: ${id}`);
      pc.close();
    });
    pcsRef.current.clear();

    if (socketRef.current) {
      socketRef.current.emit("leave-room", {
        sessionId: sessionIdRef.current,
        sessionType: sessionTypeRef.current,
        sessionMode: sessionModeRef.current,
      });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setLocalStream(null);
    setRemoteStreams({});
    setRemoteMediaStates({});
    setParticipants([]);
    setIsConnected(false);
    setIsSocketConnected(false);
    setSessionId(null);
    setSessionType(null);
    setSessionMode(null);
    sessionIdRef.current = null;
    sessionTypeRef.current = null;
    sessionModeRef.current = null;
    userIdRef.current = null;
    userTypeRef.current = null;
    hasJoinedRef.current = false; // Reset for next session
    hasJoinedRoomRef.current = false;
    setStatus("Idle");
    setError(null);
    iceBuffersRef.current.clear();
    politePeersRef.current.clear();
  }, []);

  return (
    <VideoCallContext.Provider
      value={{
        sessionId,
        sessionType,
        sessionMode,
        localStream,
        remoteStreams,
        participants,
        isConnected,
        isSocketConnected,
        connectionState,
        status,
        error,
        isMuted,
        isVideoOff,
        remoteMediaStates,
        socket: socketRef.current,
        joinCall,
        endCall,
        toggleMute,
        toggleVideo,
        isMinimized,
        setMinimized,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};
