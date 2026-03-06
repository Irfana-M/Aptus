export interface IAttendance {
    _id: string;
    sessionId: string;
    sessionModel?: 'Session' | 'TrialClass';
    userId: string;
    userRole: 'student' | 'mentor' | 'Student' | 'Mentor';
    status: 'present' | 'absent';
    isFinalized: boolean;
    source?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PopulatedAttendance extends Omit<IAttendance, 'sessionId' | 'userId'> {
    sessionId: {
        _id: string;
        subjectId?: { _id: string; subjectName: string };
        subject?: { _id: string; subjectName: string };
        sessionType?: 'one-to-one' | 'group';
        startTime?: string;
        endTime?: string;
    } | null;
    userId: {
        _id: string;
        fullName: string;
        email: string;
        profilePicture?: string;
        profileImage?: string;
    } | null;
}

export interface AttendanceState {
    history: PopulatedAttendance[];
    loading: boolean;
    error: string | null;
}
