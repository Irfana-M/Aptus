import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MoreHorizontal, ChevronDown, Minus, Users } from 'lucide-react';
import RemoteVideoPlayer from './RemoteVideoPlayer';
import type { RemoteMediaState } from '../../../types/video.types';
import { Loader } from '../../../components/ui/Loader';

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
  userType: 'mentor' | 'student';
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
  userType,
  duration = 0,
  status = 'Connecting...',
}) => {
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  const remoteParticipants = participants;
  const remoteStreamCount = Object.keys(remoteStreams).length;

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
             <span className="text-[10px] font-bold text-gray-800">{formatDuration(duration)}</span>
           </div>

           {status && status !== 'Media Connected' && (
             <div className="flex items-center gap-2 bg-amber-50/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-amber-200 min-w-fit">
               <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tighter whitespace-nowrap">{status}</span>
             </div>
           )}
        </div>

        {/* Main Grid */}
        <div className="flex flex-col h-full pt-12 lg:pt-0">
          <div className={`flex-1 grid gap-4 ${
            remoteStreamCount <= 1 ? 'grid-cols-1' : 
            remoteStreamCount <= 2 ? 'grid-cols-2' : 
            'grid-cols-2 lg:grid-cols-3'
          }`}>
            {/* Local Video - Always visible in the grid if not swapped, or as a small float if preferred */}
            {/* For this mesh refactor, let's keep local separate or first in grid */}
            <div className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 lg:border-4 border-white aspect-video order-first`}>
               <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{userType === 'mentor' ? 'ME' : 'ST'}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur px-3 py-1 rounded-lg text-[10px] text-white font-bold">
                  You ({userType})
                  {isMuted && <MicOff size={10} className="inline ml-2 text-red-400" />}
                </div>
            </div>

            {/* Remote Participants */}
            {remoteParticipants.map((sid) => (
              remoteStreams[sid] ? (
                <RemoteVideoPlayer
                  key={sid}
                  stream={remoteStreams[sid]}
                  isMuted={remoteMediaStates[sid]?.isMuted ?? false}
                  isVideoOff={remoteMediaStates[sid]?.isVideoOff ?? false}
                  label={`Participant (${sid.slice(0, 4)})`}
                />
              ) : (
                <div key={sid} className="bg-gray-800 rounded-2xl flex flex-col items-center justify-center text-white/50 aspect-video border-2 border-dashed border-gray-600">
                  <Loader size="sm" color="teal" />
                  <p className="text-[10px] mt-2">Connecting to {sid.slice(0, 4)}...</p>
                </div>
              )
            ))}

            {remoteStreamCount === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-20">
                <Users size={48} className="mb-4 opacity-20" />
                <p className="font-bold opacity-50 uppercase tracking-widest text-sm">Waiting for participants to join...</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar Controls */}
        <div className="absolute bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 lg:gap-3">
          <button 
            onClick={onToggleMute}
            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white text-gray-800 hover:bg-gray-50 shadow-md'
            }`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button 
            onClick={onToggleVideo}
            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white text-gray-800 hover:bg-gray-50 shadow-md'
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
