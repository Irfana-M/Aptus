export interface MentorProfile {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  location?: string;
  bio?: string;

  academicQualifications: {
    institutionName: string;
    institution?: string;
    degree: string;
    graduationYear: string;
    year?: string | number;
  }[];
  experiences: {
    institution?: string;
    company?: string;
    jobTitle: string;
    role?: string;
    duration: string;
  }[];
  certification: {
    name: string;
    issuingOrganization: string;
  }[];
  subjectProficiency: {
    subject: string;
    level: "basic" | "intermediate" | "expert";
  }[];
  profilePicture?: string;
  profileImageUrl?: string;
  profileImageKey?: string;
  availability?: {
    day: string;
    slots: {
      startTime: string;
      endTime: string;
    }[];
    timezone?: string;
  }[];
  rating?: number;
  totalRatings?: number;
  expertise?: string[];
  maxStudentsPerWeek?: number;
  currentWeeklyBookings?: number;
  isActive?: boolean;
  isVerified?: boolean;
  isProfileComplete?: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  isBlocked?: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalClasses: number;
  upcomingToday: number;
  completed: number;
  joinNow: number;
  assignedStudents: number;
  pendingAssignments: number;
}

export interface Activity {
  id: string;
  type: "session" | "upload" | "schedule";
  title: string;
  subtitle?: string;
  time: string;
}

export interface DashboardData {
  stats: DashboardStats;
  todaySessions: any[];
  upcomingClasses: any[];
  recentActivities: Activity[];
  calendarEvents: any[];
}

export interface MentorState {
  profile: MentorProfile | null;
  pendingMentors: MentorProfile[];
  trialClasses: any[]; // Will be updated with TrialClass from trial types if needed
  courses: any[]; // Will be updated with Course from course types if needed
  loading: boolean;
  trialClassesError: string | null;
  assignments: any[];
  assignmentsLoading: boolean;
  assignmentsError: string | null;
  dashboardData: DashboardData | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  error: string | null;
}
