import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminAuthApi, adminCourseApi, adminStudentApi, adminRequestsApi, adminMentorRequestApi, type AddStudentRequestDto, type AddStudentResponseDto, type AdminLoginDto, type StudentsWithStatsResponse, type PaginationMeta } from "./adminApi";
import type { AdminLoginResponse } from "../../types/dto/auth.dto";
import { adminMentorApi } from "./adminApi";
import type { RootState } from "../../app/store";
import type { MentorProfile } from "../mentor/types";
import type { StudentBaseResponseDto, CourseRequest, SubscriptionDetails } from "../../types/student.types";
import type { StudentProfile } from "../../types/student.types";
import type { TrialClass } from "../../types/trial.types";
import { logger } from "../../utils/logger";
import { getApiErrorMessage, getErrorMessage } from "../../utils/errorUtils";
import type { MentorRequestListItem } from "../../types/admin.types";
import type { Enrollment } from "../../types/student.types";
import { z } from 'zod';
import { 
  adminCreateStudentSchema, 
  type AdminCreateStudentInput 
} from '../../lib/schemas/student.schemas';
import { clearCourseCreationState } from "./adminSlice";
import type { Course } from "../../types/course.types";



export interface AvailableMentorDto {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  profilePicture?: string | null;
  profileImageUrl?: string | null;
  rating: number;
  bio?: string;
  level?: "intermediate" | "expert";
  subjectProficiency?: {
    subject: string;
    level: "basic" | "intermediate" | "expert";
  }[];
  availability?: {
    day: string;
    slots: {
      startTime: string;
      endTime: string;
      isBooked: boolean;
    }[];
  }[];
  hasConflict?: boolean;
}

export const adminLoginThunk = createAsyncThunk<
  AdminLoginResponse,
  AdminLoginDto,
  { rejectValue: string }
>("admin/login", async (payload, { rejectWithValue }) => {
  try {
    const response = await adminAuthApi.login(payload);
    console.log("🔐 Thunk: API Response received", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      hasAccessToken: !!response.data.accessToken,
      hasAdmin: !!response.data.admin,
    });

    if (response.data.accessToken) {
        localStorage.setItem("admin_accessToken", response.data.accessToken);
    }

    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Login failed"));
  }
});

export const refreshAdminToken = createAsyncThunk<
  AdminLoginResponse,
  void,
  { rejectValue: string }
>(
  "admin/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAuthApi.refreshToken();
      if (response.data.accessToken) {
          localStorage.setItem("admin_accessToken", response.data.accessToken);
      }
      return response.data;
    } catch (error: unknown) {
      localStorage.removeItem("admin_accessToken");
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to refresh token")
      );
    }
  }
);

export const fetchAllMentorsAdmin = createAsyncThunk<
  MentorProfile[],
  void,
  { rejectValue: string }
>("admin/fetchAllMentors", async (_, { rejectWithValue }) => {
  try {
    const response = await adminMentorApi.fetchAllMentors();

    const data = response.data as unknown;

    if (Array.isArray(data)) {
      return data as MentorProfile[];
    } else if (data && typeof data === 'object') {
      const obj = data as Record<string, any>;
      // Standardized format: { success: true, data: { items: [], pagination: {} } }
      if (obj.data && typeof obj.data === 'object' && Array.isArray(obj.data.items)) {
        return obj.data.items as MentorProfile[];
      }
      // Legacy data wrapper: { success: true, data: [] }
      if (obj.data && Array.isArray(obj.data)) {
        return obj.data as MentorProfile[];
      }
      // Direct mentors property
      if (obj.mentors && Array.isArray(obj.mentors)) {
        return obj.mentors as MentorProfile[];
      }
      return rejectWithValue("Unexpected response format from server");
    } else {
      return rejectWithValue("Unexpected response format from server");
    }
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch mentors")
    );
  }
});

// New paginated mentor thunk for server-side pagination and search
export interface MentorPaginatedResponse {
  mentors: MentorProfile[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface MentorFetchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected' | '';
  subject?: string;
}

export const fetchMentorsPaginated = createAsyncThunk<
  MentorPaginatedResponse,
  MentorFetchParams,
  { rejectValue: string }
>("admin/fetchMentorsPaginated", async (params, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchMentorsPaginated", params);
    
    const response = await adminMentorApi.fetchAllMentors(params);
    
    const data = response.data as any;
    
    // Handle standardized paginated response: { success: true, data: { items: [], pagination: {} } }
    if (data && data.success && data.data && typeof data.data === 'object' && Array.isArray(data.data.items) && data.data.pagination) {
      logger.info(`✅ Successfully fetched ${data.data.items.length} mentors (page ${data.data.pagination.currentPage})`);
      return {
        mentors: data.data.items,
        pagination: data.data.pagination,
      };
    }

    // Handle PaginatedResponse format: { success: true, data: [], pagination: {} }
    if (data && data.success && Array.isArray(data.data) && data.pagination) {
      logger.info(`✅ Successfully fetched ${data.data.length} mentors (page ${data.pagination.currentPage})`);
      return {
        mentors: data.data,
        pagination: data.pagination,
      };
    }
    
    // Fallback: If server returns old format (array), wrap it in paginated structure
    if (Array.isArray(response.data)) {
      logger.info(`✅ Received legacy format, ${response.data.length} mentors`);
      return {
        mentors: response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.length,
          itemsPerPage: response.data.length,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    
    return rejectWithValue("Unexpected response format from server");
  } catch (error: unknown) {
    logger.error("❌ Error fetching paginated mentors:", error);
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch mentors")
    );
  }
});

export const fetchMentorProfileAdmin = createAsyncThunk<
  MentorProfile,
  string,
  { state: RootState }
>("admin/fetchMentorProfile", async (mentorId, thunkAPI) => {
  try {
    const response = await adminMentorApi.fetchMentorProfile(mentorId);
    
    // Check if response.data has a 'data' property (standard API wrapper)
    const responseData = response.data as Record<string, unknown>;
    if (responseData.data) {
        return responseData.data as unknown as MentorProfile;
    }
    // Otherwise assume response.data IS the profile
    return response.data as unknown as MentorProfile;
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch mentor")
    );
  }
});

export const approveMentorAdmin = createAsyncThunk<
  { message: string },
  string,
  { state: RootState }
>("admin/approveMentor", async (mentorId, thunkAPI) => {
  try {
    const response = await adminMentorApi.approveMentor(mentorId);
    return { message: response.data.message };
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      getApiErrorMessage(error, "Failed to approve mentor")
    );
  }
});

export const rejectMentorAdmin = createAsyncThunk<
  { message: string },
  { mentorId: string; reason: string },
  { state: RootState }
>("admin/rejectMentor", async ({ mentorId, reason }, thunkAPI) => {
  try {
    const response = await adminMentorApi.rejectMentor(mentorId, reason);
    return { message: response.data.message };
  } catch (error: unknown) {
    return thunkAPI.rejectWithValue(
      getApiErrorMessage(error, "Failed to reject mentor")
    );
  }
});

export const blockMentorAdmin = createAsyncThunk<
  MentorProfile,
  string,
  { rejectValue: string }
>("admin/blockMentor", async (mentorId, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminMentorApi.blockMentor(mentorId);
    
    // Refresh the mentors list to ensure UI is in sync
    dispatch(fetchAllMentorsAdmin());
    
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to block mentor")
    );
  }
});

export const unblockMentorAdmin = createAsyncThunk<
  MentorProfile,
  string,
  { rejectValue: string }
>("admin/unblockMentor", async (mentorId, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminMentorApi.unblockMentor(mentorId);
    
    // Refresh the mentors list to ensure UI is in sync
    dispatch(fetchAllMentorsAdmin());
    
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to unblock mentor")
    );
  }
});

export const blockStudentAdmin = createAsyncThunk<
  StudentBaseResponseDto,
  string,
  { rejectValue: string }
>("admin/blockStudent", async (studentId, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminStudentApi.blockStudent(studentId);
    
    // Refresh the students list to ensure UI is in sync
    dispatch(fetchAllStudentsAdmin());
    
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to block student")
    );
  }
});

export const unblockStudentAdmin = createAsyncThunk<
  StudentBaseResponseDto,
  string,
  { rejectValue: string }
>("admin/unblockStudent", async (studentId, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminStudentApi.unblockStudent(studentId);
    
    // Refresh the students list to ensure UI is in sync
    dispatch(fetchAllStudentsAdmin());
    
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to unblock student")
    );
  }
});
export const updateMentorAdmin = createAsyncThunk<
  MentorProfile,
  { mentorId: string; data: Partial<MentorProfile> },
  { rejectValue: string }
>("admin/updateMentor", async ({ mentorId, data }, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminMentorApi.updateMentor(mentorId, data);
    dispatch(fetchAllMentorsAdmin());
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update mentor")
    );
  }
});


export const addMentorAdmin = createAsyncThunk<
  MentorProfile,
  Partial<MentorProfile>,
  { rejectValue: string }
>("admin/addMentor", async (mentorData, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminMentorApi.addMentor(mentorData);
    dispatch(fetchAllMentorsAdmin());
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to add mentor")
    );
  }
});

export const fetchAllStudentsAdmin = createAsyncThunk<
  StudentBaseResponseDto[],
  void,
  { rejectValue: string }
>("admin/fetchAllStudents", async (_, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchAllStudentsAdmin");

    // Use the new endpoint with large limit to get all students
    const response = await adminStudentApi.getStudentsWithStats({ page: 1, limit: 1000 });

    const data = response.data as any;
    if (!data?.success) {
      logger.error("❌ API returned unsuccessful response:", data);
      return rejectWithValue(data?.message || "Failed to fetch students");
    }

    // Standardized format: { data: { items: [] } } or { data: { students: [] } }
    const students = data.data?.items || data.data?.students || (Array.isArray(data.data) ? data.data : []);

    const validatedStudents = (students as unknown[]).map((student: unknown) => {
      const s = student as Record<string, unknown>;
      const transformedStudent: StudentBaseResponseDto = {
        id: (s._id as string)?.toString() || (s.id as string) || `unknown-${Date.now()}-${Math.random()}`,
        fullName: s.fullName as string,
        email: s.email as string,
        phoneNumber: (s.phoneNumber as string) || "",
        role: "student",
        isVerified: (s.isVerified as boolean) || false,
        isProfileComplete: (s.isProfileComplete as boolean) || false,
        isPaid: (s.isPaid as boolean) || false,
        isBlocked: (s.isBlocked as boolean) || false,
        isTrialCompleted: (s.isTrialCompleted as boolean) || false,
        subscription: s.subscription as SubscriptionDetails,
        totalTrialClasses: (s.totalTrialClasses as number) || 0,
        pendingTrialClasses: (s.pendingTrialClasses as number) || 0,
        createdAt: s.createdAt as string,
        updatedAt: s.updatedAt as string,
      };

      return transformedStudent;
    });

    logger.info(`✅ Successfully fetched ${validatedStudents.length} students`);
    return validatedStudents;
  } catch (error: unknown) {
    logger.error("❌ Error fetching students:", {
      error: getErrorMessage(error),
    });
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch students")
    );
  }
});

// New paginated student thunk for server-side pagination and search
export interface StudentPaginatedResponse {
  students: StudentBaseResponseDto[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface StudentFetchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'blocked' | '';
  verification?: 'verified' | 'pending' | '';
}

export const fetchStudentsPaginated = createAsyncThunk<
  StudentPaginatedResponse,
  StudentFetchParams,
  { rejectValue: string }
>("admin/fetchStudentsPaginated", async (params, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchStudentsPaginated", params);
    
    const response = await adminStudentApi.getAllStudents(params);
    
    const data = response.data as any;
    
    // Handle standardized paginated response: { success: true, data: { items: [], pagination: {} } }
    if (data && data.success && data.data && typeof data.data === 'object' && Array.isArray(data.data.items) && data.data.pagination) {
      logger.info(`✅ Successfully fetched ${data.data.items.length} students (page ${data.data.pagination.currentPage})`);
      return {
        students: data.data.items,
        pagination: data.data.pagination,
      };
    }

    // Handle PaginatedResponse format: { success: true, data: [], pagination: {} }
    if (data && data.success && Array.isArray(data.data) && data.pagination) {
      logger.info(`✅ Successfully fetched ${data.data.length} students (page ${data.pagination.currentPage})`);
      return {
        students: data.data,
        pagination: data.pagination,
      };
    }
    
    // Fallback: If server returns old format (array), wrap it in paginated structure
    if (Array.isArray(response.data)) {
      logger.info(`✅ Received legacy format, ${response.data.length} students`);
      return {
        students: response.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.length,
          itemsPerPage: response.data.length,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    
    return rejectWithValue("Unexpected response format from server");
  } catch (error: unknown) {
    logger.error("❌ Error fetching paginated students:", error);
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch students")
    );
  }
});

export const searchStudentsAdminThunk = createAsyncThunk<
  StudentBaseResponseDto[],
  string,
  { rejectValue: string }
>("admin/searchStudents", async (query, { rejectWithValue }) => {
  try {
    const response = await adminStudentApi.searchStudents(query);
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to search students")
    );
  }
});

export const addStudentAdmin = createAsyncThunk<
  AddStudentResponseDto,
  AdminCreateStudentInput, // Use the inferred type instead of AddStudentRequestDto
  { rejectValue: string }
>("admin/addStudent", async (studentData, { rejectWithValue }) => {
  try {
    const validatedData = adminCreateStudentSchema.parse(studentData);
    logger.debug("🔄 Starting addStudentAdmin", studentData);

    // Cast to AddStudentRequestDto if needed
    const response = await adminStudentApi.addStudent(validatedData as AddStudentRequestDto);

    if (!response.data) {
      logger.error("❌ No response data received from add student API");
      return rejectWithValue("No response received from server");
    }

    logger.info("✅ Student added successfully:", response.data);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(err => err.message).join(', ');
      logger.error("❌ Validation error adding student:", errorMessage);
      return rejectWithValue(`Validation failed: ${errorMessage}`);
    }
    
    logger.error("❌ Error adding student:", {
      error: getErrorMessage(error),
    });
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to add student")
    );
  }
});
export const setSelectedStudent = (student: StudentBaseResponseDto | null) => ({
  type: "admin/setSelectedStudent",
  payload: student,
});



export const updateStudentAdmin = createAsyncThunk<
  StudentBaseResponseDto,
  { studentId: string; data: Partial<StudentBaseResponseDto> },
  { rejectValue: string }
>("admin/updateStudent", async ({ studentId, data }, { rejectWithValue, dispatch  }) => {
  try {
    const response = await adminStudentApi.updateStudent(studentId, data);
    dispatch(fetchAllStudentsAdmin());
    
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update student")
    );
  }
});



export const fetchAllTrialClassesAdmin = createAsyncThunk<
  TrialClass[],
  void,
  { rejectValue: string }
>(
  'admin/fetchAllTrialClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminStudentApi.getTrialClasses();
      const responseData = response.data as any;
      const trialClasses = responseData?.data?.items || responseData?.data || (Array.isArray(responseData) ? responseData : []);
      return trialClasses as TrialClass[];
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch trial classes'));
    }
  }
);


export const fetchAvailableMentors = createAsyncThunk<{ matches: AvailableMentorDto[]; alternates: AvailableMentorDto[] } | AvailableMentorDto[], { subjectId: string; preferredDate: string; days?: string[]; timeSlot?: string }, { rejectValue: string }>(
  'admin/fetchAvailableMentors',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminStudentApi.getAvailableMentors(params);
      const responseData = response.data as any;
      const data = responseData?.data?.items || responseData?.data || responseData;

      // Check for standardized matches/alternates structure first
      if (data && typeof data === 'object' && !Array.isArray(data) && ('matches' in data || 'alternates' in data)) {
        const obj = data as Record<string, unknown[]>;
        const transformMentor = (m: any) => ({
          ...m,
          rating: Number(m.rating) || 0
        });
        
        return { 
          matches: (obj.matches || []).map(transformMentor), 
          alternates: (obj.alternates || []).map(transformMentor) 
        };
      } 
      
      // Fallback to array of matches
      if (Array.isArray(data)) {
        const matches = data.map((m: any) => ({
          ...m,
          rating: Number(m.rating) || 0
        }));
        return { matches, alternates: [] };
      }
      
      return { matches: [], alternates: [] };
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch available mentors'));
    }
  }
);


export const assignMentorToTrialClass = createAsyncThunk(
  'admin/assignMentorToTrialClass',
  async (params: {
    trialClassId: string;
    mentorId: string;
    scheduledDate: string;
    scheduledTime: string;
  }, { rejectWithValue }) => {
    try {
      const response = await adminStudentApi.assignMentor(params.trialClassId, params);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to assign mentor'));
    }
  }
);

export const fetchStudentsWithStats = createAsyncThunk<
  StudentsWithStatsResponse['data'],
  { page?: number; limit?: number },
  { rejectValue: string }
>("admin/fetchStudentsWithStats", async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchStudentsWithStats", { page, limit });

    const response = await adminStudentApi.getStudentsWithStats({ page, limit });

    const responseData = response.data as any;
    if (!responseData.success) {
      logger.error("❌ API returned unsuccessful response:", responseData);
      return rejectWithValue(responseData.message || "Failed to fetch students with stats");
    }

    const students = responseData.data?.items || responseData.data?.students || [];
    const pagination = responseData.data?.pagination || responseData.pagination;

    // Transform and validate students data
    const validatedStudents = (students as unknown as Record<string, unknown>[]).map((student) => {
      const transformedStudent: StudentBaseResponseDto = {
        id: (student._id as string) || (student.id as string) || `unknown-${Date.now()}-${Math.random()}`,
        fullName: student.fullName as string,
        email: student.email as string,
        phoneNumber: (student.phoneNumber as string) || "",
        role: "student",
        isVerified: (student.isVerified as boolean) || false,
        isProfileComplete: (student.isProfileComplete as boolean) || false,
        isPaid: (student.isPaid as boolean) || false,
        isBlocked: (student.isBlocked as boolean) || false,
        isTrialCompleted: (student.isTrialCompleted as boolean) || false,
        subscription: student.subscription as SubscriptionDetails,
        totalTrialClasses: (student.totalTrialClasses as number) || 0,
        pendingTrialClasses: (student.pendingTrialClasses as number) || 0,
        createdAt: student.createdAt as string,
        updatedAt: student.updatedAt as string,
      };
      return transformedStudent;
    });

    return { 
      students: validatedStudents, 
      pagination: {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalStudents: pagination.totalStudents,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage
      } 
    };
  } catch (error: unknown) {
    logger.error("❌ Error fetching students with stats:", {
      error: getErrorMessage(error),
    });
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch students with statistics")
    );
  }
});

export const fetchStudentTrialClasses = createAsyncThunk<
  TrialClass[], 
  { studentId: string; status?: string },
  { rejectValue: string }
>("admin/fetchStudentTrialClasses", async ({ studentId, status }, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchStudentTrialClasses", { studentId, status });

      const response = await adminStudentApi.getStudentTrialClasses(studentId, status);
      const responseData = response.data as any;

      if (!responseData.success) {
        return rejectWithValue(getApiErrorMessage(responseData, "Failed to fetch student trial classes"));
      }

      const trialClasses = responseData.data?.items || responseData.data || [];
      logger.info(`✅ Successfully fetched ${(trialClasses as unknown[])?.length || 0} trial classes for student ${studentId}`);
      return trialClasses as TrialClass[];
  } catch (error: unknown) {
    logger.error("❌ Error fetching student trial classes:", {
      error: getErrorMessage(error),
    });
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch student trial classes")
    );
  }
});

// export const fetchStudentTrialClasses = createAsyncThunk<
//   any[], // Replace with your TrialClass type
//   { studentId: string; status?: string },
//   { rejectValue: string }
// >("admin/fetchStudentTrialClasses", async ({ studentId, status }, { rejectWithValue }) => {
//   try {
//     logger.debug("🔄 Starting fetchStudentTrialClasses", { studentId, status });

//     const response = await adminStudentApi.getStudentTrialClasses(studentId, status);

//     if (!response.data.success) {
//       return rejectWithValue(response.data.message || "Failed to fetch student trial classes");
//     }

//     logger.info(`✅ Successfully fetched ${response.data.data?.length || 0} trial classes for student ${studentId}`);
//     return response.data.data || [];
// //     // Verify student is unknown before casting if needed, but for now we'll just fix the any on catch
//   } catch (error: unknown) {
//     logger.error("❌ Error fetching student trial classes:", {
//       // error: error.message,
//       // status: error.response?.status,
//       // data: error.response?.data,
//     });
//     return rejectWithValue(
//       // error.response?.data?.message || "Failed to fetch student trial classes"
//       getApiErrorMessage(error, "Failed to fetch trial classes")
//     );
//   }
// });

// Fetch trial class details
export const fetchTrialClassDetails = createAsyncThunk<
  TrialClass, 
  string,
  { rejectValue: string }
>("admin/fetchTrialClassDetails", async (trialClassId, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchTrialClassDetails", { trialClassId });

    const response = await adminStudentApi.getTrialClassDetails(trialClassId);
    const responseData = response.data as any;

    if (!responseData.success) {
      return rejectWithValue(getApiErrorMessage(responseData, "Failed to fetch trial class details"));
    }

    logger.info(`✅ Successfully fetched trial class details for ${trialClassId}`);
    return (responseData.data?.items?.[0] || responseData.data) as TrialClass;
  } catch (error: unknown) {
    logger.error("❌ Error fetching trial class details:", {
      error: getErrorMessage(error),
    });
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch trial class details")
    );
  }
});

// Update trial class status
export const updateTrialClassStatus = createAsyncThunk<
  TrialClass, 
  { trialClassId: string; status: string; reason?: string },
  { rejectValue: string }
>("admin/updateTrialClassStatus", async ({ trialClassId, status, reason }, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting updateTrialClassStatus", { trialClassId, status, reason });

    const response = await adminStudentApi.updateTrialClassStatus(trialClassId, { status, reason });

    if (!response.data.success) {
      return rejectWithValue(getApiErrorMessage(response.data, "Failed to update trial class status"));
    }

    logger.info(`✅ Successfully updated trial class status for ${trialClassId}`);
    const resData = response.data as Record<string, unknown>;
    return resData.data as TrialClass;
  } catch (error: unknown) {
    logger.error("❌ Error updating trial class status:", {
      error: getErrorMessage(error),
    });
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update trial class status")
    );
  }
});


export const fetchAvailableMentorsForCourse = createAsyncThunk<
  { matches: AvailableMentorDto[]; alternates: AvailableMentorDto[] },
  {
    gradeId?: string;
    subjectId: string;
    days?: string[];
    timeSlot?: string;
    excludeCourseId?: string;
  },
  { rejectValue: string }
>("admin/fetchAvailableMentorsForCourse", async (params, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchAvailableMentorsForCourse", params);

    const response = await adminCourseApi.getAvailableMentorsForCourse(params);
    const data = response.data.data as Record<string, unknown[]>;
    
    const matches = (data.matches || []).map((m: unknown) => {
      const mentor = m as Record<string, unknown>;
      return {
        ...mentor,
        rating: (mentor.rating as number) || 0
      };
    }) as AvailableMentorDto[];
    
    const alternates = (data.alternates || []).map((m: unknown) => {
      const mentor = m as Record<string, unknown>;
      return {
        ...mentor,
        rating: (mentor.rating as number) || 0
      };
    }) as AvailableMentorDto[];
    
    return { matches, alternates };
  } catch (error: unknown) {
    logger.error("❌ Error fetching available mentors for course:", {
      error: getErrorMessage(error),
    });
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch available mentors")
    );
  }
});

export const createCourseThunk = createAsyncThunk<
  Course, // Course or success message
  {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    studentId?: string;
    courseType?: "one-to-one" | "group";
    maxStudents?: number;
    schedule: {
      days: string[];
      timeSlot?: string;
    };
    startDate: string;
    endDate: string;
    fee: number;
  },
  { rejectValue: string }
>(
  "admin/createCourse",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminCourseApi.createCourse(data);
      dispatch(clearCourseCreationState());
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create course")
      );
    }
  }
);

export const enrollStudentToCourseThunk = createAsyncThunk<
  { success: boolean; message: string },
  { courseId: string; studentId: string },
  { rejectValue: string }
>(
  "admin/enrollStudent",
  async ({ courseId, studentId }, { rejectWithValue }) => {
    try {
      const response = await adminCourseApi.enrollStudentToCourse(courseId, studentId);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to enroll student")
      );
    }
  }
);

export const unenrollStudentFromCourseThunk = createAsyncThunk<
  { success: boolean; message: string },
  { courseId: string; studentId: string },
  { rejectValue: string }
>(
  "admin/unenrollStudent",
  async ({ courseId, studentId }, { rejectWithValue }) => {
    try {
      const response = await adminCourseApi.unenrollStudentFromCourse(courseId, studentId);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to unenroll student")
      );
    }
  }
);

export const updateCourseAdmin = createAsyncThunk<
  Course,
  {
    courseId: string;
    data: {
      gradeId?: string;
      subjectId?: string;
      mentorId?: string;
      studentId?: string;
      schedule?: {
        days: string[];
        timeSlot?: string;
      };
      startDate?: string;
      endDate?: string;
      fee?: number;
      status?: string;
    };
  },
  { rejectValue: string }
>(
  "admin/updateCourse",
  async ({ courseId, data }, { rejectWithValue }) => {
    try {
      const response = await adminCourseApi.updateCourse(courseId, data);
      return response.data.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to update course")
      );
    }
  }
);

// adminThunk.ts - Fix fetchAllCoursesAdmin
export const fetchAllCoursesAdmin = createAsyncThunk<
  Course[], 
  void,
  { rejectValue: string }
>("admin/fetchAllOneToOneCourses", async (_, { rejectWithValue }) => {
  try {
    console.log("📡 Fetching courses from API...");
    const response = await adminCourseApi.getAllOneToOneCourses();
    
    console.log("📡 Courses API response:", response.data);
    
    let courses: Course[] = [];
    const responseData = response.data as any;

    if (Array.isArray(responseData)) {
      courses = responseData;
    } else if (responseData?.success && responseData.data) {
      courses = responseData.data.items || (Array.isArray(responseData.data) ? responseData.data : []);
    } else {
      console.error("❌ Invalid courses response structure:", responseData);
      return rejectWithValue("Invalid response format for courses");
    }
    
    console.log(`✅ Fetched ${courses.length} courses`);
    return courses;
  } catch (error: unknown) {
    console.error('❌ Error fetching courses:', error);
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch courses")
    );
  }
});

// New paginated course thunk for server-side pagination and search
export interface CoursePaginatedResponse {
  courses: Course[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CourseFetchParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'available' | 'booked' | 'ongoing' | 'completed' | 'cancelled' | '';
  gradeId?: string;
}

export const fetchCoursesPaginated = createAsyncThunk<
  CoursePaginatedResponse,
  CourseFetchParams,
  { rejectValue: string }
>("admin/fetchCoursesPaginated", async (params, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchCoursesPaginated", params);
    
    const response = await adminCourseApi.getAllOneToOneCourses(params);
    
    const responseData = response.data as any;
    
    // Handle standardized paginated response
    if (responseData?.success && responseData.data && responseData.data.items && responseData.data.pagination) {
       return {
        courses: responseData.data.items,
        pagination: responseData.data.pagination,
      };
    }

    // Handle PaginatedResponse format
    if (responseData?.success && Array.isArray(responseData.data) && responseData.pagination) {
      return {
        courses: responseData.data,
        pagination: responseData.pagination,
      };
    }
    
    // Fallback: If server returns old format (array), wrap it in paginated structure
    if (Array.isArray(responseData)) {
      logger.info(`✅ Received legacy format, ${responseData.length} courses`);
      return {
        courses: responseData,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: responseData.length,
          itemsPerPage: responseData.length,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    
    return rejectWithValue("Unexpected response format from server");
  } catch (error: unknown) {
    logger.error("❌ Error fetching paginated courses:", error);
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch courses")
    );
  }
});

// adminThunk.ts - Fix fetchGradesAdmin
export const fetchGradesAdmin = createAsyncThunk<
  { _id: string; name: string; syllabus?: string }[],
  void,
  { rejectValue: string }
>("admin/fetchGrades", async (_, { rejectWithValue }) => {
  try {
    console.log("📡 Fetching grades from API...");
    const response = await adminCourseApi.getGrades();
    
    console.log("📡 Grades API response:", response.data);
    
    let grades: { _id: string; name: string; syllabus?: string }[] = [];
    const responseData = response.data as any;
    
    if (responseData?.success && responseData.data) {
      grades = responseData.data.items || (Array.isArray(responseData.data) ? responseData.data : []);
    } else if (Array.isArray(responseData)) {
      grades = responseData;
    } else {
      console.error("❌ Invalid grades response structure:", responseData);
      return rejectWithValue("Invalid response format for grades");
    }
    
    // Transform to the format expected by the frontend
    const transformedGrades = (grades as unknown as Record<string, unknown>[]).map(grade => ({
      _id: (grade.id || grade._id || '').toString(),
      name: (grade.name || '').toString(),
      syllabus: (grade.syllabus || '').toString(),
    })) as { _id: string; name: string; syllabus?: string }[];
    
    console.log(`✅ Transformed ${transformedGrades.length} grades`);
    return transformedGrades;
  } catch (error: unknown) {
    console.error("❌ Error fetching grades:", error);
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch grades")
    );
  }
});
// adminThunk.ts - fetchSubjectsByGradeAdmin
export const fetchSubjectsByGradeAdmin = createAsyncThunk<
  { gradeId: string; subjects: { _id: string; name: string; gradeId: string }[] },
  string,
  { rejectValue: string }
>("admin/fetchSubjects", async (gradeId, { rejectWithValue }) => {
  try {
    console.log(`📡 Fetching subjects for grade: ${gradeId} from API...`);
    const { adminCourseApi } = await import("./adminApi");
    const response = await adminCourseApi.getSubjectsByGrade(gradeId);
    
    const responseData = response.data as any;
    const subjects = responseData?.data?.items || responseData?.data || responseData;
    
    if (!Array.isArray(subjects)) {
      console.error('❌ Invalid subjects response:', response.data);
      return { gradeId, subjects: [] };
    }
    
    // Transform to the format expected by the frontend
    const transformedSubjects = (subjects as Record<string, unknown>[]).map(subject => ({
      _id: (subject.id || subject._id || '').toString(),
      name: (subject.subjectName || subject.name || '').toString(),
      gradeId: gradeId,
    }));
    
    console.log(`✅ Transformed ${transformedSubjects.length} subjects for grade ${gradeId}`);
    return { gradeId, subjects: transformedSubjects };
  } catch (error: unknown) {
    console.error(`❌ Error fetching subjects for grade ${gradeId}:`, error);
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch subjects"));
  }
});




export { clearCourseCreationState };


export const fetchAllCourseRequestsAdmin = createAsyncThunk<
  CourseRequest[],
  void,
  { rejectValue: string }
>("admin/fetchAllCourseRequests", async (_, { rejectWithValue }) => {
  try {
    const response = await adminRequestsApi.getAllRequests();
    const responseData = response.data as any;
    const requests = responseData?.data?.items || responseData?.data || (Array.isArray(responseData) ? responseData : []);
    
    // Manual mapping to ensure 'id' is present
    return (requests as (CourseRequest & { _id?: string })[]).map(req => ({
      ...req,
      id: req._id || req.id,
      student: req.student ? (typeof req.student === 'object' ? {
        ...req.student,
        id: (req.student as Record<string, unknown>)._id as string || (req.student as Record<string, unknown>).id as string || (req.student as unknown as string)
      } : req.student) : 'Unknown Student'
    })) as CourseRequest[];
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch course requests"));
  }
});

export const fetchCourseRequestsPaginated = createAsyncThunk<
  { requests: CourseRequest[]; pagination: PaginationMeta },
  { page?: number; limit?: number; search?: string; status?: string },
  { rejectValue: string }
>("admin/fetchCourseRequestsPaginated", async (params, { rejectWithValue }) => {
  try {
    const response = await adminRequestsApi.getAllRequests(params);
    const responseData = response.data as any;

    if (responseData?.success && responseData.data && responseData.data.items && responseData.data.pagination) {
      const requests = (responseData.data.items as (CourseRequest & { _id?: string })[]).map(req => ({
        ...req,
        id: req._id || req.id,
        student: req.student ? (typeof req.student === 'object' ? {
          ...req.student,
          id: (req.student as Record<string, any>)._id as string || (req.student as Record<string, any>).id as string || (req.student as any)
        } : req.student) : 'Unknown Student'
      })) as CourseRequest[];

      return {
        requests,
        pagination: responseData.data.pagination,
      };
    }

    // Fallback
    const requestsData = 'data' in responseData ? responseData.data : (Array.isArray(responseData) ? responseData : []);
    const requests = (requestsData as (CourseRequest & { _id?: string })[]).map(req => ({
        ...req,
        id: req._id || req.id,
    })) as CourseRequest[];

    return {
      requests,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: requests.length,
        itemsPerPage: requests.length,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch course requests"));
  }
});

export const updateCourseRequestStatusAdmin = createAsyncThunk<
  { success: boolean; message: string },
  { requestId: string; status: string; params?: { page?: number; limit?: number; search?: string; status?: string } },
  { rejectValue: string }
> ("admin/updateCourseRequestStatus", async ({ requestId, status, params }, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminRequestsApi.updateRequestStatus(requestId, status);
    if (params) {
        dispatch(fetchCourseRequestsPaginated(params));
    } else {
        dispatch(fetchAllCourseRequestsAdmin());
    }
    return { success: response.data.success, message: response.data.message };
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to update status"));
  }
});

// Mentor Requests Thunks

export const fetchAllMentorRequestsAdmin = createAsyncThunk<
  MentorRequestListItem[], // Replace with specific type if available, e.g., MentorAssignmentRequest
  void,
  { rejectValue: string }
>("admin/fetchAllMentorRequests", async (_, { rejectWithValue }) => {
  try {
    const response = await adminMentorRequestApi.fetchAllRequests();
    if (response.data.success) {
      const requests = response.data.data;
      return (requests as unknown as Record<string, unknown>[]).map(req => ({
        ...req,
        id: (req._id || req.id || '').toString(),
        student: req.student || '',
        mentor: req.mentor || '',
        subject: req.subject || '',
        status: (req.status || 'pending') as MentorRequestListItem['status'],
        createdAt: (req.createdAt || new Date().toISOString()).toString()
      })) as MentorRequestListItem[];
    }
    return rejectWithValue("Failed to fetch mentor requests");
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch mentor requests"));
  }
});

export const approveMentorRequestAdmin = createAsyncThunk<
  { message: string },
  string,
  { rejectValue: string }
>("admin/approveMentorRequest", async (requestId, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminMentorRequestApi.approveRequest(requestId);
    dispatch(fetchAllMentorRequestsAdmin()); // Refresh list
    return { message: response.data.message };
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to approve request"));
  }
});

export const rejectMentorRequestAdmin = createAsyncThunk<
  { message: string },
  { requestId: string; reason: string },
  { rejectValue: string }
>("admin/rejectMentorRequest", async ({ requestId, reason }, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminMentorRequestApi.rejectRequest(requestId, reason);
    dispatch(fetchAllMentorRequestsAdmin()); // Refresh list
    return { message: response.data.message };
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to reject request"));
  }
});

export const fetchStudentProfile = createAsyncThunk<
  StudentProfile,
  string,
  { rejectValue: string }
>("admin/fetchStudentProfile", async (studentId, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchStudentProfile", { studentId });
    const { adminStudentProfileApi } = await import("./adminApi");
    const response = await adminStudentProfileApi.getStudentProfile(studentId);
    
    if (!response.data.success) {
      return rejectWithValue("Failed to fetch student profile");
    }

    logger.info(`✅ Successfully fetched student profile for ${studentId}`);
    return response.data.data as StudentProfile;
  } catch (error: unknown) {
    logger.error("❌ Error fetching student profile:", { error: getErrorMessage(error) });
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch student profile"));
  }
});

export const fetchAllEnrollmentsAdmin = createAsyncThunk<
  Enrollment[],
  void,
  { rejectValue: string }
>("admin/fetchAllEnrollments", async (_, { rejectWithValue }) => {
  try {
    const { adminEnrollmentApi } = await import("./adminApi");
    const response = await adminEnrollmentApi.fetchAllEnrollments();
    const responseData = response.data as any;
    const enrollments = responseData?.data?.items || responseData?.data || (Array.isArray(responseData) ? responseData : []);

    return (enrollments as unknown as Record<string, unknown>[]).map(en => {
      const student = en.student as Record<string, unknown> | undefined;
      if (student && student.profileImage && !student.profilePicture) {
        student.profilePicture = student.profileImage;
      }
      return {
        ...en,
        id: (en._id || en.id || '').toString(),
        student: student || '',
        course: en.course || '',
        enrollmentDate: en.enrollmentDate || en.enrolledAt || new Date().toISOString(),
        status: (en.status || 'active') as Enrollment['status'],
        createdAt: (en.createdAt || en.enrollmentDate || new Date().toISOString()).toString(),
        updatedAt: (en.updatedAt || en.enrollmentDate || new Date().toISOString()).toString(),
        enrolledAt: (en.enrolledAt || en.enrollmentDate || new Date().toISOString()).toString()
      };
    }) as unknown as Enrollment[];
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch enrollments"));
  }
});

export const fetchEnrollmentsPaginated = createAsyncThunk<
  { enrollments: Enrollment[]; pagination: PaginationMeta },
  { page?: number; limit?: number; search?: string; status?: string },
  { rejectValue: string }
>("admin/fetchEnrollmentsPaginated", async (params, { rejectWithValue }) => {
  try {
    const { adminEnrollmentApi } = await import("./adminApi");
    const response = await adminEnrollmentApi.fetchAllEnrollments(params);
    const responseData = response.data as any;

    if (responseData?.success && responseData.data && responseData.data.items && responseData.data.pagination) {
      const enrollments = (responseData.data.items as unknown as Record<string, any>[]).map(en => {
        const student = en.student as Record<string, any> | undefined;
        if (student && student.profileImage && !student.profilePicture) {
          student.profilePicture = student.profileImage;
        }
        return {
          ...en,
          id: (en._id || en.id || '').toString(),
          student: student || '',
          course: en.course || '',
          enrollmentDate: en.enrollmentDate || en.enrolledAt || new Date().toISOString(),
          status: (en.status || 'active') as Enrollment['status'],
          createdAt: (en.createdAt || en.enrollmentDate || new Date().toISOString()).toString(),
          updatedAt: (en.updatedAt || en.enrollmentDate || new Date().toISOString()).toString(),
          enrolledAt: (en.enrolledAt || en.enrollmentDate || new Date().toISOString()).toString()
        };
      }) as unknown as Enrollment[];

      return {
        enrollments,
        pagination: responseData.data.pagination,
      };
    }

    // Fallback
    const enrollmentsData = 'data' in responseData ? responseData.data : (Array.isArray(responseData) ? responseData : []);
    const enrollments = (enrollmentsData as unknown as Record<string, unknown>[]).map(en => ({
        ...en,
        id: (en._id || en.id || '').toString(),
    })) as unknown as Enrollment[];

    return {
      enrollments,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: enrollments.length,
        itemsPerPage: enrollments.length,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch enrollments"));
  }
});

export const assignMentorToStudent = createAsyncThunk<
  { message: string; course?: Course; enrollment?: Enrollment },
  { studentId: string; subjectId: string; mentorId: string; preferredDate?: string; days?: string[]; timeSlot?: string },
  { rejectValue: string }
>(
  "admin/assignMentorToStudent",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminStudentApi.assignMentorToStudent(data);
      dispatch(fetchAllEnrollmentsAdmin()); // Refresh enrollments
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, "Failed to assign mentor"));
    }
  }
);

export const reassignMentorToStudent = createAsyncThunk<
  { message: string; course?: Course },
  { studentId: string; subjectId: string; newMentorId: string; reason?: string; days?: string[]; timeSlot?: string },
  { rejectValue: string }
>(
  "admin/reassignMentorToStudent",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminStudentApi.reassignMentorToStudent(data);
      dispatch(fetchAllEnrollmentsAdmin()); // Refresh enrollments
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, "Failed to reassign mentor"));
    }
  }
);

