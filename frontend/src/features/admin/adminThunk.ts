import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi, adminStudentApi, type AddStudentRequestDto, type AddStudentResponseDto, type AdminLoginDto } from "./adminApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import { adminMentorApi } from "./adminApi";
import type { RootState } from "../../app/store";
import type { MentorProfile } from "../mentor/mentorSlice";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { logger } from "../../utils/logger";

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

export const fetchAllStudentsAdmin = createAsyncThunk<
  StudentBaseResponseDto[],
  void,
  { rejectValue: string }
>("admin/fetchAllStudents", async (_, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting fetchAllStudentsAdmin");

    const response = await adminStudentApi.getAllStudents();

    if (!response) {
      logger.error("❌ No response received from API");
      return rejectWithValue("No response received from server");
    }

    let studentsData: any[];

    if (Array.isArray(response.data)) {
      studentsData = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      studentsData = response.data.data;
    } else if (response.data && Array.isArray(response.data.students)) {
      studentsData = response.data.students;
    } else {
      logger.warn(
        "⚠️ Unexpected students API response structure:",
        response.data
      );
      return rejectWithValue("Unexpected response format from server");
    }

    const validatedStudents = studentsData.map((student, index) => {
      if (!student._id && !student.id) {
        logger.warn(`⚠️ Student missing ID at index ${index}:`, student);
        throw new Error("Student data missing ID field");
      }

      if (!student.fullName || !student.email) {
        logger.warn(
          `⚠️ Student missing required fields at index ${index}:`,
          student
        );
        throw new Error("Student data missing required fields");
      }
      const transformedStudent: StudentBaseResponseDto = {
        id: student._id?.toString() || student.id,
        fullName: student.fullName,
        email: student.email,
        phoneNumber: student.phoneNumber || "",
        role: "student",
        isVerified: student.isVerified || false,
        isProfileComplete: student.isProfileComplete || false,
        isPaid: student.isPaid || false,
        isBlocked: student.isBlocked || false,
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
  AddStudentRequestDto,
  { rejectValue: string }
>("admin/addStudent", async (studentData, { rejectWithValue }) => {
  try {
    logger.debug("🔄 Starting addStudentAdmin", studentData);

    const response = await adminStudentApi.addStudent(studentData);

    if (!response.data) {
      logger.error("❌ No response data received from add student API");
      return rejectWithValue("No response received from server");
    }

    logger.info("✅ Student added successfully:", response.data);
    return response.data;
  } catch (error: any) {
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


