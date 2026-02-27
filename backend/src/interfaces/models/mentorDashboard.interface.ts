export interface DashboardStats {
  totalClasses: number;
  upcomingToday: number;
  completed: number;
  joinNow: number;
  assignedStudents: number;
  pendingAssignments: number;
}

export interface TodaySessionDto {
  id: string;
  studentName: string;
  studentImage?: string | null;
  subject: string;
  grade: string;
  time: string;
  status: string;
  isJoinable: boolean;
  meetLink?: string | null;
}

export interface UpcomingClassDto {
  id: string;
  title: string;
  date: string;
  time: string;
  subject: string;
  grade: string;
}

export interface RecentActivityDto {
  id: string;
  type: "session";
  title: string;
  subtitle: string;
  time: string;
  icon: string;
}

export interface CalendarEventDto {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
}

export interface DashboardDataDto {
  stats: DashboardStats;
  todaySessions: TodaySessionDto[];
  upcomingClasses: UpcomingClassDto[];
  recentActivities: RecentActivityDto[];
  calendarEvents: CalendarEventDto[];
}

export interface AssignedStudentDto {
  id: string;
  fullName: string;
  email: string;
  profilePicture?: string | null;
  totalClasses: number;
  lastClassDate: Date;
}

export interface AssignedStudentsResponseDto {
  students: AssignedStudentDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalStudents: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}