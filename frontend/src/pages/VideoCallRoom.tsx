import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useVideoCall } from "../context/videoCallContextStore";
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
    trialClassId?: string;
    sessionId?: string;
  }>();

  const isTrialRoute = !!trialClassId;
  const effectiveId = trialClassId || sessionId;

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [isPreparing, setIsPreparing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [trialDetails, setTrialDetails] = useState<TrialClassResponse | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Redux
  const authUser = useSelector(selectCurrentUser);

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

// Participant list for both trial and regular sessions
const participantDetails = useMemo(() => {
  const list = [
    {
      id: currentUser?.userId || "me",
      name: currentUser?.name || "You",
      role: currentUser?.userType || ("student" as const),
    },
  ];

  // Helper to avoid adding the current user again
  const addParticipantIfNotMe = (id: string, name: string, role: "student" | "mentor") => {
    if (id && id !== userId) {
      list.push({ id, name, role });
    }
  };

  if (trialDetails) {
    if (userType === "student" && trialDetails.mentor) {
      const m = trialDetails.mentor;
      addParticipantIfNotMe(
        typeof m === "string" ? m : m.id,
        typeof m === "string" ? "Mentor" : m.name,
        "mentor"
      );
    } else if (userType === "mentor" && trialDetails.student) {
      const s = trialDetails.student;
      addParticipantIfNotMe(
        typeof s === "string" ? s : s.id,
        typeof s === "string" ? "Student" : s.fullName,
        "student"
      );
    }
  }

  if (sessionDetails) {
    if (sessionDetails.student) {
      const s = sessionDetails.student;
      addParticipantIfNotMe(
        s._id || s.id || s,
        s.fullName || "Student",
        "student"
      );
    }
    if (sessionDetails.mentor) {
      const m = sessionDetails.mentor;
      addParticipantIfNotMe(
        m._id || m.id || m,
        m.fullName || "Mentor",
        "mentor"
      );
    }
  }

  return list;
}, [currentUser, userId, trialDetails, sessionDetails, userType]);

  // Redirect if no user
  useEffect(() => {
    if (!currentUser) {
      const t = setTimeout(() => navigate(ROUTES.LOGIN), 600);
      return () => clearTimeout(t);
    }
  }, [currentUser, navigate]);

  // Prepare + Fetch details
  useEffect(() => {
    if (!userId || !effectiveId || hasInitializedRef.current) return;

    let mounted = true;

    const prepareCall = async () => {
      hasInitializedRef.current = true;
      setIsPreparing(true);
      setInitError(null);

      if (!prepareForVideoCall(userType)) {
        const msg = "Failed to prepare video call environment.";
        dispatch(setError(msg));
        setInitError(msg);
        setIsPreparing(false);
        return;
      }

      try {
        if (isTrialRoute && trialClassId) {
          const details = await studentTrialApi.getTrialClassById(trialClassId);
          if (mounted) setTrialDetails(details);
        } else if (sessionId) {
          const response = await sessionApi.getSessionById(sessionId);
          if (mounted) setSessionDetails(response.data || response);
        }

        await dispatch(verifyUserRole(userType)).unwrap();
      } catch (err: any) {
        console.warn("Initialization failed:", err);
        if (mounted) setInitError(err.message || "Failed to load session");
      } finally {
        if (mounted) setIsPreparing(false);
      }
    };

    prepareCall();

    return () => { mounted = false; };
  }, [userId, effectiveId, trialClassId, sessionId, isTrialRoute, userType, dispatch, navigate]);

  const {
    localStream,
    remoteStreams,
    participants,
    isConnected,
    error: contextError,
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

  // Join the call
  useEffect(() => {
    if (isPreparing || !effectiveId || !userId || !userType || hasJoinedRef.current) return;

    console.log("🚀 [VideoCall] Attempting to join call...", { effectiveId, userId, userType });
    hasJoinedRef.current = true;

    joinCall({
      sessionId: effectiveId,
      userId,
      userType: userType as "mentor" | "student",
    });
  }, [isPreparing, effectiveId, userId, userType, joinCall]);

  // Attach local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(console.warn);
    }
  }, [localStream]);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isConnected) {
      timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isConnected]);

  const isTrialSession = useMemo(() => {
    return isTrialRoute || !!(trialDetails?.trialClassId || trialDetails?.sessionType === "trial");
  }, [isTrialRoute, trialDetails]);

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
      } else if (sessionId && userType === "mentor") {
        await sessionApi.completeSession(sessionId);
      }
      endCall();
    } catch (e) {
      console.error("End call error:", e);
    } finally {
      if (userType === "student") {
        navigate(isTrialSession && trialClassId
          ? ROUTES.COMMON.TRIAL_FEEDBACK.replace(":trialClassId", trialClassId)
          : ROUTES.STUDENT.DASHBOARD);
      } else {
        navigate(sessionId
          ? `${ROUTES.MENTOR.STUDY_MATERIALS}?sessionId=${sessionId}`
          : ROUTES.MENTOR.DASHBOARD);
      }
    }
  }, [endCall, navigate, userType, trialClassId, sessionId, isTrialSession, dispatch]);

  // Socket "call-ended" listener
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
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-[#1A1A80] text-white font-bold py-3.5 rounded-xl hover:bg-[#2A2A90]"
          >
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

  if (contextError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center p-8 bg-white/10 backdrop-blur rounded-2xl">
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-gray-300 mb-6">{contextError}</p>
          <button onClick={handleEndCall} className="px-6 py-3 bg-[#3CB4B4] text-white rounded-lg font-bold">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ClassroomLayout
      sidebar={userType === "mentor" ? <ClassroomSidebar onLogout={() => navigate(ROUTES.LOGIN)} /> : null}
      header={<ClassroomHeader />}
      mainContent={
        <div className="h-full flex flex-col animate-in fade-in duration-700">
          <div className="flex-1 min-h-0">
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
              participantDetails={participantDetails}
            />
          </div>

          <div className="flex-shrink-0 bg-white rounded-3xl p-4 shadow-sm mx-4 mb-2">
            <h2 className="text-base font-bold text-gray-800">
              {trialDetails?.subject?.subjectName || 
               sessionDetails?.subject?.subjectName || 
               (isTrialSession ? "Aptus Trial Session" : "Aptus Live Session")}
            </h2>
            <h3 className="text-xs font-semibold text-gray-500">Personalized Mentoring Session</h3>
          </div>
        </div>
      }
      rightPanel={
        <ClassroomRightPanel
          sessionId={effectiveId || ""}
          currentUser={{
            id: currentUser?.userId || "",
            name: currentUser?.name || "User",
            role: userType === "mentor" ? "Mentor" : "Student",
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