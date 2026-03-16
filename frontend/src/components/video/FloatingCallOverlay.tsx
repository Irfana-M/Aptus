import React, { useRef, useEffect } from 'react';
import { useVideoCall } from '../../context/videoCallContextStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Maximize2, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

const FloatingCallOverlay: React.FC = () => {
    const { 
        sessionId, 
        localStream, 
        remoteStreams, 
        isConnected,
        isMuted,
        isVideoOff,
        toggleMute,
        toggleVideo,
        endCall
    } = useVideoCall();
    
    const navigate = useNavigate();
    const location = useLocation();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteStream = Object.values(remoteStreams)[0] || null;
    // Hide if no call is active OR if we are already on the call page
    const isOnCallRoute = location.pathname.includes(`/trial-class/${sessionId}/call`);
    const shouldHide = !sessionId || isOnCallRoute;

    useEffect(() => {
        if (shouldHide) return;
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, shouldHide]);

    useEffect(() => {
        if (shouldHide) return;
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(console.error);
        }
    }, [remoteStream, shouldHide]);

    const handleMaximize = () => {
        navigate(`/trial-class/${sessionId}/call`);
    };

    if (shouldHide) return null;

    return (
        <div className="fixed bottom-6 right-6 w-80 bg-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden z-[9999] animate-in slide-in-from-bottom-5 duration-500">
            {/* Remote Video (Main) */}
            <div className="relative aspect-video bg-black">
                {remoteStream ? (
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                                <Video size={20} />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest">Waiting for partner...</p>
                        </div>
                    </div>
                )}

                {/* Local Video (Thumbnail) */}
                <div className="absolute top-3 right-3 w-24 aspect-video bg-slate-800 rounded-xl border border-white/20 overflow-hidden shadow-lg shadow-black/50">
                    {localStream && !isVideoOff ? (
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover -scale-x-100"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <VideoOff size={12} className="text-white/20" />
                        </div>
                    )}
                </div>

                {/* Connection Status Overlay */}
                {!isConnected && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center px-4">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-[10px] text-white font-bold uppercase tracking-widest">Connecting...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
                <div className="flex gap-2">
                    <button 
                        onClick={toggleMute}
                        className={`p-2.5 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    <button 
                        onClick={toggleVideo}
                        className={`p-2.5 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleMaximize}
                        className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                        title="Maximize"
                    >
                        <Maximize2 size={16} />
                    </button>
                    <button 
                        onClick={() => endCall()}
                        className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                        title="End Call"
                    >
                        <PhoneOff size={16} />
                    </button>
                </div>
            </div>
            
            {/* Header / Grabber */}
            <div className="absolute top-0 left-0 right-0 p-3 h-12 flex items-center justify-between pointer-events-none">
                <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-tighter border border-white/10 flex items-center gap-1.5 pointer-events-auto">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                    Live Class
                </div>
            </div>
        </div>
    );
};

export default FloatingCallOverlay;
