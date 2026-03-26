import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useVideoCall } from "../context/videoCallContextStore";
import type { RootState } from "../app/store";
import { selectCurrentUser } from "../features/auth/authSelector";
import { prepareForVideoCall } from "../utils/videoCallPrep";
import { setError } from "../features/videoCall/videoCallSlice";
import type { AppDispatch } from "../app/store";
import { verifyUserRole } from "../features/role/roleSlice";
import { fetchStudentProfile } from "../features/student/studentThunk";
import { updateTrialClassStatus } from "../features/mentor/mentorThunk";
import { VideoOff } from "lucide-react";
import { sessionApi } from "../features/session/sessionApi";
import { ROUTES } from "../constants/routes.constants";
import { Loader } from "../components/ui/Loader";
import { TokenManager } from "../utils/tokenManager";
// Classroom Components
import { ClassroomLayout } from "../features/classroom/components/ClassroomLayout";
import { ClassroomSidebar } from "../features/classroom/components/ClassroomSidebar";
import { ClassroomHeader } from "../features/classroom/components/ClassroomHeader";
import { ClassroomRightPanel } from "../features/classroom/components/ClassroomRightPanel";
import { ClassroomVideoGrid } from "../features/classroom/components/ClassroomVideoGrid";
import { studentTrialApi } from "../features/trial/student/studentTrialApi";
import type { TrialClassResponse } from "../types/trial.types";

export default function VideoCallRoom() {
  const { trialClassId, sessionId } = useParams<{
    trialClassId: string;
    sessionId: string;
  }>();

  const effectiveId = trialClassId || sessionId;
  const isTrialRoute = !!trialClassId;

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [isPreparing, setIsPreparing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [hasUserJoined, setHasUserJoined] = useState(false);
  const [trialDetails, setTrialDetails] = useState<TrialClassResponse | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null); // For regular sessions
  const [callDuration, setCallDuration] = useState(0);

  // redux / auth
  const authUser = useSelector(selectCurrentUser);
  const roleFromStore = useSelector((state: RootState) => state.role.role);
  const userIdFromStore = useSelector((state: RootState) => state.role.userId);
  const roleLoading = useSelector((state: RootState) => state.role.loading);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const hasJoinedRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const hasEndedRef = useRef(false);

  const currentUser = useMemo(() => {
    const token = TokenManager.getToken();
    const role = TokenManager.getRole();
    const userId = TokenManager.getUserId();
    const name = TokenManager.getUserName();

    if (!token || !role || !userId) return null;

    return {
      userId,
      userType: role as "mentor" | "student",
      name: authUser?.fullName || name || "User",
    };
  }, [authUser]);

  const userId = currentUser?.userId ?? "";
  const userType = currentUser?.userType ?? "student";

  const participantDetails = useMemo(() => {
    const list = [
      {
        id: currentUser?.userId || "me",
        name: currentUser?.name || "You",
        role: currentUser?.userType || ("student" as const),
      },
    ];

    if (trialDetails) {
      if (userType === "student" && trialDetails.mentor) {
        const mentor = trialDetails.mentor;
        list.push({
          id: typeof mentor === "string" ? mentor : mentor.id,
          name: typeof mentor === "string" ? "Mentor" : mentor.name,
          role: "mentor" as const,
        });
      } else if (userType === "mentor" && trialDetails.student) {
        const student = trialDetails.student;
        list.push({
          id: typeof student === "string" ? student : student.id,
          name: typeof student === "string" ? "Student" : student.fullName,
          role: "student" as const,
        });
      }
    }

    if (sessionDetails) {
        if (sessionDetails.participants && Array.isArray(sessionDetails.participants)) {
            sessionDetails.participants.forEach((p: any) => {
                const pUserId = p.userId?._id || p.userId?.id || p.userId;
                if (pUserId && pUserId !== userId) {
                    list.push({
                        id: pUserId,
                        name: p.userId?.fullName || (p.role === 'mentor' ? 'Mentor' : 'Student'),
                        role: p.role as "mentor" | "student"
                    });
                }
            });
        } else {
            if (userType === 'mentor' && sessionDetails.studentId) {
                list.push({
                    id: sessionDetails.studentId?._id || sessionDetails.studentId?.id || sessionDetails.studentId,
                    name: sessionDetails.studentId?.fullName || 'Student',
                    role: 'student' as const
                });
            } else if (userType === 'student' && sessionDetails.mentorId) {
                list.push({
                    id: sessionDetails.mentorId?._id || sessionDetails.mentorId?.id || sessionDetails.mentorId,
                    name: sessionDetails.mentorId?.fullName || 'Mentor',
                    role: 'mentor' as const
                });
            }
        }
    }

    return list;
  }, [currentUser, trialDetails, sessionDetails, userType, userId]);

  useEffect(() => {
    if (!currentUser) {
      const t = setTimeout(() => {
        if (!currentUser) navigate(ROUTES.LOGIN);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [currentUser, navigate]);

  const stableUserId = currentUser?.userId;
  const stableUserType = currentUser?.userType;

  useEffect(() => {
    if (!stableUserId || !effectiveId) return;
    if (hasInitializedRef.current) {
      if (isPreparing && !roleLoading && roleFromStore) {
        setIsPreparing(false);
      }
      return;
    }

    let mounted = true;

    const prepareCall = async () => {
      console.log("🔄 [VideoCall] Starting initialization sequence...", {
        stableUserId,
        stableUserType,
        effectiveId,
        isTrialRoute
      });
      hasInitializedRef.current = true;
      setIsPreparing(true);
      setInitError(null);

      if (!prepareForVideoCall(stableUserType)) {
        const msg = "Failed to prepare video call environment.";
        dispatch(setError(msg));
        setInitError(msg);
        setIsPreparing(false);
        return;
      }

      try {
        console.log("🔄 [VideoCall] Fetching details...");
        if (isTrialRoute && trialClassId) {
          try {
            const details = await studentTrialApi.getTrialClassById(trialClassId);
            if (mounted) {
              setTrialDetails(details);
              if (details.status === "completed" || details.status === "cancelled") {
                navigate(userType === "student" 
                  ? ROUTES.COMMON.TRIAL_FEEDBACK.replace(":trialClassId", trialClassId)
                  : ROUTES.MENTOR.DASHBOARD);
                return;
              }
            }
          } catch (fetchError) {
            console.warn("⚠️ Could not fetch trial details:", fetchError);
          }
        } else if (sessionId) {
          console.log("🔄 [VideoCall] Fetching regular session details...");
          try {
            const response = await sessionApi.getSessionById(sessionId);
            if (mounted) {
              setSessionDetails(response.data || response);
            }
          } catch (fetchError) {
            console.warn("⚠️ Could not fetch regular session details:", fetchError);
          }
        }

        console.log("🔄 [VideoCall] Verifying role...");
        await dispatch(verifyUserRole(stableUserType)).unwrap();
        console.log("✅ [VideoCall] Initialization successful");
      } catch (err: unknown) {
        const error = err as Error;
        console.warn("❌ [VideoCall] Initialization failed:", error);
        if (mounted) {
          setInitError(error.message || "Failed to verify user permissions.");
          hasInitializedRef.current = false;
        }
      } finally {
        if (mounted) {
          console.log("🔄 [VideoCall] Initialization sequence complete");
          setIsPreparing(false);
        }
      }
    };

    prepareCall();

    return () => {
      mounted = false;
    };
  }, [
    stableUserId,
    effectiveId,
    trialClassId,
    sessionId,
    isTrialRoute,
    userType,
    stableUserType,
    dispatch,
    roleLoading,
    roleFromStore,
    isPreparing,
    navigate,
  ]);

  const {
    localStream,
    remoteStreams,
    participants,
    isConnected,
    error,
    isMuted,
    isVideoOff,
    joinCall,
    endCall,
    toggleMute,
    toggleVideo,
    remoteMediaStates,
    status,
    isSocketConnected,
    socket,
  } = useVideoCall();

  useEffect(() => {
    const activeUserId = userIdFromStore || stableUserId || userId;
    const activeRole = roleFromStore || stableUserType || userType;

    if (
      isPreparing ||
      roleLoading ||
      !effectiveId ||
      !activeUserId ||
      !activeRole||
      !hasUserJoined
    )
      return;
    
    if (!hasJoinedRef.current) {
      console.log("🚀 [VideoCall] Attempting to join call...", {
        effectiveId,
        userId: activeUserId,
        userType: activeRole,
      });
      hasJoinedRef.current = true;
      setJoinAttempted(true);

      joinCall({
        sessionId: effectiveId,
        userId: activeUserId as string,
        userType: activeRole as "mentor" | "student",
      });
    }
  }, [
    joinAttempted,
    isPreparing,
    roleLoading,
    effectiveId,
    userId,
    stableUserId,
    stableUserType,
    userType,
    roleFromStore,
    userIdFromStore,
    joinCall,
    navigate,
    hasUserJoined
  ]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(console.warn);
    }
  }, [localStream]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isConnected) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConnected]);

  const isTrialSession = useMemo(() => {
    return isTrialRoute || !!(trialDetails?.trialClassId || trialDetails?.sessionType === "trial");
  }, [trialDetails, isTrialRoute]);

  const handleEndCall = useCallback(async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    try {
      if (isTrialSession && trialClassId) {
        if (userType === "student") {
          await studentTrialApi.completeTrialClass(trialClassId);
          await dispatch(fetchStudentProfile());
        } else {
          await dispatch(updateTrialClassStatus({ id: trialClassId, status: "completed" }));
        }
      } else if (!isTrialSession && sessionId && userType === "mentor") {
        await sessionApi.completeSession(sessionId);
      }

      endCall();
    } catch (e) {
        console.error("❌ End call error:", e);
    } finally {
      if (userType === "student") {
        if (isTrialSession && trialClassId) {
          navigate(ROUTES.COMMON.TRIAL_FEEDBACK.replace(":trialClassId", trialClassId));
        } else {
          navigate(ROUTES.STUDENT.DASHBOARD);
        }
      } else {
        if (!isTrialSession && sessionId) {
          navigate(`${ROUTES.MENTOR.STUDY_MATERIALS}?sessionId=${sessionId}`);
        } else {
          navigate(ROUTES.MENTOR.DASHBOARD);
        }
      }
    }
  }, [
    endCall,
    navigate,
    userType,
    trialClassId,
    sessionId,
    isTrialSession,
    dispatch,
  ]);

  useEffect(() => {
    if (!socket) return;
    const onCallEnded = () => handleEndCall();
    socket.on("call-ended", onCallEnded);
    return () => {
      socket.off("call-ended", onCallEnded);
    };
  }, [socket, handleEndCall]);

  if (initError) {
    return (
      <div className="min-h-screen bg-[#F4FBFB] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <VideoOff className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Initialization Failed</h2>
          <p className="text-gray-600 mb-8">{initError}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-[#1A1A80] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98]">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isPreparing) {
    return (
      <div className="min-h-screen bg-[#F4FBFB] flex items-center justify-center">
        <Loader size="lg" text="Preparing Classroom" color="teal" />
      </div>
    );
  }
  
  if (!hasUserJoined) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4FBFB]">
        <div className="bg-white p-10 rounded-3xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-6">Ready to Join?</h2>
          <button onClick={() => setHasUserJoined(true)} className="px-8 py-4 bg-[#3CB4B4] text-white font-bold rounded-xl hover:bg-[#329898]">
            Join Class
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8 bg-white/10 backdrop-blur rounded-2xl">
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button onClick={handleEndCall} className="px-6 py-3 bg-[#3CB4B4] text-white rounded-lg font-bold transition">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <ClassroomLayout
      sidebar={userType === "mentor" ? <ClassroomSidebar onLogout={() => navigate(ROUTES.LOGIN)} /> : null}
      header={<ClassroomHeader />}
      mainContent={
        <div className="space-y-8 animate-in fade-in duration-700">
          <ClassroomVideoGrid
            localVideoRef={localVideoRef}
            remoteStreams={remoteStreams}
            participants={participants}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            remoteMediaStates={remoteMediaStates}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onEndCall={handleEndCall}
            onMinimize={() => navigate(-1)}
            userType={userType}
            duration={callDuration}
            status={status}
          />
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {trialDetails?.subject?.subjectName || sessionDetails?.subjectId?.subjectName || 
               (isTrialSession ? "Aptus Trial Session" : "Aptus Live Session")}
            </h2>
            <h3 className="text-sm font-bold text-gray-800 mb-4">Personalized Mentoring Session</h3>
            <div className="space-y-1 mt-6">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {isTrialSession ? "Aptus Trial Session" : "Aptus Live Session"}
              </span>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">Experience the <span className="text-[#3CB4B4]">Future</span> of Online Learning</h1>
            </div>
          </div>
        </div>
      }
      rightPanel={
        <ClassroomRightPanel
          sessionId={effectiveId || ""}
          currentUser={{
            id: currentUser?.userId || "",
            name: currentUser?.name || "User",
            role: currentUser?.userType === "mentor" ? "Mentor" : "Student",
          }}
          participants={participantDetails}
          onFeedback={
            userType === "student" && isTrialSession && trialClassId
              ? () => navigate(ROUTES.COMMON.TRIAL_FEEDBACK.replace(":trialClassId", trialClassId))
              : undefined
          }
          isSocketConnected={isSocketConnected}
        />
      }
    />
  );
}
