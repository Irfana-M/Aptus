// VideoCallRoom.tsx - corrected version
import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import socketService from '../services/socketService'; // Add this import
import type { RootState } from '../app/store';
import type { User } from '../types/authTypes';
import { selectCurrentUser } from '../features/auth/authSelector';
import { prepareForVideoCall } from '../utils/videoCallPrep';
import { setError } from '../features/videoCall/videoCallSlice';
import { getErrorMessage } from '../utils/errorUtils';
import type { AppDispatch } from '../app/store';
import { verifyUserRole } from '../features/role/roleSlice';

export default function VideoCallRoom() {
  const { trialClassId } = useParams<{ trialClassId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [isPreparing, setIsPreparing] = useState(true);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [debugInfo, setDebugInfo] = useState(''); // Add debug state
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');

  // redux / auth
  const authUser = useSelector(selectCurrentUser);
  const adminUser = useSelector((state: RootState) => state.admin.admin);
  const roleFromStore = useSelector((state: RootState) => state.role.role);
  const roleLoading = useSelector((state: RootState) => state.role.loading);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const hasJoinedRef = useRef(false);

  const [socketConnected, setSocketConnected] = useState(false);
  const [isRemotePaused, setIsRemotePaused] = useState(false);

  // Debug connection function
  const testConnection = async () => {
    console.log('🧪 Testing WebSocket connection...');
    setDebugInfo(prev => prev + '\n🧪 Testing WebSocket connection...');
    
    // Test socket connection
    try {
      const socket = socketService.connect();
      setSocketConnected(socket.connected);
      
      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        setDebugInfo(prev => prev + '\n✅ Socket connected: ' + socket.id);
        setSocketConnected(true);
      });
      
      socket.on('disconnect', () => {
        setSocketConnected(false);
      });
      
      socket.on('connect_error', (error: Error) => {
        console.error('❌ Connection error:', error.message);
        setDebugInfo(prev => prev + '\n❌ Connection error: ' + error.message);
        setSocketConnected(false);
      });
      // ... rest of testConnection

      
      // Test media permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        console.log('✅ Media permissions granted');
        setDebugInfo(prev => prev + '\n✅ Media permissions granted');
        stream.getTracks().forEach(track => track.stop());
      } catch (err: unknown) {
        console.error('❌ Media permission error:', err);
        setDebugInfo(prev => prev + '\n❌ Media permission error: ' + getErrorMessage(err));
      }
    } catch (err: unknown) {
      console.error('❌ Socket connection error:', err);
      setDebugInfo(prev => prev + '\n❌ Socket connection error: ' + getErrorMessage(err));
    }
  };

  // derive (best-effort) userId & userType (fallbacks from localStorage or token)
  const currentUser = useMemo((): { userId: string; userType: 'mentor' | 'student' } | null => {
    let user: User | null = null;
    let role: 'mentor' | 'student' | undefined;

    if (adminUser) {
      const savedRole = localStorage.getItem('userRole');
      if (savedRole === 'mentor' || savedRole === 'student') {
        role = savedRole;
        user = { ...adminUser, role } as User;
      }
    } else if (authUser) {
      user = authUser;
      role = authUser.role;
    }

    if (!user || !role) {
      const savedRole = localStorage.getItem('userRole');
      const savedUserId = localStorage.getItem('userId');
      const token = localStorage.getItem('accessToken');

      if ((savedRole === 'mentor' || savedRole === 'student') && savedUserId && token) {
        return { userId: savedUserId, userType: savedRole as 'mentor' | 'student' };
      }

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const tokenRole: 'mentor' | 'student' = payload.role === 'mentor' ? 'mentor' : 'student';
          const id = payload.id || payload._id || payload.userId;
          if (id) return { userId: id, userType: tokenRole };
        } catch (e) {
          console.error('Token decode failed', e);
        }
      }
      return null;
    }

    return { userId: user._id, userType: role };
  }, [authUser, adminUser]);

  // If we don't have a minimal currentUser, redirect to login quickly
  useEffect(() => {
    if (!currentUser) {
      // Wait a moment for role verification to possibly fill in state — but if no token/local data, redirect.
      const t = setTimeout(() => {
        if (!currentUser) navigate('/login');
      }, 600);
      return () => clearTimeout(t);
    }
  }, [currentUser, navigate]);

  // Prepare environment & verify role with backend
  useEffect(() => {
    if (!currentUser || !trialClassId) return;

    let mounted = true;

    const prepareCall = async () => {
      setIsPreparing(true);

      // quick local preparation (permissions UI, CSS changes, etc)
      if (!prepareForVideoCall()) {
        dispatch(setError('Failed to prepare video call.'));
        setIsPreparing(false);
        return;
      }

      try {
        // verifyUserRole will call /role/verify and populate redux role slice
        const result = await dispatch(verifyUserRole()).unwrap();
        if (!mounted) return;

        // result should contain user and role according to your controller
        console.log('Role verify result:', result);
      } catch (err: unknown) {
        console.warn('Role verification failed, proceeding with best-effort:', err);
        // if role verify fails, we still allow user to attempt to join, but will not automatically join
      } finally {
        if (mounted) setIsPreparing(false);
      }
    };

    prepareCall();

    return () => { 
      mounted = false; 
    };
  }, [currentUser, trialClassId, dispatch]);

  // safe extraction for passing to hook (these may be empty until verify completes)
  const userId = currentUser?.userId ?? '';
  const userType = currentUser?.userType ?? 'student';

  // hook must be called unconditionally
  const webRTCConfig = useMemo(() => ({
    trialClassId: trialClassId || '',
    userId,
    userType: userType as 'mentor' | 'student',
  }), [trialClassId, userId, userType]);

  const {
    localStream,
    remoteStream,
    isConnected,
    error,
    isMuted,
    isVideoOff,
    joinCall,
    endCall,
    toggleMute,
    toggleVideo,
    remoteMediaState,
    status: webRTCStatus // Rename to avoid conflict
  } = useWebRTC(webRTCConfig);

  // Join call only when:
  // - we haven't attempted before
  // - we have trialClassId & userId
  // - preparation (and role verify attempt) is done
  // - AND the redux role matches the userType derived from token (prevents mismatch)
  useEffect(() => {
    // Check for missing requirements and update status
    if (!trialClassId) setConnectionStatus('Missing Trial Class ID');
    else if (!userId) setConnectionStatus('Missing User ID');
    else if (roleLoading) setConnectionStatus('Verifying Role...');
    else if (isPreparing) setConnectionStatus('Preparing Media...');
    else if (roleFromStore && roleFromStore !== userType) setConnectionStatus(`Role Mismatch: Store(${roleFromStore}) vs Token(${userType})`);
    else if (!roleFromStore) setConnectionStatus('Role verification failed or pending');
    
    if (
      !joinAttempted &&
      !isPreparing &&
      !roleLoading &&
      trialClassId &&
      userId &&
      roleFromStore &&
      roleFromStore === userType
    ) {
      setConnectionStatus('Joining Call...');
      setJoinAttempted(true);

      if (!hasJoinedRef.current) {
        hasJoinedRef.current = true;
        console.log('🚀 Joining call as', { userId, userType, trialClassId });
        setConnectionStatus('Emitting Join Event...');
        joinCall();
      }
    }

    // If role verification completed but the role does NOT match the token/userType, show error & navigate back
    if (!isPreparing && !roleLoading && roleFromStore && roleFromStore !== userType) {
      console.error('Role mismatch after verification', { roleFromStore, userType });
      dispatch(setError(`Role mismatch: Logged in as ${roleFromStore} but token says ${userType}`));
      // navigate away or show message
      const t = setTimeout(() => navigate('/login'), 3000); // Increased delay to read error
      return () => clearTimeout(t);
    }
  }, [
    joinAttempted,
    isPreparing,
    roleLoading,
    trialClassId,
    userId,
    userType,
    roleFromStore,
    joinCall,
    dispatch,
    navigate,
  ]);

  // attach media streams to <video> elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    console.log('🎬 [VideoCallRoom] Remote stream useEffect triggered', {
      hasRef: !!remoteVideoRef.current,
      hasStream: !!remoteStream,
      streamId: remoteStream?.id,
      audioTracks: remoteStream?.getAudioTracks().length,
      videoTracks: remoteStream?.getVideoTracks().length
    });
    
    if (remoteVideoRef.current && remoteStream) {
      console.log('✅ [VideoCallRoom] Setting remote video srcObject');
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Force play in case autoplay doesn't work
      remoteVideoRef.current.play().catch(err => {
        console.warn('⚠️ [VideoCallRoom] Remote video autoplay failed:', err);
      });
    } else {
      console.warn('⚠️ [VideoCallRoom] Cannot set remote stream:', {
        refExists: !!remoteVideoRef.current,
        streamExists: !!remoteStream
      });
    }
  }, [remoteStream]);

  // ensure cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        endCall();
      } catch (e) {
        console.warn('Error during endCall in cleanup', e);
      }
    };
  }, [endCall]);

  const handleEndCall = useCallback(() => {
    try {
      endCall();
    } finally {
      navigate(userType === 'mentor' ? '/mentor/dashboard' : `/trial-class/${trialClassId}/feedback`);
    }
  }, [endCall, navigate, userType, trialClassId]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <VideoOff size={64} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleEndCall}
            className="px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* DEBUG SECTION */}
      <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-md z-50">
        <button 
          onClick={testConnection}
          className="bg-blue-500 px-3 py-1 rounded mb-2 text-sm"
        >
          Test Connection
        </button>
        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-40">
          {debugInfo || 'Click "Test Connection" to debug'}
        </pre>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {/* Remote Video */}
        <div className="absolute inset-0">
          {remoteStream ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                controls
                className={`w-full h-full object-cover ${remoteMediaState.isVideoOff ? 'hidden' : ''}`}
                onPlay={() => setIsRemotePaused(false)}
                onPause={() => setIsRemotePaused(true)}
                onLoadedMetadata={() => {
                   console.log('🎬 [VideoCallRoom] Remote video metadata loaded, attempting play...');
                   remoteVideoRef.current?.play()
                     .then(() => setIsRemotePaused(false))
                     .catch(e => {
                       console.error('Play failed or paused:', e);
                       setIsRemotePaused(true);
                     });
                }}
              />
              
              {/* Autoplay Fallback Overlay */}
              {isRemotePaused && (
                <div 
                  className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-sm"
                >
                    <button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold text-lg pointer-events-auto transition flex items-center gap-3 shadow-xl transform hover:scale-105"
                      onClick={() => {
                         remoteVideoRef.current?.play().catch(console.error);
                      }}
                    >
                      <Video size={24} />
                      Click to Start Video Output
                    </button>
                </div>
              )}

              {remoteMediaState.isVideoOff && (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center text-white">
                    <div className="w-32 h-32 bg-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-indigo-400 shadow-xl">
                      <span className="text-4xl font-bold">
                        {userType === 'mentor' ? 'ST' : 'ME'}
                      </span>
                    </div>
                    <p className="text-xl font-medium mt-4 text-gray-400">Camera is off</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-indigo-400 shadow-xl">
                  <span className="text-4xl font-bold">
                    {userType === 'mentor' ? 'ST' : 'ME'}
                  </span>
                </div>
                <Loader size={32} className="animate-spin mx-auto mb-4" />
                <p className="text-xl font-medium">
                  Waiting for {userType === 'mentor' ? 'student' : 'mentor'}...
                </p>
              </div>
            </div>
          )}
          
          {/* Remote Mute Indicator */}
          {remoteMediaState.isMuted && isConnected && (
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-24 bg-red-600/90 text-white px-4 py-2 rounded-full flex items-center gap-2">
                <MicOff size={16} />
                <span className="text-sm font-medium">Muted</span>
             </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-24 right-6 w-72 h-48 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-700 bg-gray-900">
          {isVideoOff ? (
            <div className="w-full h-full flex items-center justify-center relative">
               <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-400">YOU</span>
               </div>
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <VideoOff size={32} className="text-white/50" />
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
          )}
          <div className="absolute top-2 left-2 bg-black/60 px-3 py-1 rounded text-xs text-white font-medium flex items-center gap-2">
            <span>You ({userType})</span>
            {isMuted && <MicOff size={12} className="text-red-400" />}
          </div>
        </div>

        {/* Connection Status */}
        <div className="absolute top-6 left-6 bg-black/60 backdrop-blur px-4 py-2 rounded-full">
          <span
            className={`w-3 h-3 ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} rounded-full inline-block animate-pulse mr-2`}
          />
          <span className="text-white text-sm font-medium">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      // Add this to your return statement, above the debug section
<div className="fixed top-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-md z-50">
  <div className="text-xs space-y-1">
    <div>🔌 Socket: {socketConnected ? '✅' : '❌'}</div>
    <div>🔗 WebRTC: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
    <div>🚦 Global Status: {connectionStatus}</div>
    <div>🛠️ WebRTC Status: {webRTCStatus}</div>
    <div>📹 Local Stream: {localStream ? '✅' : '❌'}</div>
    <div>📹 Remote Stream: {remoteStream ? '✅' : '❌'}</div>
    <div>🎤 Muted: {isMuted ? '✅' : '❌'}</div>
    <div>📸 Video Off: {isVideoOff ? '✅' : '❌'}</div>
    {error && <div className="text-red-400">❌ Error: {error}</div>}
  </div>
</div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="max-w-md mx-auto flex items-center justify-center gap-6">
          <button
            onClick={toggleMute}
            className={`p-5 rounded-full transition ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-5 rounded-full transition ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            aria-label={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isVideoOff ? <VideoOff size={28} className="text-white" /> : <Video size={28} className="text-white" />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-5 rounded-full bg-red-600 hover:bg-red-700 transition"
            aria-label="End call"
          >
            <PhoneOff size={28} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}