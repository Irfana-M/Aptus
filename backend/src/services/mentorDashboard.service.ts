import { injectable, inject } from "inversify";
import { TYPES } from "@/types";
import type { IMentorDashboardService } from "@/interfaces/services/IMentorDashboardService";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import type { IMentorRepository } from "@/interfaces/repositories/IMentorRepository";
import type { IVideoCallRepository } from "@/interfaces/repositories/IVideoCallRepository";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import type { ITrialClassDocument } from "@/models/student/trialClass.model";
import type { ICourseRepository } from "@/interfaces/repositories/ICourseRepository";
import type { IStudyMaterialRepository } from "@/interfaces/repositories/IStudyMaterialRepository";
import type { ICourse } from "@/models/course.model";
import type { IStudyMaterial } from "../interfaces/models/studyMaterial.interface";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository";
import type { ISession } from "../interfaces/models/session.interface";
import type {
  DashboardDataDto,
  TodaySessionDto,
  UpcomingClassDto,
  RecentActivityDto,
  CalendarEventDto,
  AssignedStudentsResponseDto,
  DashboardStats,
} from "../interfaces/models/mentorDashboard.interface";

interface AssignedStudent {
  id: string;
  fullName: string;
  email: string;
  profilePicture: string | null;
  totalClasses: number;
  lastClassDate: Date;
}

@injectable()
export class MentorDashboardService implements IMentorDashboardService {
  constructor(
    @inject(TYPES.ITrialClassRepository) private trialClassRepo: ITrialClassRepository,
    @inject(TYPES.IMentorRepository) private mentorRepo: IMentorRepository,
    @inject(TYPES.IVideoCallRepository) private videoCallRepo: IVideoCallRepository,
    @inject(TYPES.ICourseRepository) private courseRepo: ICourseRepository,
    @inject(TYPES.IStudyMaterialRepository) private studyMaterialRepo: IStudyMaterialRepository,
    @inject(TYPES.ISessionRepository) private sessionRepo: ISessionRepository
  ) {}

  async getDashboardData(mentorId: string): Promise<DashboardDataDto> {
    try {
      logger.info(`Getting dashboard data for mentor: ${mentorId}`);

      const [allTrials, todayTrials, allCourses, allMaterials, upcomingSessions] = await Promise.all([
        this.trialClassRepo.findByMentorId(mentorId),
        this.trialClassRepo.findTodayTrialClasses(mentorId),
        this.courseRepo.findByMentor(mentorId) as Promise<ICourse[]>,
        this.studyMaterialRepo.findByMentor(mentorId),
        this.sessionRepo.findUpcomingByMentor(mentorId)
      ]);

      const stats = this.calculateStats(allTrials, todayTrials, allCourses, allMaterials, upcomingSessions);
      const todaySessions = this.formatTodaySessions(todayTrials); // We can merge regular sessions here too if needed
      const upcomingClasses = this.formatUpcomingClasses(allTrials).slice(0, 4);
      const recentActivities = this.formatCombinedActivities(allTrials, allMaterials, upcomingSessions).slice(0, 10);
      const calendarEvents = this.formatCalendarEvents(allTrials);

      return {
        stats,
        todaySessions,
        upcomingClasses,
        recentActivities,
        calendarEvents,
      };
    } catch (error) {
      logger.error(`Error getting dashboard data for mentor ${mentorId}`, error);
      throw new AppError("Failed to get dashboard data", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getAssignedStudents(
    mentorId: string,
    page = 1,
    limit = 10
  ): Promise<AssignedStudentsResponseDto> {
    try {
      const trialClasses = await this.trialClassRepo.findByMentorId(mentorId);

      const studentsMap = new Map<string, AssignedStudent>();

      for (const tc of trialClasses) {
        if (!tc.student || typeof tc.student !== "object") continue;

        const student = tc.student as unknown as { _id: { toString: () => string }; fullName: string; email: string; profilePicture: string };
        const studentId = student._id.toString();
        const existing = studentsMap.get(studentId);

        if (!existing) {
          studentsMap.set(studentId, {
            id: studentId,
            fullName: student.fullName || "Unknown",
            email: student.email || "",
            profilePicture: student.profilePicture || null,
            totalClasses: 1,
            lastClassDate: tc.preferredDate,
          });
        } else {
          existing.totalClasses++;
          if (tc.preferredDate > existing.lastClassDate) {
            existing.lastClassDate = tc.preferredDate;
          }
        }
      }

      const students = Array.from(studentsMap.values());
      const start = (page - 1) * limit;
      const paginated = students.slice(start, start + limit);

      return {
        students: paginated,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(students.length / limit),
          totalStudents: students.length,
          hasNext: start + limit < students.length,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error(`Error getting assigned students for mentor ${mentorId}`, error);
      throw new AppError("Failed to get assigned students", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTodaySessions(mentorId: string): Promise<TodaySessionDto[]> {
    const todayClasses = await this.trialClassRepo.findTodayTrialClasses(mentorId);
    return this.formatTodaySessions(todayClasses);
  }

  async getRecentActivities(mentorId: string, limit?: number): Promise<RecentActivityDto[]> {
    const effectiveLimit = limit ?? 10;
    const [classes, materials, sessions] = await Promise.all([
      this.trialClassRepo.findByMentorId(mentorId),
      this.studyMaterialRepo.findByMentor(mentorId),
      this.sessionRepo.findUpcomingByMentor(mentorId)
    ]);
    return this.formatCombinedActivities(classes, materials, sessions).slice(0, effectiveLimit);
  }

  // ──────────────────────────────────────────────────────────────────
  // Private Helpers (Pure, Typed, Reusable)
  // ──────────────────────────────────────────────────────────────────

  private calculateStats(
    allTrials: ITrialClassDocument[], 
    todayTrials: ITrialClassDocument[],
    courses: ICourse[],
    materials: IStudyMaterial[],
    sessions: ISession[]
  ): DashboardStats {
    const completed = allTrials.filter(c => c.status === "completed").length;
    
    // Check sessions/trials for today
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    const todaySessionsCount = sessions.filter(s => {
        const start = new Date(s.startTime);
        return start >= startOfToday && start <= endOfToday && s.status === 'scheduled';
    }).length;

    const upcomingToday = todayTrials.filter(c => c.status === "assigned").length + todaySessionsCount;
    const joinNow = todayTrials.filter(c => c.status === "assigned" && this.isClassJoinable(c)).length;
    const pendingAssignments = materials.filter(m => m.materialType === "assignment").length;

    return {
      totalClasses: allTrials.length + sessions.length,
      upcomingToday,
      completed, // Ideally add completed sessions too
      joinNow,
      assignedStudents: courses.length,
      pendingAssignments,
    };
  }

  private formatTodaySessions(classes: ITrialClassDocument[]): TodaySessionDto[] {
    return classes
      .filter(c => c.status === "assigned")
      .sort((a, b) => a.preferredTime.localeCompare(b.preferredTime))
      .map(c => {
        const student = typeof c.student === "object" ? (c.student as unknown as { fullName: string; profilePicture: string }) : null;
        const subject = typeof c.subject === "object" ? (c.subject as unknown as { subjectName: string; grade: string }) : null;

        return {
          id: c._id.toString(),
          studentName: student?.fullName || "Unknown Student",
          studentImage: student?.profilePicture || null,
          subject: subject?.subjectName || "Unknown Subject",
          grade: subject?.grade || "N/A",
          time: c.preferredTime,
          status: c.status,
          isJoinable: this.isClassJoinable(c),
          meetLink: c.meetLink || null,
        };
      });
  }

  private formatUpcomingClasses(classes: ITrialClassDocument[]): UpcomingClassDto[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return classes
      .filter(c => {
        const classDate = new Date(c.preferredDate);
        classDate.setHours(0, 0, 0, 0);
        return classDate > today && c.status === "assigned";
      })
      .sort((a, b) => a.preferredDate.getTime() - b.preferredDate.getTime())
      .map(c => {
        const student = typeof c.student === "object" ? (c.student as unknown as { fullName: string }) : null;
        const subject = typeof c.subject === "object" ? (c.subject as unknown as { subjectName: string; grade: string }) : null;

        return {
          id: c._id.toString(),
          title: `Class with ${student?.fullName || "Student"}`,
          date: c.preferredDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          time: c.preferredTime,
          subject: subject?.subjectName || "Unknown",
          grade: subject?.grade || "N/A",
        };
      });
  }

  private formatCombinedActivities(classes: ITrialClassDocument[], materials: IStudyMaterial[], sessions: ISession[]): RecentActivityDto[] {
    const activities: (RecentActivityDto & { rawDate: Date })[] = [];

    // Process trial classes
    classes.forEach(c => {
      const student = typeof c.student === "object" ? (c.student as unknown as { fullName: string }) : null;
      const subject = typeof c.subject === "object" ? (c.subject as unknown as { subjectName: string }) : null;
      const studentName = student?.fullName || "Student";
      
      // New schedule activity (based on createdAt)
      activities.push({
        id: `schedule-${c._id}`,
        type: "schedule",
        title: `Trial class scheduled with ${studentName}`,
        subtitle: subject?.subjectName || "Subject",
        time: this.formatTimeAgo(c.createdAt),
        rawDate: c.createdAt
      });

      // Completed session activity (based on updatedAt)
      if (c.status === "completed") {
        activities.push({
          id: `session-${c._id}`,
          type: "session",
          title: `Completed trial class with ${studentName}`,
          subtitle: subject?.subjectName || "Subject",
          time: this.formatTimeAgo(c.updatedAt || c.createdAt),
          rawDate: c.updatedAt || c.createdAt
        });
      }
    });

    // Process regular sessions
    sessions.forEach(s => {
        const student = typeof s.studentId === 'object' ? (s.studentId as any)?.fullName : 'Student';
        const subject = typeof s.subjectId === 'object' ? (s.subjectId as any)?.subjectName : 'Subject';

        if (s.status === 'cancelled') {
            activities.push({
                id: `cancel-${s.id}`,
                type: 'session',
                title: `Session cancelled with ${student}`,
                subtitle: `${subject}${s.cancellationReason ? ` - ${s.cancellationReason}` : ''}`,
                time: this.formatTimeAgo(s.updatedAt || new Date()),
                rawDate: s.updatedAt || new Date()
            });
        }
        
        if (s.status === 'rescheduling') {
            activities.push({
                id: `resched-${s.id}`,
                type: 'schedule',
                title: `Session needs rescheduling with ${student}`,
                subtitle: subject,
                time: this.formatTimeAgo(s.updatedAt || new Date()),
                rawDate: s.updatedAt || new Date()
            });
        }
    });

    // Process materials
    materials.forEach(m => {
      const subject = typeof m.subjectId === "object" ? (m.subjectId as unknown as { subjectName: string }) : null;
      const typeLabel = m.materialType === "assignment" ? "assignment" : "study material";
      
      activities.push({
        id: `upload-${m._id}`,
        type: "upload",
        title: `New ${typeLabel} uploaded: ${m.title}`,
        subtitle: subject?.subjectName || "Subject",
        time: this.formatTimeAgo((m as any).createdAt),
        rawDate: (m as any).createdAt
      });
    });

    // Sort by date and return
    return activities
      .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime())
      .map(({ rawDate, ...rest }) => rest);
  }

  private formatCalendarEvents(classes: ITrialClassDocument[]): CalendarEventDto[] {
    return classes.map(c => {
      const student = typeof c.student === "object" ? (c.student as unknown as { fullName: string }) : null;
      const [h = "0", m = "0"] = c.preferredTime.split(":");
      const start = new Date(c.preferredDate);
      start.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      return {
        id: c._id.toString(),
        title: `Trial Class with ${student?.fullName || "Student"}`,
        start,
        end,
        status: c.status,
      };
    });
  }

  private isClassJoinable(trial: ITrialClassDocument): boolean {
    const now = new Date();
    const classDate = new Date(trial.preferredDate);
    const [h = 0, m = 0] = trial.preferredTime.split(":").map(Number);

    if (isNaN(h) || isNaN(m)) return false;

    const classTime = new Date(classDate);
    classTime.setHours(h, m, 0, 0);

    const tenMinBefore = new Date(classTime.getTime() - 10 * 60 * 1000);
    const oneHourAfter = new Date(classTime.getTime() + 60 * 60 * 1000);

    return now >= tenMinBefore && now <= oneHourAfter;
  }

  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    const intervals = [
      { label: "year", secs: 31536000 },
      { label: "month", secs: 2592000 },
      { label: "day", secs: 86400 },
      { label: "hour", secs: 3600 },
      { label: "minute", secs: 60 },
    ];

    for (const { label, secs } of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) {
        return count === 1 ? `1 ${label} ago` : `${count} ${label}s ago`;
      }
    }
    return "Just now";
  }
}