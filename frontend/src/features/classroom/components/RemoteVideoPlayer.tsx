import React, { useEffect, useRef } from 'react';

interface RemoteVideoPlayerProps {
  stream: MediaStream;
  isMuted: boolean;
  isVideoOff: boolean;
  label: string;
}

const RemoteVideoPlayer: React.FC<RemoteVideoPlayerProps> = ({ stream, isMuted, isVideoOff, label }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl border-2 lg:border-4 border-white aspect-video lg:aspect-auto h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
      />
      
      {isVideoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-16 h-16 bg-[#3CB4B4] rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{label.slice(0, 2).toUpperCase()}</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur px-3 py-1 rounded-lg text-[10px] text-white font-bold flex items-center gap-2">
        {label}
        {isMuted && <span className="text-red-400">🔇</span>}
      </div>
    </div>
  );
};

export default RemoteVideoPlayer;
