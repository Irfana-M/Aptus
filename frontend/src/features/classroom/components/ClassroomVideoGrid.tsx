import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MoreHorizontal, ChevronDown, Maximize2, Pin, Minus } from 'lucide-react';

interface ClassroomVideoGridProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteMediaState: { isMuted: boolean; isVideoOff: boolean };
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
  remoteVideoRef,
  remoteStream,
  isMuted,
  isVideoOff,
  remoteMediaState,
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

  const toggleFullscreen = () => {
    if (!remoteVideoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      remoteVideoRef.current.requestFullscreen().catch((err: unknown) => {
        const error = err as Error;
        console.error(`Error attempting to enable full-screen mode: ${error.message}`);
      });
    }
  };

  const [isSwapped, setIsSwapped] = useState(false);
  const toggleSwap = () => setIsSwapped(!isSwapped);

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
        <div className="grid grid-cols-12 gap-4 h-full pt-12 lg:pt-0">
          {/* Main Display Area */}
          <div className="col-span-12 lg:col-span-8 bg-gray-900 rounded-2xl overflow-hidden relative shadow-2xl border-2 lg:border-4 border-white aspect-video lg:aspect-auto">
            {!isSwapped ? (
              remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${remoteMediaState.isVideoOff ? 'hidden' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 bg-gray-800">
                  <div className="w-12 lg:w-20 h-12 lg:h-20 rounded-full bg-indigo-600/30 flex items-center justify-center mb-4">
                    <Video size={30} />
                  </div>
                  <p className="text-xs lg:text-sm font-medium">Waiting for participant...</p>
                </div>
              )
            ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`}
                />
            )}
            
            {/* Overlay buttons for the main area */}
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button 
                onClick={toggleSwap}
                className={`bg-black/40 backdrop-blur p-2 rounded-lg text-white hover:bg-black/60 transition-all ${isSwapped ? 'text-[#3CB4B4]' : ''}`}
                title="Swap Video"
              >
                <Pin size={18} className={isSwapped ? 'fill-[#3CB4B4]' : ''} />
              </button>
              <button 
                onClick={toggleFullscreen}
                className="bg-black/40 backdrop-blur p-2 rounded-lg text-white hover:bg-black/60 transition-all"
                title="Fullscreen"
              >
                <Maximize2 size={18} />
              </button>
            </div>

            {((!isSwapped && remoteMediaState.isVideoOff) || (isSwapped && isVideoOff) || (isSwapped && status?.includes('Camera'))) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 transition-all duration-500">
                <div className="text-center group">
                  <div className="w-16 lg:w-24 h-16 lg:h-24 bg-[#3CB4B4] rounded-full mx-auto flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <span className="text-xl lg:text-2xl font-bold text-white">
                      {!isSwapped ? (userType === 'mentor' ? 'ST' : 'ME') : 'YOU'}
                    </span>
                  </div>
                  <p className="text-white/60 text-[10px] lg:text-sm font-medium">
                    {isSwapped && status?.includes('Camera') ? status : 'Camera is off'}
                  </p>
                </div>
              </div>
            )}

            {/* Stream Label */}
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur px-3 py-1 rounded-lg text-[10px] text-white font-bold">
               {!isSwapped ? (userType === 'mentor' ? 'Student' : 'Mentor') : `You (${userType})`}
               {(!isSwapped ? remoteMediaState.isMuted : isMuted) && <MicOff size={10} className="inline ml-2 text-red-400" />}
            </div>
          </div>

          {/* Side View Column */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
              <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative shadow-xl border-2 lg:border-4 border-white min-h-[180px] lg:min-h-[220px]">
                {isSwapped ? (
                  remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className={`w-full h-full object-cover ${remoteMediaState.isVideoOff ? 'hidden' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                      <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-full bg-indigo-600/20 flex items-center justify-center mb-2">
                        <Video size={20} className="text-indigo-400" />
                      </div>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Connecting...</span>
                    </div>
                  )
                ) : (
                  isVideoOff ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="w-12 lg:w-16 h-12 lg:h-16 rounded-full bg-gray-700 flex items-center justify-center">
                            <span className="text-sm lg:text-lg font-bold text-white/40">YOU</span>
                        </div>
                    </div>
                  ) : (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                  )
                )}
                
                {((isSwapped && remoteMediaState.isVideoOff) || (!isSwapped && isVideoOff)) && (
                   <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Camera Off</span>
                   </div>
                )}

                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur px-3 py-1 rounded-lg text-[10px] text-white font-bold">
                    {isSwapped ? (userType === 'mentor' ? 'Student' : 'Mentor') : 'You'}
                    {(isSwapped ? remoteMediaState.isMuted : isMuted) && <MicOff size={10} className="inline ml-2 text-red-400" />}
                </div>
              </div>
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
