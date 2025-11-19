import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi, adminStudentApi, type AddStudentRequestDto, type AddStudentResponseDto, type AdminLoginDto, type StudentsWithStatsResponse } from "./adminApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import { adminMentorApi } from "./adminApi";
import type { RootState } from "../../app/store";
import type { MentorProfile } from "../mentor/mentorSlice";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { logger } from "../../utils/logger";
import { z } from 'zod';
import { 
  adminCreateStudentSchema, 
  type AdminCreateStudentInput 
} from '../../lib/schemas/student.schemas';

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
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Login failed");
  }
});

export const refreshAdminToken = createAsyncThunk(
  "admin/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApi.refreshToken();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to refresh token"
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
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch mentors"
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
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to fetch mentor"
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
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to approve mentor"
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
  } catch (error: any) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.message || "Failed to reject mentor"
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
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to block mentor"
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
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to unblock mentor"
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
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to block student"
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
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to unblock student"
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
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update mentor"
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
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to add mentor"
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
  } catch (error: any) {
    logger.error("❌ Error fetching students:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch students"
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(err => err.message).join(', ');
      logger.error("❌ Validation error adding student:", errorMessage);
      return rejectWithValue(`Validation failed: ${errorMessage}`);
    }
    
    logger.error("❌ Error adding student:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return rejectWithValue(
      error.response?.data?.message || "Failed to add student"
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
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to update student"
    );
  }
});



export const fetchAllTrialClassesAdmin = createAsyncThunk(
  'admin/fetchAllTrialClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminStudentApi.getTrialClasses();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trial classes');
    }
  }
);


export const fetchAvailableMentors = createAsyncThunk(
  'admin/fetchAvailableMentors',
  async (params: { subjectId: string; preferredDate: string }, { rejectWithValue }) => {
    try {
      const response = await adminStudentApi.getAvailableMentors(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch available mentors');
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
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign mentor');
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
  } catch (error: any) {
    logger.error("❌ Error fetching students with stats:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch students with statistics"
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
  } catch (error: any) {
    logger.error("❌ Error fetching student trial classes:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch student trial classes"
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
  } catch (error: any) {
    logger.error("❌ Error fetching trial class details:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return rejectWithValue(
      error.response?.data?.message || "Failed to fetch trial class details"
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
  } catch (error: any) {
    logger.error("❌ Error updating trial class status:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return rejectWithValue(
      error.response?.data?.message || "Failed to update trial class status"
    );
  }
});




