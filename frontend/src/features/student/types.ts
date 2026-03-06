import type { StudentProfile, Enrollment } from "../../types/student.types";
import type { Course } from "../../types/course.types";

export interface StudentState {
  profile: StudentProfile | null;
  courses: Course[];
  enrollments: Enrollment[];
  courseRequestStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  loading: boolean;
  error: string | null;
  performance: any | null;
  performanceLoading: boolean;
  assignments: any[];
  assignmentsLoading: boolean;
  assignmentsError: string | null;
}
