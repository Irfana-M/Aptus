export interface JoinCallRequestDto {
  sessionId: string;
  userId: string;
  userType: 'student' | 'mentor';
  socketId?: string;
}
type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';
interface RTCSessionDescriptionInit {
  type: RTCSdpType;
  sdp?: string;
}
export interface WebRTCOfferDto {
  offer: RTCSessionDescriptionInit;
  sessionId: string;
  toSocketId: string;
  fromUserId: string;
}

export interface WebRTCAnswerDto {
  answer: RTCSessionDescriptionInit;
  sessionId: string;
  toSocketId: string;
  fromUserId: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

export interface WebRTCIceCandidateDto {
  candidate: RTCIceCandidateInit;
  sessionId: string;
  toSocketId: string;
  fromUserId: string;
}

export interface CallEndedDto {
  sessionId: string;
  endedBy: string;
  reason?: string;
}

export interface UserJoinedDto {
  userId: string;
  userType: 'student' | 'mentor' | 'admin';
  socketId: string;
  sessionId: string;
  userEmail?: string;
}