import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useVideoCall } from '../context/VideoCallContext';
import type { RootState } from '../app/store';
import type { User } from '../types/authTypes';
import { selectCurrentUser } from '../features/auth/authSelector';
import { prepareForVideoCall } from '../utils/videoCallPrep';
import { setError } from '../features/videoCall/videoCallSlice';
import type { AppDispatch } from '../app/store';
import { verifyUserRole } from '../features/role/roleSlice';
import { VideoOff, AlertCircle } from 'lucide-react';

// Classroom Components
import { ClassroomLayout } from '../features/classroom/components/ClassroomLayout';
import { ClassroomSidebar } from '../features/classroom/components/ClassroomSidebar';
import { ClassroomHeader } from '../features/classroom/components/ClassroomHeader';
import { ClassroomRightPanel } from '../features/classroom/components/ClassroomRightPanel';
import { ClassroomVideoGrid } from '../features/classroom/components/ClassroomVideoGrid';
import { studentTrialApi } from '../features/trial/student/studentTrialApi';
import type { TrialClassResponse } from '../types/trialTypes';

export default function VideoCallRoom() {
  const { trialClassId } = useParams<{ trialClassId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [isPreparing, setIsPreparing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [trialDetails, setTrialDetails] = useState<TrialClassResponse | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // redux / auth
  const authUser = useSelector(selectCurrentUser);
  const adminUser = useSelector((state: RootState) => state.admin.admin);
  const roleFromStore = useSelector((state: RootState) => state.role.role);
  const userIdFromStore = useSelector((state: RootState) => state.role.userId);
  const roleLoading = useSelector((state: RootState) => state.role.loading);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const hasJoinedRef = useRef(false);

  // derive (best-effort) userId & userType (fallbacks from localStorage or token)
  const currentUser = useMemo((): { userId: string; userType: 'mentor' | 'student'; name: string } | null => {
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
      const prefRole = localStorage.getItem('userRole');
      const savedUserId = localStorage.getItem('userId');
      const studentToken = localStorage.getItem('student_accessToken');
      const mentorToken = localStorage.getItem('mentor_accessToken');
      const genericToken = localStorage.getItem('accessToken');

      // Prioritize the token matching the preferred role
      let activeToken = null;
      if (prefRole === 'student') activeToken = studentToken || genericToken || mentorToken;
      else if (prefRole === 'mentor') activeToken = mentorToken || genericToken || studentToken;
      else activeToken = studentToken || mentorToken || genericToken;
      
      if (!activeToken) return null;

      try {
        const payload = JSON.parse(atob(activeToken.split('.')[1]));
        const tokenRole: 'mentor' | 'student' = payload.role === 'mentor' ? 'mentor' : 'student';
        const id = payload.id || payload._id || payload.userId || savedUserId;
        
        if (id) {
          return { 
            userId: id, 
            userType: tokenRole, 
            name: payload.fullName || payload.name || 'User' 
          };
        }
      } catch (e) {
        console.error('Token decode failed in VideoCallRoom', e);
      }
      return null;
    }

    return { userId: user._id, userType: role, name: user.fullName };
  }, [authUser, adminUser]);

  const userId = currentUser?.userId ?? '';
  const userType = currentUser?.userType ?? 'student';

  // Actual Participants (Only 2)
  const participants = useMemo(() => {
    const list = [
      { id: currentUser?.userId || 'me', name: currentUser?.name || 'You', role: currentUser?.userType || 'student' as const }
    ];
    
    // Add remote participant if details are available and we're connected
    if (trialDetails) {
      if (userType === 'student' && trialDetails.mentor) {
        const mentor = trialDetails.mentor;
        list.push({ 
          id: typeof mentor === 'string' ? mentor : mentor.id, 
          name: typeof mentor === 'string' ? 'Mentor' : mentor.name, 
          role: 'mentor' as const 
        });
      } else if (userType === 'mentor' && trialDetails.student) {
        const student = trialDetails.student;
        list.push({ 
          id: typeof student === 'string' ? student : student.id, 
          name: typeof student === 'string' ? 'Student' : student.fullName, 
          role: 'student' as const 
        });
      }
    }
    
    return list;
  }, [currentUser, trialDetails, userType]);

  // If we don't have a minimal currentUser, redirect to login quickly
  useEffect(() => {
    if (!currentUser) {
      const t = setTimeout(() => {
        if (!currentUser) navigate('/login');
      }, 600);
      return () => clearTimeout(t);
    }
  }, [currentUser, navigate]);

  const hasInitializedRef = useRef(false);

  // Prepare environment & verify role with backend
  // Stable identifiers for initialization
  const stableUserId = currentUser?.userId;
  const stableUserType = currentUser?.userType;

  useEffect(() => {
    // Stop if we don't have basic info
    if (!stableUserId || !trialClassId) return;

    // If already initialized, just ensure we aren't stuck in "preparing"
    if (hasInitializedRef.current) {
        if (isPreparing && !roleLoading && roleFromStore) {
            console.log('🩹 [VideoCall] Already initialized, clearing preparing state.');
            setIsPreparing(false);
        }
        return;
    }

    let mounted = true;

    const prepareCall = async () => {
      console.log('🔄 [VideoCall] Starting initialization sequence...', { stableUserId, stableUserType, trialClassId });
      hasInitializedRef.current = true;
      setIsPreparing(true);
      setInitError(null);

      if (!prepareForVideoCall(stableUserType)) {
        const msg = 'Failed to prepare video call environment.';
        dispatch(setError(msg));
        setInitError(msg);
        setIsPreparing(false);
        return;
      }

      try {
        console.log('🔄 [VideoCall] Fetching trial details...');
        const details = await studentTrialApi.getTrialClassById(trialClassId);
        if (mounted) {
            setTrialDetails(details);
                        // Redirect if session is not active
                    if (details.status === 'completed' || details.status === 'cancelled') {
                        console.log(`🚫 [VideoCall] Session is ${details.status}, redirecting...`);
                        
                        // Treat a session as a trial ONLY if one of the following is true: 
                        // session.trialClassId exists OR session.sessionType === 'trial' OR course.isTrial === true
                        const isTrial = !!((details as any).trialClassId || (details as any).sessionType === 'trial' || (details as any).course?.isTrial);

                        if (userType === 'student' && details.status === 'completed' && isTrial) {
                            navigate(`/trial-class/${trialClassId}/feedback`);
                        } else {
                            navigate(userType === 'mentor' ? '/mentor/dashboard' : '/student/dashboard');
                        }
                        return;
                    }
        }
        
        console.log('🔄 [VideoCall] Verifying role...');
        await dispatch(verifyUserRole(stableUserType)).unwrap();
        console.log('✅ [VideoCall] Initialization successful');
      } catch (err: unknown) {
        const error = err as Error;
        console.warn('❌ [VideoCall] Initialization failed:', error);
        if (mounted) {
            setInitError(error.message || 'Failed to verify user permissions.');
            hasInitializedRef.current = false; // Allow retry on failure
        }
      } finally {
        if (mounted) {
            console.log('🔄 [VideoCall] Initialization sequence complete');
            setIsPreparing(false);
        }
      }
    };

    prepareCall();

    return () => {
      mounted = false;
    };
  }, [stableUserId, trialClassId, stableUserType, dispatch, roleLoading, roleFromStore, isPreparing, userType, navigate]);


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
    status,
    isSocketConnected, // Destructure this
  } = useVideoCall();

  useEffect(() => {
    // Determine the actual values to use
    const activeUserId = userIdFromStore || stableUserId || userId;
    const activeRole = roleFromStore || stableUserType || userType;

    console.log('🧐 [VideoCall] Join check:', { 
        isPreparing, 
        roleLoading, 
        trialClassId, 
        activeUserId, 
        activeRole, 
        joinAttempted,
        hasJoined: hasJoinedRef.current,
        roleFromStore,
        userIdFromStore
    });

    if (isPreparing || roleLoading || !trialClassId || !activeUserId || !activeRole) return;
    
    // GUARD: Ensure we only join once per lifecycle
    if (!hasJoinedRef.current) {
        console.log('🚀 [VideoCall] Attempting to join call...', { trialClassId, userId: activeUserId, userType: activeRole });
        hasJoinedRef.current = true;
        setJoinAttempted(true);
        joinCall({ trialClassId, userId: activeUserId as string, userType: activeRole as 'mentor' | 'student' });
    }
  }, [
    joinAttempted,
    isPreparing,
    roleLoading,
    trialClassId,
    userId,
    stableUserId,
    stableUserType,
    userType,
    roleFromStore,
    userIdFromStore,
    joinCall,
    navigate,
  ]);

  // Ensure local stream is attached to ref
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        console.log('📹 [VideoCall] Attaching local stream');
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play().catch(e => console.warn('Local video play failed:', e));
    }
  }, [localStream, isPreparing, joinAttempted]); // Trigger on join state changes too

  // Ensure remote stream is attached to ref
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
        const hasVideo = remoteStream.getVideoTracks().length > 0;
        const hasAudio = remoteStream.getAudioTracks().length > 0;
        
        console.log('📺 [VideoCall] Remote stream state:', { 
            hasVideo, 
            hasAudio, 
            trackCount: remoteStream.getTracks().length,
            videoReadyState: remoteStream.getVideoTracks()[0]?.readyState,
            audioReadyState: remoteStream.getAudioTracks()[0]?.readyState
        });

        // Always ensure the stream is attached if it's different
        if (remoteVideoRef.current.srcObject !== remoteStream) {
            console.log('📺 [VideoCall] Attaching remote stream to element');
            remoteVideoRef.current.srcObject = remoteStream;
        }
        
        // Use a more aggressive play strategy
        const playRemote = async () => {
            try {
                if (remoteVideoRef.current) {
                    await remoteVideoRef.current.play();
                    console.log('✅ [VideoCall] Remote video playing');
                }
            } catch (e) {
                console.warn('⚠️ [VideoCall] Remote video play failed, waiting for user interaction or track:', e);
                // No-op, browser might block autoplay without interaction
            }
        };

        playRemote();

        // Listen for new tracks being added to the stream
        const handleTrackAdded = () => {
            console.log('📺 [VideoCall] Track added to existing remote stream');
            playRemote();
        };

        remoteStream.addEventListener('addtrack', handleTrackAdded);
        return () => {
            remoteStream.removeEventListener('addtrack', handleTrackAdded);
        };
    }
  }, [remoteStream, isPreparing]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isConnected) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  // REMOVED: Unmount should NOT end call anymore to allow for PIP (Floating Window)
  /*
  useEffect(() => {
    return () => {
      try {
        endCall();
      } catch (e) {
        console.warn('Error during endCall in cleanup', e);
      }
    };
  }, [endCall]);
  */

  // Determine if this is a trial session based on product rules
  const isTrialSession = useMemo(() => {
    if (!trialDetails) return false;
    const details = trialDetails as any;
    return !!(details.trialClassId || details.sessionType === 'trial' || details.course?.isTrial);
  }, [trialDetails]);

  const handleEndCall = useCallback(async () => {
    try {
      if (userType === 'mentor' && trialClassId && isTrialSession) {
        try {
          await studentTrialApi.completeTrialClass(trialClassId);
        } catch (e) {
          console.error('Failed to mark trial as completed:', e);
        }
      }
      endCall();
    } finally {
      if (userType === 'student') {
        if (isTrialSession) {
          navigate(`/trial-class/${trialClassId}/feedback`);
        } else {
          navigate('/student/dashboard');
        }
      } else {
        if (window.opener) {
          window.close();
        } else {
          navigate('/mentor/dashboard');
        }
      }
    }
  }, [endCall, navigate, userType, trialClassId, isTrialSession]);
  
  if (initError) {
    return (
      <div className="min-h-screen bg-[#F4FBFB] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-red-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <VideoOff className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-outfit">Initialization Failed</h2>
          <p className="text-gray-600 mb-8">{initError}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#1A1A80] text-white font-bold py-3.5 rounded-xl hover:bg-[#2A2A90] transition-all shadow-lg active:scale-[0.98]"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="w-full bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPreparing) {
    return (
      <div className="min-h-screen bg-[#F4FBFB] flex items-center justify-center">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 border-4 border-[#3CB4B4] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-outfit">Preparing Classroom</h2>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <AlertCircle size={14} className="text-[#3CB4B4] animate-pulse" />
            Verifying secure connection...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Call state:', { isConnected });
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8 bg-white/10 backdrop-blur rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleEndCall}
            className="px-6 py-3 bg-[#3CB4B4] text-white rounded-lg font-bold hover:bg-[#329898] transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ClassroomLayout
      sidebar={userType === 'mentor' ? <ClassroomSidebar onLogout={() => navigate('/logout')} /> : null}
      header={<ClassroomHeader />}
      mainContent={
        <div className="space-y-8 animate-in fade-in duration-700">
          <ClassroomVideoGrid
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            remoteStream={remoteStream}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            remoteMediaState={remoteMediaState}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onEndCall={handleEndCall}
            onMinimize={() => navigate(-1)}
            userType={userType}
            duration={callDuration}
            status={status}
          />

          {/* Subject Information Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {trialDetails?.subject?.subjectName || (isTrialSession ? 'Aptus Trial Session' : 'Aptus Live Session')}
            </h2>
            <h3 className="text-sm font-bold text-gray-800 mb-4">
              Personalized Mentoring Session
            </h3>
            
            <div className="space-y-1 mt-6">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isTrialSession ? 'Aptus Trial Session' : 'Aptus Live Session'}</span>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                Experience the <span className="text-[#3CB4B4]">Future</span> of Online Learning
              </h1>
            </div>
            {isTrialSession && (
              <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-md">
                This trial session is designed to evaluate your learning goals and match you with the perfect educational path.
              </p>
            )}
          </div>
        </div>
      }
      rightPanel={
        <ClassroomRightPanel
          sessionId={trialClassId || ''}
          currentUser={{
            id: currentUser?.userId || '',
            name: currentUser?.name || 'User',
            role: currentUser?.userType === 'mentor' ? 'Mentor' : 'Student',
          }}
          participants={participants}
          onFeedback={userType === 'student' && isTrialSession ? () => navigate(`/trial-class/${trialClassId}/feedback`) : undefined}
          isSocketConnected={isSocketConnected}
        />
      }
    />
  );
}
