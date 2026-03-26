import React from "react";
import { Socket } from "socket.io-client";
import videoSocketService from "../services/videoSocketService";
import { getErrorMessage } from "../utils/errorUtils";
import type { RemoteMediaState, JoinCallProps } from "../types/video.types";
import { VideoCallContext } from "./videoCallContextStore";

// Stable ICE servers
const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [sessionType] = React.useState<"trial" | "regular" | null>(null);
  const [sessionMode] = React.useState<"one-to-one" | "group" | null>(null);
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = React.useState<Record<string, MediaStream>>({});
  const [participants, setParticipants] = React.useState<string[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);
  const [connectionState] = React.useState("disconnected");
  const [status, setStatus] = React.useState("Idle");
  const [isSocketConnected, setIsSocketConnected] = React.useState(false);
  const [isMinimized, setMinimized] = React.useState(false);

  // Refs
  const sessionIdRef = React.useRef<string | null>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const pcsRef = React.useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = React.useRef<Socket | null>(null);
  const iceBuffersRef = React.useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const politePeersRef = React.useRef<Set<string>>(new Set());
  const userIdRef = React.useRef<string | null>(null);
  const userTypeRef = React.useRef<string | null>(null);
  const hasJoinedRef = React.useRef(false);           // Controls joinCall
  const hasJoinedRoomRef = React.useRef(false);       // Controls socket join-call emission
  const processedPeersRef = React.useRef<Set<string>>(new Set());
  const makingOfferRef = React.useRef<Map<string, boolean>>(new Map());

  const [remoteMediaStates, setRemoteMediaStates] = React.useState<Record<string, RemoteMediaState>>({});

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
    const stream = (canvas as any).captureStream(30);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      stream.getTracks()[0]?.addEventListener("ended", () => clearInterval(interval));
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    } catch (e) {
      console.warn("🔇 Could not create fallback audio:", e);
    }
    return stream;
  }, []);

  const initializeMedia = React.useCallback(async () => {
    setStatus("Requesting Media Permissions...");
    if (!navigator.mediaDevices?.getUserMedia) return createFakeStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log(`[MEDIA] Local stream acquired. Tracks: ${stream.getTracks().length}`);
      return stream;
    } catch (e) {
      console.warn("Media error, using fake stream", e);
      return createFakeStream();
    }
  }, [createFakeStream]);

  const createPeerConnection = React.useCallback((targetSocketId: string) => {
    if (pcsRef.current.has(targetSocketId)) {
      console.warn(`⚠️ [WebRTC] PeerConnection already exists for ${targetSocketId}.`);
      return pcsRef.current.get(targetSocketId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcsRef.current.set(targetSocketId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) =>
        pc.addTrack(track, localStreamRef.current!)
      );
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", {
          toSocketId: targetSocketId,
          candidate: event.candidate,
          sessionId: sessionIdRef.current,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStreams((prev) => ({ ...prev, [targetSocketId]: stream }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[PC:${targetSocketId}] Connection: ${pc.connectionState} | Signaling: ${pc.signalingState}`);
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        setStatus("Connected");
      }
    };

    return pc;
  }, []);

  // Socket listeners effect
  React.useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isSocketConnected) return;

    console.log("🔗 [Socket] Registering synchronized listeners...");

    socket.on("join-error", (err: { error: string }) => {
      console.error("[SOCKET] join-error:", err);
      if (err?.error) {
        setError(err.error);
        setStatus("Join Failed: " + err.error);
      }
    });

    const handleUserJoined = async ({ socketId }: { socketId: string }) => {
      if (socketId === socket.id) return;
      if (processedPeersRef.current.has(socketId)) {
        console.log(`[USER-JOINED] Already processed ${socketId} — skipping`);
        return;
      }

      processedPeersRef.current.add(socketId);
      setParticipants((prev) => (prev.includes(socketId) ? prev : [...prev, socketId]));

      const pc = createPeerConnection(socketId);
      if (!pc) return;

      const willCreateOffer = (socket.id ?? "zzzz") < socketId;

      if (willCreateOffer) {
        if (pc.signalingState !== "stable") {
          console.log(`[OFFER] Skipping — state is ${pc.signalingState}`);
          return;
        }
        if (makingOfferRef.current.get(socketId)) return;

        makingOfferRef.current.set(socketId, true);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", {
            toSocketId: socketId,
            offer: pc.localDescription,
            sessionId: sessionIdRef.current,
          });
        } catch (err) {
          console.error("Offer creation failed:", err);
        } finally {
          makingOfferRef.current.delete(socketId);
        }
      } else {
        politePeersRef.current.add(socketId);
      }
    };

    const handleOffer = async ({ fromSocketId, offer }: { fromSocketId: string; offer: RTCSessionDescriptionInit }) => {
      let pc = pcsRef.current.get(fromSocketId);
      if (!pc) pc = createPeerConnection(fromSocketId);
      if (!pc) return;

      const isPolite = politePeersRef.current.has(fromSocketId);
      if (pc.signalingState !== "stable") {
        if (isPolite) {
          await pc.setLocalDescription({ type: "rollback" }).catch(() => {});
        } else {
          return;
        }
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        politePeersRef.current.add(fromSocketId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          toSocketId: fromSocketId,
          answer: pc.localDescription,
          sessionId: sessionIdRef.current,
        });

        const buffer = iceBuffersRef.current.get(fromSocketId) || [];
        for (const c of buffer) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        iceBuffersRef.current.delete(fromSocketId);
      } catch (err) {
        console.error("[OFFER] Error:", err);
      }
    };

    const handleAnswer = async ({ fromSocketId, answer }: { fromSocketId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = pcsRef.current.get(fromSocketId);
      if (!pc) return;

      console.log(`[ANSWER] from ${fromSocketId} | state: ${pc.signalingState}`);

      if (pc.signalingState !== "have-local-offer") {
        console.warn(`[ANSWER] Ignored — wrong state: ${pc.signalingState}`);
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        const buffer = iceBuffersRef.current.get(fromSocketId) || [];
        for (const c of buffer) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        iceBuffersRef.current.delete(fromSocketId);
      } catch (err) {
        console.error("[ANSWER] Error:", err);
      }
    };

    const handleIceCandidate = async ({ fromSocketId, candidate }: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
      const pc = pcsRef.current.get(fromSocketId);
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      } else {
        const buf = iceBuffersRef.current.get(fromSocketId) || [];
        buf.push(candidate);
        iceBuffersRef.current.set(fromSocketId, buf);
      }
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      const pc = pcsRef.current.get(socketId);
      if (pc) pc.close();
      pcsRef.current.delete(socketId);

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
      processedPeersRef.current.delete(socketId);
    };

    const handleMediaChange = (data: any) => {
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

    const handleJoinSuccess = ({ existingParticipants = [] }: { existingParticipants: string[] }) => {
      console.log(`[JOIN-SUCCESS] ${existingParticipants.length} existing peers`);
      existingParticipants.forEach((pid) => {
        if (pid !== socket?.id && !processedPeersRef.current.has(pid)) {
          handleUserJoined({ socketId: pid });
        }
      });
    };

    // Register all listeners
    socket.on("join-success", handleJoinSuccess);
    socket.on("user-joined", handleUserJoined);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("user-left", handleUserLeft);
    socket.on("media-state-change", handleMediaChange);

    // Emit join-call only once
    if (!hasJoinedRoomRef.current && sessionIdRef.current && userIdRef.current) {
      console.log("[SOCKET] Emitting join-call signal (once)");
      socket.emit("join-call", {
        sessionId: sessionIdRef.current,
        userId: userIdRef.current,
        userType: userTypeRef.current,
      });
      hasJoinedRoomRef.current = true;
    }

    return () => {
      console.log("🧹 Cleaning up listeners...");
      socket.off("join-success", handleJoinSuccess);
      socket.off("user-joined", handleUserJoined);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);
      socket.off("media-state-change", handleMediaChange);
    };
  }, [isSocketConnected, createPeerConnection]);

  const joinCall = React.useCallback(async (props: JoinCallProps) => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    try {
      setSessionId(props.sessionId);
      sessionIdRef.current = props.sessionId;
      userIdRef.current = props.userId;
      userTypeRef.current = props.userType;

      const stream = await initializeMedia();
      setLocalStream(stream);
      localStreamRef.current = stream;

      const socket = videoSocketService.connect();
      socketRef.current = socket;

      if (socket.connected) {
        setIsSocketConnected(true);
      } else {
        socket.once("connect", () => setIsSocketConnected(true));
      }
    } catch (err: any) {
      hasJoinedRef.current = false;
      setError("Failed to join call: " + getErrorMessage(err));
    }
  }, [initializeMedia]);

  const toggleMute = React.useCallback(() => {
    const newMutedState = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !newMutedState));
    setIsMuted(newMutedState);

    if (socketRef.current && sessionIdRef.current) {
      pcsRef.current.forEach((_, targetSocketId) => {
        socketRef.current?.emit("media-state-change", {
          type: "audio",
          enabled: !newMutedState,
          sessionId: sessionIdRef.current,
          toSocketId: targetSocketId,
        });
      });
    }
  }, [isMuted]);

  const toggleVideo = React.useCallback(() => {
    const newVideoState = !isVideoOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !newVideoState));
    setIsVideoOff(newVideoState);

    if (socketRef.current && sessionIdRef.current) {
      pcsRef.current.forEach((_, targetSocketId) => {
        socketRef.current?.emit("media-state-change", {
          type: "video",
          enabled: !newVideoState,
          sessionId: sessionIdRef.current,
          toSocketId: targetSocketId,
        });
      });
    }
  }, [isVideoOff]);

  const endCall = React.useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();

    socketRef.current?.emit("leave-room", { sessionId: sessionIdRef.current });
    socketRef.current?.disconnect();
    socketRef.current = null;

    setLocalStream(null);
    setRemoteStreams({});
    setRemoteMediaStates({});
    setParticipants([]);
    setIsConnected(false);
    setIsSocketConnected(false);
    setStatus("Idle");
    setError(null);

    sessionIdRef.current = null;
    userIdRef.current = null;
    userTypeRef.current = null;
    hasJoinedRef.current = false;
    hasJoinedRoomRef.current = false;

    iceBuffersRef.current.clear();
    politePeersRef.current.clear();
    processedPeersRef.current.clear();
    makingOfferRef.current.clear();
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