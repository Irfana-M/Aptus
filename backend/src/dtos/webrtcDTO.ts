export interface JoinCallRequestDto {
  trialClassId: string;
  userId: string;
  userType: 'student' | 'mentor' ;
  socketId?: string ;
}
type RTCSdpType = 'offer' | 'answer' | 'pranswer' | 'rollback';
interface RTCSessionDescriptionInit {
  type: RTCSdpType;
  sdp?: string;
}
export interface WebRTCOfferDto {
  offer: RTCSessionDescriptionInit;
  trialClassId: string;
  toSocketId: string;
  fromUserId: string;
}

export interface WebRTCAnswerDto {
  answer: RTCSessionDescriptionInit;
  trialClassId: string;
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
  trialClassId: string;
  toSocketId: string;
  fromUserId: string;
}

export interface CallEndedDto {
  trialClassId: string;
  endedBy: string;
  reason?: string;
}

export interface UserJoinedDto {
  userId: string;
  userType: 'student' | 'mentor' | 'admin';
  socketId: string;
  trialClassId: string;
}