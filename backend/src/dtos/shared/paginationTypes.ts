export interface PaginationParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
  [key: string]: unknown;
}

export interface MentorPaginationParams extends PaginationParams {
  status?: 'pending' | 'approved' | 'rejected' | '';
  subject?: string;
}

export interface StudentPaginationParams extends PaginationParams {
  status?: 'active' | 'blocked' | '';
  verification?: 'verified' | 'pending' | '';
  trialClasses?: 'with_trial' | 'pending' | 'none' | '';
}

export interface CoursePaginationParams extends PaginationParams {
  status?: 'available' | 'booked' | 'ongoing' | 'completed' | 'cancelled' | '' | undefined;
  gradeId?: string | undefined;
  subjectId?: string | undefined;
  dayOfWeek?: number | undefined;
  timeSlot?: string | undefined;
  syllabus?: string | undefined;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// Added for terminology refactor mapping
export interface CoursePaginatedResult {
  courses: unknown[];
  total: number;
}
