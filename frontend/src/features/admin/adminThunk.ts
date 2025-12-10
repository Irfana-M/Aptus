import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi, adminCourseApi, adminStudentApi, adminRequestsApi, type AddStudentRequestDto, type AddStudentResponseDto, type AdminLoginDto, type StudentsWithStatsResponse } from "./adminApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import { adminMentorApi } from "./adminApi";
import type { RootState } from "../../app/store";
import type { MentorProfile } from "../mentor/mentorSlice";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { logger } from "../../utils/logger";
import { getApiErrorMessage, getErrorMessage } from "../../utils/errorUtils";
import { z } from 'zod';
import { 
  adminCreateStudentSchema, 
  type AdminCreateStudentInput 
} from '../../lib/schemas/student.schemas';
import { clearCourseCreationState } from "./adminSlice";
import type { Course } from "../../types/courseTypes";

 interface RawStudentData {
      _id?: string;
      id?: string;
      fullName: string;
      email: string;
      phoneNumber?: string;
      isVerified?: boolean;
      isProfileComplete?: boolean;
      isPaid?: boolean;
      isBlocked?: boolean;
      totalTrialClasses?: number;
      pendingTrialClasses?: number;
      createdAt: string;
      updatedAt: string;
    }

    export interface AvailableMentorDto {
  id: string;
  fullName: string;
  profilePicture?: string | null;
  rating: number;
  bio?: string;
  level: "intermediate" | "expert";
}

export const adminLoginThunk = createAsyncThunk<
  AdminLoginResponse,
  AdminLoginDto,
  { rejectValue: string }
>("admin/login", async (payload, { rejectWithValue }) => {
  try {
    const response = await adminApi.login(payload);
    console.log("🔐 Thunk: API Response received", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      hasAccessToken: !!response.data.accessToken,
      hasAdmin: !!response.data.admin,
    });

    return response.data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Login failed"));
  }
});

export const refreshAdminToken = createAsyncThunk(
  "admin/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.refreshToken();
      return response.data;
    } catch (error: unknown) {
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

    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.mentors)) {
      return response.data.mentors;
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
    
    // Handle paginated response structure
    if (response.data?.success && response.data?.data && response.data?.pagination) {
      logger.info(`✅ Successfully fetched ${response.data.data.length} mentors (page ${response.data.pagination.currentPage})`);
      return {
        mentors: response.data.data,
        pagination: response.data.pagination,
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
  any,
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

    if (!response.data.success) {
      logger.error("❌ API returned unsuccessful response:", response.data);
      return rejectWithValue(response.data.message || "Failed to fetch students");
    }

    const { students } = response.data.data;

    const validatedStudents = students.map((student: RawStudentData) => {
      const transformedStudent: StudentBaseResponseDto = {
        id: student._id?.toString() || student.id|| `unknown-${Date.now()}-${Math.random()}`,
        fullName: student.fullName,
        email: student.email,
        phoneNumber: student.phoneNumber || "",
        role: "student",
        isVerified: student.isVerified || false,
        isProfileComplete: student.isProfileComplete || false,
        isPaid: student.isPaid || false,
        isBlocked: student.isBlocked || false,
        totalTrialClasses: student.totalTrialClasses || 0,
        pendingTrialClasses: student.pendingTrialClasses || 0,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
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
    
    // Handle paginated response structure
    if (response.data?.success && response.data?.data && response.data?.pagination) {
      logger.info(`✅ Successfully fetched ${response.data.data.length} students (page ${response.data.pagination.currentPage})`);
      return {
        students: response.data.data,
        pagination: response.data.pagination,
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
      // Extract the data array from the response
      return response.data.data || [];
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

    if (!response.data.success) {
      logger.error("❌ API returned unsuccessful response:", response.data);
      return rejectWithValue(response.data.message || "Failed to fetch students with stats");
    }

    const { students, pagination } = response.data.data;

    // Transform and validate students data
    const validatedStudents = students.map((student: RawStudentData) => {
      const transformedStudent: StudentBaseResponseDto = {
        id: student._id?.toString() || student.id|| `unknown-${Date.now()}-${Math.random()}`,
        fullName: student.fullName,
        email: student.email,
        phoneNumber: student.phoneNumber || "",
        role: "student",
        isVerified: student.isVerified || false,
        isProfileComplete: student.isProfileComplete || false,
        isPaid: student.isPaid || false,
        isBlocked: student.isBlocked || false,
        totalTrialClasses: student.totalTrialClasses || 0,
        pendingTrialClasses: student.pendingTrialClasses || 0,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      };

      return transformedStudent;
    });

    logger.info(`✅ Successfully fetched ${validatedStudents.length} students with stats`);
    
    return {
      students: validatedStudents,
      pagination
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
  any[], // TrialClass array
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
//   } catch (error: any) {
//     logger.error("❌ Error fetching student trial classes:", {
//       error: error.message,
//       status: error.response?.status,
//       data: error.response?.data,
//     });
//     return rejectWithValue(
//       error.response?.data?.message || "Failed to fetch student trial classes"
//     );
//   }
// });

// Fetch trial class details
export const fetchTrialClassDetails = createAsyncThunk<
  any, // Replace 'any' with your TrialClassDetailsDto type
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
  any, // Replace 'any' with your TrialClassResponseDto type
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
  AvailableMentorDto[],
  { gradeId: string; subjectId: string; dayOfWeek?: number; timeSlot?: string },
  { rejectValue: string }
>(
  "admin/fetchAvailableMentorsForCourse",
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminCourseApi.getAvailableMentorsForCourse(params);
      return response.data.data || [];
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to load available mentors")
      );
    }
  }
);

export const createOneToOneCourse = createAsyncThunk<
  any,
  {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    dayOfWeek?: number;
    timeSlot?: string;
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
    let courses: any[] = [];
    
    if (response.data?.success && Array.isArray(response.data.data)) {
      console.log("✅ Using response.data.data (array)");
      courses = response.data.data;
    } else if (Array.isArray(response.data)) {
      console.log("✅ Using response.data directly (array)");
      courses = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      console.log("✅ Using response.data.data (alternative path)");
      courses = response.data.data;
    } else {
      console.error("❌ Invalid courses response structure:", response.data);
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
    
    // Handle paginated response structure
    if (response.data?.success && response.data?.data && response.data?.pagination) {
      logger.info(`✅ Successfully fetched ${response.data.data.length} courses (page ${response.data.pagination.currentPage})`);
      return {
        courses: response.data.data,
        pagination: response.data.pagination,
      };
    }
    
    // Fallback: If server returns old format (array), wrap it in paginated structure
    if (Array.isArray(response.data?.data)) {
      logger.info(`✅ Received legacy format, ${response.data.data.length} courses`);
      return {
        courses: response.data.data,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.data.length,
          itemsPerPage: response.data.data.length,
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
    let grades: any[] = [];
    
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
      _id: grade.id || grade._id,
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
  any[],
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
  any,
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
  any,
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
    return response.data.data;
  } catch (error: unknown) {
    logger.error("❌ Error fetching student profile:", { error: getErrorMessage(error) });
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch student profile"));
  }
});
