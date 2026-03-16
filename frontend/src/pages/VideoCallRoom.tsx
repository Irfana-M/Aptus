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
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [isPreparing, setIsPreparing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [hasUserJoined, setHasUserJoined] = useState(false);
  const [trialDetails, setTrialDetails] = useState<TrialClassResponse | null>(
    null,
  );
  const [callDuration, setCallDuration] = useState(0);

  // redux / auth
  const authUser = useSelector(selectCurrentUser);
  const roleFromStore = useSelector((state: RootState) => state.role.role);
  const userIdFromStore = useSelector((state: RootState) => state.role.userId);
  const roleLoading = useSelector((state: RootState) => state.role.loading);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const hasJoinedRef = useRef(false);

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

    return list;
  }, [currentUser, trialDetails, userType]);

  // If we don't have a minimal currentUser, redirect to login quickly
  useEffect(() => {
    if (!currentUser) {
      const t = setTimeout(() => {
        if (!currentUser) navigate(ROUTES.LOGIN);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [currentUser, navigate]);

  const hasInitializedRef = useRef(false);

  const stableUserId = currentUser?.userId;
  const stableUserType = currentUser?.userType;

  useEffect(() => {
    if (!stableUserId || !effectiveId) return;
    if (hasInitializedRef.current) {
      if (isPreparing && !roleLoading && roleFromStore) {
        console.log(
          "🩹 [VideoCall] Already initialized, clearing preparing state.",
        );
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
        console.log("🔄 [VideoCall] Fetching session/trial details...");
        try {
          if (trialClassId) {
            const details =
              await studentTrialApi.getTrialClassById(trialClassId);
            if (mounted) {
              setTrialDetails(details);

              if (
                details.status === "completed" ||
                details.status === "cancelled"
              ) {
                console.log(
                  `🚫 [VideoCall] Session is ${details.status}, redirecting...`,
                );

                const isTrial = !!(
                  details.trialClassId ||
                  details.sessionType === "trial" ||
                  (
                    details as unknown as Record<
                      string,
                      Record<string, unknown>
                    >
                  ).course?.isTrial
                );

                if (
                  userType === "student" &&
                  details.status === "completed" &&
                  isTrial
                ) {
                  navigate(
                    ROUTES.COMMON.TRIAL_FEEDBACK.replace(
                      ":trialClassId",
                      trialClassId,
                    ),
                  );
                } else {
                  navigate(
                    userType === "mentor"
                      ? ROUTES.MENTOR.DASHBOARD
                      : ROUTES.STUDENT.DASHBOARD,
                  );
                }
                return;
              }
            }
          } else {
            console.log(
              "ℹ️ [VideoCall] Joining regular session, skipping trial details fetch.",
            );
          }
        } catch (fetchError) {
          console.warn("⚠️ [VideoCall] Could not fetch details:", fetchError);
        }

        console.log("🔄 [VideoCall] Verifying role...");
        await dispatch(verifyUserRole(stableUserType)).unwrap();
        console.log("✅ [VideoCall] Initialization successful");
      } catch (err: unknown) {
        const error = err as Error;
        console.warn("❌ [VideoCall] Initialization failed:", error);
        if (mounted) {
          setInitError(error.message || "Failed to verify user permissions.");
          hasInitializedRef.current = false; // Allow retry on failure
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

  const hasEndedRef = useRef(false);

  useEffect(() => {
    const activeUserId = userIdFromStore || stableUserId || userId;
    const activeRole = roleFromStore || stableUserType || userType;

    console.log(" [VideoCall] Join check:", {
      isPreparing,
      roleLoading,
      effectiveId,
      activeUserId,
      activeRole,
      joinAttempted,
      hasJoined: hasJoinedRef.current,
      roleFromStore,
      userIdFromStore,
    });

    if (
      isPreparing ||
      roleLoading ||
      !effectiveId ||
      !activeUserId ||
      !activeRole||
      !hasUserJoined
    )
      return;
    if (!TokenManager.getToken()) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (!hasJoinedRef.current) {
      console.log("🚀 [VideoCall] Attempting to join call...", {
        effectiveId,
        userId: activeUserId,
        userType: activeRole,
      });
      hasJoinedRef.current = true;
      setJoinAttempted(true);

      const isTrial = !!trialClassId;
      const sessionType: 'trial' | 'regular' = isTrial ? 'trial' : 'regular';
      const sessionMode: 'one-to-one' | 'group' = 'one-to-one'; // Default for now, can be enhanced

      joinCall({
        sessionId: effectiveId,
        sessionType,
        sessionMode,
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
      if (localVideoRef.current.srcObject !== localStream) {
        console.log("📹 [VideoCall] Attaching local stream");
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current
        .play()
        .catch((e) => console.warn("Local video play failed:", e));
    }
  }, [localStream, isPreparing, joinAttempted]); // Trigger on join state changes too

  // Remote stream management is now handled inside ClassroomVideoGrid via RemoteVideoPlayer

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
    if (trialClassId) return true;
    if (sessionId) return false;
    if (!trialDetails) return false;

    return !!(
      trialDetails.trialClassId ||
      trialDetails.sessionType === "trial" ||
      (trialDetails as unknown as { course?: { isTrial?: boolean } }).course
        ?.isTrial
    );
  }, [trialDetails, trialClassId, sessionId]);

  const handleEndCall = useCallback(async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    console.log("🏁 [VideoCall] handleEndCall triggered.", {
      isTrialSession,
      trialClassId,
      sessionId,
      userType,
    });

    try {
      if (isTrialSession && trialClassId) {
        if (userType === "student") {
          console.log(
            "🏁 [VideoCall] Student ending trial class:",
            trialClassId,
          );
          try {
            await studentTrialApi.completeTrialClass(trialClassId);
            await dispatch(fetchStudentProfile());
          } catch (e) {
            console.error("❌ Failed to complete trial:", e);
          }
        }
      } else if (!isTrialSession && sessionId && userType === "mentor") {
        console.log("🏁 [VideoCall] Mentor ending regular session:", sessionId);
        try {
          await sessionApi.completeSession(sessionId);
        } catch (e) {
          console.error("❌ Failed to complete regular session:", e);
        }
      }

      endCall();
    } finally {
      if (userType === "student") {
        if (isTrialSession) {
          navigate(
            ROUTES.COMMON.TRIAL_FEEDBACK.replace(
              ":trialClassId",
              trialClassId || "",
            ),
          );
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

    const onCallEnded = () => {
      console.log("📩 [VideoCall] Received call-ended event from socket");
      handleEndCall();
    };

    socket.on("call-ended", onCallEnded);
    return () => {
      socket.off("call-ended", onCallEnded);
    };
  }, [socket, handleEndCall]);

  if (initError) {
    return (
      <div className="min-h-screen bg-[#F4FBFB] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-red-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <VideoOff className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-outfit">
            Initialization Failed
          </h2>
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
        <Loader size="lg" text="Preparing Classroom" color="teal" />
      </div>
    );
  }
  if (!hasUserJoined) {
  return (
    <div className="h-screen flex items-center justify-center bg-[#F4FBFB]">
      <div className="bg-white p-10 rounded-3xl shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-6">Ready to Join?</h2>

        <button
          onClick={() => setHasUserJoined(true)}
          className="px-8 py-4 bg-[#3CB4B4] text-white font-bold rounded-xl hover:bg-[#329898]"
        >
          Join Class
        </button>
      </div>
    </div>
  );
}

  if (error) {
    console.log("Call state:", { isConnected });
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
      sidebar={
        userType === "mentor" ? (
          <ClassroomSidebar onLogout={() => navigate(ROUTES.LOGIN)} />
        ) : null
      }
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
              {trialDetails?.subject?.subjectName ||
                (isTrialSession ? "Aptus Trial Session" : "Aptus Live Session")}
            </h2>
            <h3 className="text-sm font-bold text-gray-800 mb-4">
              Personalized Mentoring Session
            </h3>

            <div className="space-y-1 mt-6">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {isTrialSession ? "Aptus Trial Session" : "Aptus Live Session"}
              </span>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                Experience the <span className="text-[#3CB4B4]">Future</span> of
                Online Learning
              </h1>
            </div>
            {isTrialSession && (
              <p className="text-gray-400 text-sm mt-2 leading-relaxed max-w-md">
                This trial session is designed to evaluate your learning goals
                and match you with the perfect educational path.
              </p>
            )}
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
            userType === "student" && isTrialSession
              ? () =>
                  navigate(
                    ROUTES.COMMON.TRIAL_FEEDBACK.replace(
                      ":trialClassId",
                      trialClassId || "",
                    ),
                  )
              : undefined
          }
          isSocketConnected={isSocketConnected}
        />
      }
    />
  );
}
