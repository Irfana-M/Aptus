import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminAuthApi, adminCourseApi, adminStudentApi, adminRequestsApi, type AddStudentRequestDto, type AddStudentResponseDto, type AdminLoginDto, type StudentsWithStatsResponse, type PaginatedResponse } from "./adminApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import { adminMentorApi } from "./adminApi";
import type { RootState } from "../../app/store";
import type { MentorProfile } from "../mentor/mentorSlice";
import type { StudentBaseResponseDto, CourseRequest } from "../../types/studentTypes";
import type { StudentProfile } from "../../types/student.types";
import type { TrialClass } from "../../types/trialTypes";
import { logger } from "../../utils/logger";
import { getApiErrorMessage, getErrorMessage } from "../../utils/errorUtils";
import { z } from 'zod';
import { 
  adminCreateStudentSchema, 
  type AdminCreateStudentInput 
} from '../../lib/schemas/student.schemas';
import { clearCourseCreationState } from "./adminSlice";
import type { Course } from "../../types/courseTypes";



    export interface AvailableMentorDto {
  _id: string;
  id?: string;
  fullName: string;
  profilePicture?: string | null;
  profileImageUrl?: string | null;
  rating: number;
  bio?: string;
  level?: "intermediate" | "expert";
  availability?: {
    day: string;
    slots: {
      startTime: string;
      endTime: string;
      isBooked: boolean;
    }[];
  }[];
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
      const obj = data as Record<string, unknown>;
      if ('data' in obj && Array.isArray(obj.data)) {
        return obj.data as MentorProfile[];
      }
      if ('mentors' in obj && Array.isArray(obj.mentors)) {
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
    
    const data = response.data;
    
    // Handle paginated response structure
    if (data && 'success' in data && 'data' in data && 'pagination' in data) {
      const paginatedData = data as PaginatedResponse<MentorProfile>;
      logger.info(`✅ Successfully fetched ${paginatedData.data.length} mentors (page ${paginatedData.pagination.currentPage})`);
      return {
        mentors: paginatedData.data,
        pagination: paginatedData.pagination,
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
    const { data } = await adminMentorApi.fetchMentorProfile(mentorId);
    return data;
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
    const { data } = await adminMentorApi.approveMentor(mentorId);
    return data;
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
    const { data } = await adminMentorApi.rejectMentor(mentorId, reason);
    return data;
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
    
    return response.data;
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
    
    return response.data;
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
    
    return response.data;
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
    
    return response.data;
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
    return response.data;
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
    return response.data;
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

    const data = response.data as unknown as { success: boolean; message?: string; data: { students: unknown[] } };
    if (!data.success) {
      logger.error("❌ API returned unsuccessful response:", data);
      return rejectWithValue(data.message || "Failed to fetch students");
    }

    const { students } = data.data;

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
    
    const data = response.data;
    
    // Handle paginated response structure
    if (data && 'success' in data && 'data' in data && 'pagination' in data) {
      const paginatedData = data as PaginatedResponse<StudentBaseResponseDto>;
      logger.info(`✅ Successfully fetched ${paginatedData.data.length} students (page ${paginatedData.pagination.currentPage})`);
      return {
        students: paginatedData.data,
        pagination: paginatedData.pagination,
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
    
    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to update student")
    );
  }
});



export const fetchAllTrialClassesAdmin = createAsyncThunk(
  'admin/fetchAllTrialClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminStudentApi.getTrialClasses();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to fetch trial classes'));
    }
  }
);


export const fetchAvailableMentors = createAsyncThunk(
  'admin/fetchAvailableMentors',
  async (params: { subjectId: string; preferredDate: string }, { rejectWithValue }) => {
    try {
      const response = await adminStudentApi.getAvailableMentors(params);
      // Response might be { matches, alternates } (new) or array (old fallback)
      const data = response.data.data;
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // Flatten matches and alternates for the simple assignment modal
        const matches = Array.isArray(data.matches) ? data.matches : [];
        const alternates = Array.isArray(data.alternates) ? data.alternates : [];
        return [...matches, ...alternates];
      }
      return [];
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

    const responseData = response.data as StudentsWithStatsResponse;
    if (!responseData.success) {
      logger.error("❌ API returned unsuccessful response:", responseData);
      return rejectWithValue(responseData.message || "Failed to fetch students with stats");
    }

    const { students, pagination } = responseData.data;

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

    if (!response.data.success) {
      return rejectWithValue(response.data.message || "Failed to fetch student trial classes");
    }

    logger.info(`✅ Successfully fetched ${response.data.data?.length || 0} trial classes for student ${studentId}`);
    return response.data.data || [];
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

    if (!response.data.success) {
      return rejectWithValue(response.data.message || "Failed to fetch trial class details");
    }

    logger.info(`✅ Successfully fetched trial class details for ${trialClassId}`);
    return response.data.data;
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
      return rejectWithValue(response.data.message || "Failed to update trial class status");
    }

    logger.info(`✅ Successfully updated trial class status for ${trialClassId}`);
    return response.data.data;
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
  { matches: AvailableMentorDto[], alternates: AvailableMentorDto[] },
  { gradeId?: string; subject: string; days?: string[]; timeSlot?: string },
  { rejectValue: string }
>(
  "admin/fetchAvailableMentorsForCourse",
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminCourseApi.getAvailableMentorsForCourse(params);
      // Response data is now { matches: [], alternates: [] }
      return response.data.data || { matches: [], alternates: [] };
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to load available mentors")
      );
    }
  }
);

export const createOneToOneCourse = createAsyncThunk<
  Course, // Course or success message
  {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    studentId: string;
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
  "admin/createOneToOneCourse",
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await adminCourseApi.createOneToOneCourse(data);
      dispatch(clearCourseCreationState());
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to create course")
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
    
    // Handle different response structures
    let courses: Course[] = [];
    
    const responseData = response.data;

    if (Array.isArray(responseData)) {
      console.log("✅ Using response.data directly (array)");
      courses = responseData;
    } else if (responseData && 'data' in responseData && Array.isArray(responseData.data)) {
      console.log("✅ Using response.data.data (paginated structure)");
      courses = responseData.data;
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
    
    const responseData = response.data;
    
    // Handle paginated response structure
    if (responseData && !Array.isArray(responseData) && 'pagination' in responseData && 'data' in responseData) {
      logger.info(`✅ Successfully fetched ${responseData.data.length} courses (page ${responseData.pagination.currentPage})`);
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
    
    // Handle different response structures
    let grades: { _id: string; name: string; syllabus?: string }[] = [];
    
    if (response.data?.success && Array.isArray(response.data.data)) {
      console.log("✅ Using response.data.data for grades (array)");
      grades = response.data.data;
    } else if (Array.isArray(response.data)) {
      console.log("✅ Using response.data directly for grades (array)");
      grades = response.data;
    } else {
      console.error("❌ Invalid grades response structure:", response.data);
      return rejectWithValue("Invalid response format for grades");
    }
    
    // Transform to the format expected by the frontend
    const transformedGrades = grades.map(grade => ({
      _id: (grade as { id?: string; _id?: string }).id || grade._id,
      name: grade.name,
      syllabus: grade.syllabus || '',
    }));
    
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
>("admin/fetchSubjectsByGrade", async (gradeId, { rejectWithValue }) => {
  try {
    const response = await adminCourseApi.getSubjectsByGrade(gradeId);
    
    // Handle both response structures
    const subjects = response.data?.data || response.data;
    
    if (!Array.isArray(subjects)) {
      console.error('Invalid subjects response:', response.data);
      return { gradeId, subjects: [] };
    }
    
    // Transform to the format expected by the frontend
    const transformedSubjects = subjects.map(subject => ({
      _id: subject.id || subject._id,
      name: subject.subjectName,
      gradeId: gradeId,
    }));
    
    return { gradeId, subjects: transformedSubjects };
  } catch (error: unknown) {
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
    return response.data.data || [];
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch course requests"));
  }
});

export const updateCourseRequestStatusAdmin = createAsyncThunk<
  CourseRequest,
  { requestId: string; status: string },
  { rejectValue: string }
>("admin/updateCourseRequestStatus", async ({ requestId, status }, { rejectWithValue, dispatch }) => {
  try {
    const response = await adminRequestsApi.updateRequestStatus(requestId, status);
    dispatch(fetchAllCourseRequestsAdmin());
    return response.data.data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to update status"));
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
      return rejectWithValue(response.data.message || "Failed to fetch student profile");
    }

    logger.info(`✅ Successfully fetched student profile for ${studentId}`);
    return response.data.data as StudentProfile;
  } catch (error: unknown) {
    logger.error("❌ Error fetching student profile:", { error: getErrorMessage(error) });
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch student profile"));
  }
});
