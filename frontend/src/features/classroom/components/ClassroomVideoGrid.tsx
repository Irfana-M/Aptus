import React from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MoreHorizontal,
  ChevronDown,
  Minus,
  Users,
} from "lucide-react";
import RemoteVideoPlayer from "./RemoteVideoPlayer";
import type { RemoteMediaState } from "../../../types/video.types";

interface ClassroomVideoGridProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteStreams: Record<string, MediaStream>;
  participants: string[];
  isMuted: boolean;
  isVideoOff: boolean;
  remoteMediaStates: Record<string, RemoteMediaState>;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  onMinimize?: () => void;
  userType: "mentor" | "student";
  duration?: number;
  status?: string;
}

export const ClassroomVideoGrid: React.FC<ClassroomVideoGridProps> = ({
  localVideoRef,
  remoteStreams,
  participants,
  isMuted,
  isVideoOff,
  remoteMediaStates,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  onMinimize,
  duration = 0,
  status = "Connecting...",
}) => {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const remoteParticipants = participants;
  const remoteStreamCount = Object.keys(remoteStreams).length;
  const isOneToOne = participants.length === 2;

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner */}
      <div className="flex items-center justify-center">
        <div className="bg-[#1A1A80] text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          Aptus Live classroom
        </div>
      </div>

      {/* Video Container */}
      <div className="relative bg-[#C7E7E7] rounded-3xl overflow-hidden shadow-inner min-h-[480px] p-4 lg:p-6">
        {/* Floating Controls Overlay (Top) */}
        <div className="absolute top-4 lg:top-8 left-4 lg:left-8 z-10 flex flex-wrap items-center gap-2 lg:gap-4">
          <button className="bg-white/90 backdrop-blur px-3 lg:px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold text-gray-800 shadow-sm">
            Video call <ChevronDown size={14} />
          </button>

          <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-800">
              {formatDuration(duration)}
            </span>
          </div>

          {status && status !== "Media Connected" && (
            <div className="flex items-center gap-2 bg-amber-50/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 min-w-fit">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tighter whitespace-nowrap">
                {status}
              </span>
            </div>
          )}
        </div>

        {/* Main Video Area */}
        <div className="flex flex-col h-full pt-12 lg:pt-0">
          {isOneToOne ? (
            // 🎯 1:1 CALL (PiP Layout)
            <div className="relative flex-1 bg-black rounded-2xl overflow-hidden">
              {/* Remote video FULL SCREEN */}
              {/* Remote FULL SCREEN or Waiting */}
              {remoteStreamCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <Users size={48} className="mb-4 opacity-50" />
                  <p className="text-sm">Waiting for participant...</p>
                </div>
              ) : (
                remoteParticipants.map((sid) =>
                  remoteStreams[sid] ? (
                    <div key={sid} className="w-full h-full">
                      <RemoteVideoPlayer
                        stream={remoteStreams[sid]}
                        isMuted={remoteMediaStates[sid]?.isMuted ?? false}
                        isVideoOff={remoteMediaStates[sid]?.isVideoOff ?? false}
                        label="Participant"
                      />
                    </div>
                  ) : null,
                )
              )}

              {/* Local video PiP */}
              <div className="absolute bottom-4 right-4 w-40 h-28 bg-gray-900 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? "hidden" : ""}`}
                />
                <div className="absolute bottom-1 left-2 text-[10px] text-white bg-black/40 px-2 py-0.5 rounded">
                  You {isMuted && "🔇"}
                </div>
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <span className="text-white text-xs">Camera Off</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // 👥 GROUP CALL (Grid Layout)
            <div className="flex-1 grid gap-4 grid-cols-2 lg:grid-cols-3">
              {/* Local Video */}
              <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? "hidden" : ""}`}
                />
                <div className="absolute bottom-2 left-2 text-xs text-white bg-black/40 px-2 py-1 rounded">
                  You
                </div>
              </div>

              {/* Remote Videos */}
              {remoteParticipants.map((sid) =>
                remoteStreams[sid] ? (
                  <div key={sid} className="relative">
                    <RemoteVideoPlayer
                      key={sid}
                      stream={remoteStreams[sid]}
                      isMuted={remoteMediaStates[sid]?.isMuted ?? false}
                      isVideoOff={remoteMediaStates[sid]?.isVideoOff ?? false}
                      label="Participant"
                    />
                  </div>
                ) : null,
              )}

              {/* Waiting State */}
              {remoteStreamCount === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-20">
                  <Users size={48} className="mb-4 opacity-20" />
                  <p className="text-sm">Waiting for participants...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar Controls */}
        <div className="absolute bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 lg:gap-3">
          <button
            onClick={onToggleMute}
            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white text-gray-800 hover:bg-gray-50 shadow-md"
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={onToggleVideo}
            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOff
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white text-gray-800 hover:bg-gray-50 shadow-md"
            }`}
          >
            {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <button
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-600/30"
            onClick={onEndCall}
          >
            <PhoneOff size={18} />
          </button>
          <button
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white text-gray-800 flex items-center justify-center hover:bg-gray-50 transition-all shadow-md"
            onClick={onMinimize}
            title="Minimize"
          >
            <Minus size={18} />
          </button>
          <button className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white text-gray-800 flex items-center justify-center hover:bg-gray-50 transition-all shadow-md">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
