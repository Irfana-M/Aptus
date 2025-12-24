import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MentorProfile } from "../mentor/mentorSlice";
import {
  adminLoginThunk,
  fetchMentorProfileAdmin,
  approveMentorAdmin,
  rejectMentorAdmin,
  fetchAllMentorsAdmin,
  fetchMentorsPaginated,
  type MentorPaginatedResponse,
  fetchAllStudentsAdmin,
  fetchStudentsPaginated,
  type StudentPaginatedResponse,
  fetchStudentsWithStats,
  refreshAdminToken,
  addStudentAdmin,
  blockMentorAdmin,
  unblockMentorAdmin,
  updateMentorAdmin,
  addMentorAdmin,
  blockStudentAdmin,
  unblockStudentAdmin,
  updateStudentAdmin,
  assignMentorToTrialClass,
  fetchAvailableMentors,
  fetchTrialClassDetails,
  fetchStudentTrialClasses,
  fetchAllTrialClassesAdmin,
  updateTrialClassStatus,
  fetchAvailableMentorsForCourse,
  createOneToOneCourse,
  type AvailableMentorDto,
  fetchAllCoursesAdmin,
  fetchCoursesPaginated,
  type CoursePaginatedResponse,
  fetchSubjectsByGradeAdmin,
  fetchGradesAdmin,
  fetchAllCourseRequestsAdmin,
  updateCourseRequestStatusAdmin,
  fetchStudentProfile,
} from "./adminThunk";
import { loginUser, refreshAccessToken } from "../auth/authThunks";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import type { StudentBaseResponseDto, CourseRequest } from "../../types/studentTypes";
import type { StudentProfile } from "../../types/student.types";
import type { TrialClass } from "../../types/trialTypes";
import type { AddStudentResponseDto } from "./adminApi";
import type { AvailableMentor } from "../../types/adminTypes";
import type { Course } from "../../types/courseTypes";

interface Admin {
  role: "admin";
  _id: string;
  email: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalStudents: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface MentorPaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}


// TrialClass interface moved to studentTypes.ts

interface AdminState {
  admin: Admin | null;
  accessToken: string | null;
  refreshToken: string | null;
  mentorProfile: MentorProfile | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  mentorsList: MentorProfile[];
  mentorsPagination: MentorPaginationState;
  studentsList: StudentBaseResponseDto[];
  selectedStudent: StudentBaseResponseDto | null;
  trialClasses: TrialClass[];
  availableMentors: AvailableMentor[];
  studentsPagination: PaginationState;
  trialClassDetails: TrialClass | null;
  availableMentorsForCourse: { matches: AvailableMentorDto[]; alternates: AvailableMentorDto[] };
  courseCreationLoading: boolean;
  courseCreationError: string | null;
  courseCreationSuccess: boolean;
  coursesList: Course[];
  grades: { _id: string; name: string; syllabus?: string }[];
  gradesLoading: boolean;
  gradesError?: string;

  subjects: { [gradeId: string]: { _id: string; name: string; gradeId: string }[] };
  subjectsLoading: boolean;
  subjectsError?: string;
  coursesPagination: PaginationState;
  
  courseRequests: CourseRequest[]; 
  courseRequestsLoading: boolean;
  courseRequestsError: string | null;
  selectedStudentProfile: StudentProfile | null;
}

const initialState: AdminState = {
  admin: null,
  accessToken: null,
  refreshToken: null,
  mentorProfile: null,
  mentorsList: [],
  mentorsPagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  },
  studentsList: [],
  selectedStudent: null,
  loading: false,
  error: null,
  success: null,
  trialClasses: [],
  availableMentors: [],
  studentsPagination: {
    currentPage: 1,
    totalPages: 0,
    totalStudents: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  trialClassDetails: null,
  availableMentorsForCourse: { matches: [], alternates: [] },
  courseCreationLoading: false,
  courseCreationError: null,
  courseCreationSuccess: false,
  coursesList: [],
  grades: [],
  gradesLoading: false,
  gradesError: undefined,

  subjects: {},
  subjectsLoading: false,
  subjectsError: undefined,
  coursesPagination: {
    currentPage: 1,
    totalPages: 0,
    totalStudents: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  courseRequests: [],
  courseRequestsLoading: false,
  courseRequestsError: null,
  selectedStudentProfile: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
     resetCoursesList: (state) => {
    state.coursesList = [];
  },
  resetGrades: (state) => {
    state.grades = [];
  },
    logoutAdmin(state) {
      state.admin = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.mentorProfile = null;
      state.mentorsList = [];
      state.studentsList = [];
      state.selectedStudent = null;
      state.error = null;
      state.success = null;
      
      localStorage.removeItem("admin_accessToken");
      localStorage.removeItem("adminAccessToken");
      sessionStorage.removeItem("active_role");
    },
    clearMentorProfile(state) {
      state.mentorProfile = null;
      state.error = null;
    },
    setSelectedStudent(
      state,
      action: PayloadAction<StudentBaseResponseDto | null>
    ) {
      state.selectedStudent = action.payload;
    },
    clearStudentsList(state) {
      state.studentsList = [];
    },
    clearError(state) {
      state.error = null;
    },
    clearSuccess(state) {
      state.success = null;
    },
    clearAvailableMentors: (state) => {
      state.availableMentors = [];
    },
    setStudentsPagination(state, action: PayloadAction<Partial<PaginationState>>) {
      state.studentsPagination = { ...state.studentsPagination, ...action.payload };
    },
    setMentorsPagination(state, action: PayloadAction<Partial<MentorPaginationState>>) {
      state.mentorsPagination = { ...state.mentorsPagination, ...action.payload };
    },
     clearTrialClassDetails: (state) => {
      state.trialClassDetails = null;
    },
    clearTrialClasses: (state) => {
      state.trialClasses = [];
    },
    clearCourseCreationState: (state) => {
  state.availableMentorsForCourse = { matches: [], alternates: [] };
  state.courseCreationError = null;
  state.courseCreationSuccess = false;
},
    updateTrialClassInList: (state, action: PayloadAction<TrialClass>) => {
      const index = state.trialClasses.findIndex((tc: TrialClass) => tc.id === action.payload.id);
      if (index !== -1) {
        state.trialClasses[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(refreshAdminToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        refreshAdminToken.fulfilled,
        (state, action: PayloadAction<AdminLoginResponse>) => {
          state.loading = false;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          if (action.payload.admin) {
            state.admin = { ...action.payload.admin, role: "admin" };
          }
        }
      )
      .addCase(refreshAdminToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.accessToken = null;
        state.refreshToken = null;
      })

      
      .addCase(addStudentAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(
        addStudentAdmin.fulfilled,
        (state, action: PayloadAction<AddStudentResponseDto>) => {
          state.loading = false;
          state.success = action.payload.message;
          if (action.payload.data) {
            state.studentsList.push(action.payload.data);
          }
        }
      )
      .addCase(addStudentAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = null;
      })
      
      .addCase(updateStudentAdmin.fulfilled, (state, action) => {
        const index = state.studentsList.findIndex(
          (s) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.studentsList[index] = action.payload;
        }
        state.loading = false;
      })

      
      .addCase(blockStudentAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(blockStudentAdmin.fulfilled, (state, action) => {
        const index = state.studentsList.findIndex(
          (s) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.studentsList[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(blockStudentAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(unblockStudentAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unblockStudentAdmin.fulfilled, (state, action) => {
        const index = state.studentsList.findIndex(
          (s) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.studentsList[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(unblockStudentAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

  
      .addCase(adminLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        adminLoginThunk.fulfilled,
        (state, action: PayloadAction<AdminLoginResponse>) => {
          state.loading = false;
          state.admin = { ...action.payload.admin, role: "admin" };
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
        }
      )
      .addCase(adminLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(fetchMentorProfileAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMentorProfileAdmin.fulfilled,
        (state, action: PayloadAction<MentorProfile>) => {
          state.loading = false;
          state.mentorProfile = action.payload;
        }
      )
      .addCase(fetchMentorProfileAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(fetchAllMentorsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllMentorsAdmin.fulfilled,
        (state, action: PayloadAction<MentorProfile[]>) => {
          state.loading = false;
          state.mentorsList = action.payload;
        }
      )
      .addCase(fetchAllMentorsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Paginated Mentors
      .addCase(fetchMentorsPaginated.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMentorsPaginated.fulfilled,
        (state, action: PayloadAction<MentorPaginatedResponse>) => {
          state.loading = false;
          state.mentorsList = action.payload.mentors;
          state.mentorsPagination = action.payload.pagination;
        }
      )
      .addCase(fetchMentorsPaginated.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      
      .addCase(fetchAllStudentsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllStudentsAdmin.fulfilled,
        (state, action: PayloadAction<StudentBaseResponseDto[]>) => {
          state.loading = false;
          state.studentsList = action.payload;
        }
      )
      .addCase(fetchAllStudentsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Paginated Students
      .addCase(fetchStudentsPaginated.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchStudentsPaginated.fulfilled,
        (state, action: PayloadAction<StudentPaginatedResponse>) => {
          state.loading = false;
          state.studentsList = action.payload.students;
          // Update studentsPagination with the new format
          state.studentsPagination = {
            currentPage: action.payload.pagination.currentPage,
            totalPages: action.payload.pagination.totalPages,
            totalStudents: action.payload.pagination.totalItems,
            hasNextPage: action.payload.pagination.hasNextPage,
            hasPrevPage: action.payload.pagination.hasPrevPage,
          };
        }
      )
      .addCase(fetchStudentsPaginated.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Mentor Approval
      .addCase(approveMentorAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveMentorAdmin.fulfilled, (state) => {
        if (state.mentorProfile)
          state.mentorProfile.approvalStatus = "approved";
        state.loading = false;
      })
      .addCase(approveMentorAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(rejectMentorAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectMentorAdmin.fulfilled, (state) => {
        if (state.mentorProfile)
          state.mentorProfile.approvalStatus = "rejected";
        state.loading = false;
      })
      .addCase(rejectMentorAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Mentor Operations
      .addCase(blockMentorAdmin.fulfilled, (state, action) => {
        const index = state.mentorsList.findIndex(
          (m) => m._id === action.payload._id
        );
        if (index !== -1) {
          state.mentorsList[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(unblockMentorAdmin.fulfilled, (state, action) => {
        const index = state.mentorsList.findIndex(
          (m) => m._id === action.payload._id
        );
        if (index !== -1) {
          state.mentorsList[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateMentorAdmin.fulfilled, (state, action) => {
        const index = state.mentorsList.findIndex(
          (m) => m._id === action.payload._id
        );
        if (index !== -1) {
          state.mentorsList[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(addMentorAdmin.fulfilled, (state, action) => {
        state.mentorsList.push(action.payload);
        state.loading = false;
      });
          builder
      .addCase(fetchAvailableMentors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableMentors.fulfilled, (state, action: PayloadAction<AvailableMentor[]>) => {
        state.loading = false;
        state.availableMentors = action.payload;
      })
      .addCase(fetchAvailableMentors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    
    builder
      .addCase(assignMentorToTrialClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignMentorToTrialClass.fulfilled, (state) => {
        state.loading = false;
        state.availableMentors = []; 
      })
      .addCase(assignMentorToTrialClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStudentsWithStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentsWithStats.fulfilled, (state, action) => {
        state.loading = false;
        state.studentsList = action.payload.students;
        state.studentsPagination = action.payload.pagination;
      })
      .addCase(fetchStudentsWithStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
       .addCase(fetchTrialClassDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchTrialClassDetails.fulfilled, (state, action) => {
      state.loading = false;
      state.trialClassDetails = action.payload;
    })
    .addCase(fetchTrialClassDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
    
builder
  .addCase(fetchStudentTrialClasses.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(fetchStudentTrialClasses.fulfilled, (state, action) => {
    state.loading = false;
    state.trialClasses = action.payload; 
  })
  .addCase(fetchStudentTrialClasses.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload as string;
  })
      .addCase(updateTrialClassStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTrialClassStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        const index = state.trialClasses.findIndex((tc: TrialClass) => tc.id === action.payload.id);
        if (index !== -1) {
          state.trialClasses[index] = action.payload;
        }
        
        if (state.trialClassDetails && state.trialClassDetails.id === action.payload.id) {
          state.trialClassDetails = action.payload;
        }
      })
      .addCase(updateTrialClassStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch All Trial Classes
      .addCase(fetchAllTrialClassesAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTrialClassesAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.trialClasses = action.payload;
      })
      .addCase(fetchAllTrialClassesAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch available mentors for course
.addCase(fetchAvailableMentorsForCourse.pending, (state) => {
  state.loading = true;
  state.courseCreationError = null;
})
.addCase(fetchAvailableMentorsForCourse.fulfilled, (state, action) => {
  state.loading = false;
  state.availableMentorsForCourse = action.payload;
})
.addCase(fetchAvailableMentorsForCourse.rejected, (state, action) => {
  state.loading = false;
  state.courseCreationError = action.payload as string;
})

// Create 1:1 course
.addCase(createOneToOneCourse.pending, (state) => {
  state.courseCreationLoading = true;
  state.courseCreationError = null;
  state.courseCreationSuccess = false;
})
.addCase(createOneToOneCourse.fulfilled, (state) => {
  state.courseCreationLoading = false;
  state.courseCreationSuccess = true;
  state.availableMentorsForCourse = { matches: [], alternates: [] }; // reset
})
.addCase(createOneToOneCourse.rejected, (state, action) => {
  state.courseCreationLoading = false;
  state.courseCreationError = action.payload as string;
  state.courseCreationSuccess = false;
})
// In extraReducers
.addCase(fetchAllCoursesAdmin.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(fetchAllCoursesAdmin.fulfilled, (state, action) => {
  console.log("📦 Storing courses in Redux:", {
    payloadLength: action.payload?.length,
    payloadType: Array.isArray(action.payload) ? 'array' : typeof action.payload,
    firstItem: action.payload?.[0]
  });
  
  // Ensure we're storing an array
  if (Array.isArray(action.payload)) {
    state.coursesList = action.payload;
  } else {
    console.error("❌ Payload is not an array!", action.payload);
    state.coursesList = [];
  }
  
  state.loading = false;
})
.addCase(fetchAllCoursesAdmin.rejected, (state, action) => {
  console.error("❌ Failed to fetch courses:", action.payload);
  state.loading = false;
  state.error = action.payload as string;
  state.coursesList = []; // Reset to empty array
})

// Paginated Courses
.addCase(fetchCoursesPaginated.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(
  fetchCoursesPaginated.fulfilled,
  (state, action: PayloadAction<CoursePaginatedResponse>) => {
    state.loading = false;
    state.coursesList = action.payload.courses;
    // Update coursesPagination with the new format
    state.coursesPagination = {
      currentPage: action.payload.pagination.currentPage,
      totalPages: action.payload.pagination.totalPages,
      totalStudents: action.payload.pagination.totalItems, // Using totalStudents as totalItems for consistency
      hasNextPage: action.payload.pagination.hasNextPage,
      hasPrevPage: action.payload.pagination.hasPrevPage,
    };
  }
)
.addCase(fetchCoursesPaginated.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload as string;
})

.addCase(fetchGradesAdmin.pending, (state) => {
  state.gradesLoading = true;
  state.gradesError = undefined;
})
.addCase(fetchGradesAdmin.fulfilled, (state, action) => {
  console.log("📦 Storing grades in Redux:", {
    payloadLength: action.payload?.length,
    payloadType: Array.isArray(action.payload) ? 'array' : typeof action.payload
  });
  
  // Ensure we're storing an array
  if (Array.isArray(action.payload)) {
    state.grades = action.payload;
  } else {
    console.error("❌ Grades payload is not an array!", action.payload);
    state.grades = [];
  }
  
  state.gradesLoading = false;
})
.addCase(fetchGradesAdmin.rejected, (state, action) => {
  console.error("❌ Failed to fetch grades:", action.payload);
  state.gradesLoading = false;
  state.gradesError = action.payload as string;
  state.grades = []; // Reset to empty array
})
      // Subjects by grade
      .addCase(fetchSubjectsByGradeAdmin.pending, (state) => {
        state.subjectsLoading = true;
        state.subjectsError = undefined;
      })
      .addCase(fetchSubjectsByGradeAdmin.fulfilled, (state, action) => {
        const { gradeId, subjects } = action.payload;
        state.subjects[gradeId] = subjects;
        state.subjectsLoading = false;
      })
      .addCase(fetchSubjectsByGradeAdmin.rejected, (state, action) => {
        state.subjectsLoading = false;
        state.subjectsError = action.payload;
      })
      
      // Course Requests
      .addCase(fetchAllCourseRequestsAdmin.pending, (state) => {
        state.courseRequestsLoading = true;
        state.courseRequestsError = null;
      })
      .addCase(fetchAllCourseRequestsAdmin.fulfilled, (state, action) => {
        state.courseRequestsLoading = false;
        state.courseRequests = action.payload;
      })
      .addCase(fetchAllCourseRequestsAdmin.rejected, (state, action) => {
        state.courseRequestsLoading = false;
        state.courseRequestsError = action.payload as string;
      })
      
      .addCase(updateCourseRequestStatusAdmin.fulfilled, (state) => {
        state.loading = false;
        // Optionally update the specific item in the list if not re-fetching
      })
      
      // Student Profile
      .addCase(fetchStudentProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedStudentProfile = action.payload;
      })
      .addCase(fetchStudentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reset admin state when a regular user logs in or refreshes
      .addCase(loginUser.fulfilled, (state) => {
        state.admin = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.mentorProfile = null;
        localStorage.removeItem("admin_accessToken");
      })
      .addCase(refreshAccessToken.fulfilled, (state) => {
        state.admin = null;
        state.accessToken = null;
        state.refreshToken = null;
        localStorage.removeItem("admin_accessToken");
      });
  },
});


export const {
  logoutAdmin,
  clearMentorProfile,
  setSelectedStudent,
  clearStudentsList,
  clearError,
  clearSuccess,
  clearAvailableMentors,
  setStudentsPagination,
  setMentorsPagination,
  clearTrialClassDetails,
  clearTrialClasses,
  updateTrialClassInList,
  clearCourseCreationState,
  resetCoursesList,
  resetGrades
} = adminSlice.actions;
export default adminSlice.reducer;