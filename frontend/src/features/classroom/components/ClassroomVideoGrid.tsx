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

interface ParticipantInfo {
  id: string;
  name: string;
  role: string;
}

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
  participantDetails?: ParticipantInfo[];
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
  participantDetails = [],
}) => {
  // Name helpers: index 0 = local user, index 1+ = remote participants
  const localName = participantDetails[0]?.name || "You";
  const getRemoteName = (remoteIndex: number) =>
    participantDetails[remoteIndex + 1]?.name || "Participant";
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const remoteParticipants = participants;
  const remoteStreamCount = Object.keys(remoteStreams).length;

  // Google Meet-style: compute equal columns based on total visible tiles
  // 1 tile → 1 col, 2 tiles → 2 cols (50/50), 3-4 tiles → 2 cols, 5-9 → 3 cols
  const totalTiles = 1 + remoteStreamCount; // local + active remote streams
  const cols = remoteStreamCount === 0 ? 1 : Math.ceil(Math.sqrt(totalTiles));

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Top Banner */}
      <div className="flex items-center justify-center">
        <div className="bg-[#1A1A80] text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          Aptus Live classroom
        </div>
      </div>

      {/* Video Container */}
      <div className="relative bg-[#C7E7E7] rounded-3xl overflow-hidden shadow-inner flex-1 min-h-0 p-4 lg:p-6">
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

        {/* Main Video Area — Google Meet equal-proportion grid */}
        <div className="flex flex-col h-full pt-12 lg:pt-4 pb-20">
          <div
            className="flex-1 min-h-0 gap-3"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridAutoRows: "1fr",
            }}
          >
            {/* Local Video Tile */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden min-h-0">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? "hidden" : ""}`}
              />
              <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded-lg">
                {localName} {isMuted && "🔇"}
              </div>
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="w-16 h-16 bg-[#3CB4B4] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">YO</span>
                  </div>
                </div>
              )}
            </div>

            {/* Remote Video Tiles */}
            {remoteParticipants.map((sid, idx) =>
              remoteStreams[sid] ? (
                <div key={sid} className="min-h-0">
                  <RemoteVideoPlayer
                    stream={remoteStreams[sid]}
                    isMuted={remoteMediaStates[sid]?.isMuted ?? false}
                    isVideoOff={remoteMediaStates[sid]?.isVideoOff ?? false}
                    label={getRemoteName(idx)}
                  />
                </div>
              ) : null
            )}

            {/* Waiting tile — shown only when no one has joined yet */}
            {remoteStreamCount === 0 && (
              <div className="hidden" />
            )}
          </div>

          {/* Waiting message below grid when alone */}
          {remoteStreamCount === 0 && (
            <div className="flex flex-col items-center justify-center text-gray-500 py-3">
              <Users size={28} className="mb-1 opacity-30" />
              <p className="text-xs opacity-60">Waiting for participant to join...</p>
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
