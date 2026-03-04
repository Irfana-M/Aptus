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
  createCourseThunk,
  updateCourseAdmin,
  type AvailableMentorDto,
  fetchAllCoursesAdmin,
  fetchCoursesPaginated,
  type CoursePaginatedResponse,
  fetchSubjectsByGradeAdmin,
  fetchGradesAdmin,
  fetchAllCourseRequestsAdmin,
  updateCourseRequestStatusAdmin,
  fetchCourseRequestsPaginated,
  fetchStudentProfile,
  fetchAllEnrollmentsAdmin,
  fetchEnrollmentsPaginated,
  fetchAllMentorRequestsAdmin,
} from "./adminThunk";
import { loginUser, refreshAccessToken } from "../auth/authThunks";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import type { StudentProfile } from "../../types/student.types";
import type { TrialClass } from "../../types/trialTypes";
import type { AddStudentResponseDto } from "./adminApi";
import type { MentorRequestListItem, CourseRequest } from "../../types/adminTypes";
import type { Course } from "../../types/courseTypes";
import type { Enrollment } from "../../types/enrollmentTypes";

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
  availableMentors: { matches: AvailableMentorDto[]; alternates: AvailableMentorDto[] };
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
  courseRequestsPagination: PaginationState;

  selectedStudentProfile: StudentProfile | null;
  studentProfileLoading: boolean;
  
  enrollmentsList: Enrollment[];
  enrollmentsLoading: boolean;
  enrollmentsError: string | null;
  enrollmentsPagination: PaginationState;
  studentsLoading: boolean;
  mentorsLoading: boolean;
  mentorProfileLoading: boolean;
  trialClassesLoading: boolean;
  trialClassDetailsLoading: boolean;
  coursesLoading: boolean;
  mentorAssignmentRequests: MentorRequestListItem[]; // strictly typed
}

const hasToken = !!(localStorage.getItem("admin_accessToken") || localStorage.getItem("adminAccessToken"));

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
  loading: hasToken, // Initialize as loading if we have a token to rehydrate
  error: null,
  success: null,
  trialClasses: [],
  availableMentors: { matches: [], alternates: [] },
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
  courseRequestsPagination: {
    currentPage: 1,
    totalPages: 0,
    totalStudents: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  selectedStudentProfile: null,
  enrollmentsList: [],
  enrollmentsLoading: false,
  enrollmentsError: null,
  enrollmentsPagination: {
    currentPage: 1,
    totalPages: 0,
    totalStudents: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  studentProfileLoading: false,
  studentsLoading: false,
  mentorsLoading: false,
  mentorProfileLoading: false,
  trialClassesLoading: false,
  trialClassDetailsLoading: false,
  coursesLoading: false,
  mentorAssignmentRequests: [],
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
      state.availableMentors = { matches: [], alternates: [] };
    },
    setStudentsPagination(state, action: PayloadAction<Partial<PaginationState>>) {
      state.studentsPagination = { ...state.studentsPagination, ...action.payload };
    },
    setMentorsPagination(state, action: PayloadAction<Partial<MentorPaginationState>>) {
      state.mentorsPagination = { ...state.mentorsPagination, ...action.payload };
    },
    setCourseRequestsPagination(state, action: PayloadAction<Partial<PaginationState>>) {
      state.courseRequestsPagination = { ...state.courseRequestsPagination, ...action.payload };
    },
    setEnrollmentsPagination(state, action: PayloadAction<Partial<PaginationState>>) {
      state.enrollmentsPagination = { ...state.enrollmentsPagination, ...action.payload };
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
        state.mentorProfileLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMentorProfileAdmin.fulfilled,
        (state, action: PayloadAction<MentorProfile>) => {
          state.mentorProfileLoading = false;
          state.mentorProfile = action.payload;
        }
      )
      .addCase(fetchMentorProfileAdmin.rejected, (state, action) => {
        state.mentorProfileLoading = false;
        state.error = action.payload as string;
      })

      
      .addCase(fetchAllMentorsAdmin.pending, (state) => {
        state.mentorsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchAllMentorsAdmin.fulfilled,
        (state, action: PayloadAction<MentorProfile[]>) => {
          state.mentorsLoading = false;
          state.mentorsList = action.payload;
        }
      )
      .addCase(fetchAllMentorsAdmin.rejected, (state, action) => {
        state.mentorsLoading = false;
        state.error = action.payload as string;
      })

      // Paginated Mentors
      .addCase(fetchMentorsPaginated.pending, (state) => {
        state.mentorsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMentorsPaginated.fulfilled,
        (state, action: PayloadAction<MentorPaginatedResponse>) => {
          state.mentorsLoading = false;
          state.mentorsList = action.payload.mentors;
          state.mentorsPagination = action.payload.pagination;
        }
      )
      .addCase(fetchMentorsPaginated.rejected, (state, action) => {
        state.mentorsLoading = false;
        state.error = action.payload as string;
      })

      
      .addCase(fetchAllStudentsAdmin.pending, (state) => {
        state.studentsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchAllStudentsAdmin.fulfilled,
        (state, action: PayloadAction<StudentBaseResponseDto[]>) => {
          state.studentsLoading = false;
          state.studentsList = action.payload;
        }
      )
      .addCase(fetchAllStudentsAdmin.rejected, (state, action) => {
        state.studentsLoading = false;
        state.error = action.payload as string;
      })

      // Paginated Students
      .addCase(fetchStudentsPaginated.pending, (state) => {
        state.studentsLoading = true;
        state.error = null;
      })
      .addCase(
        fetchStudentsPaginated.fulfilled,
        (state, action: PayloadAction<StudentPaginatedResponse>) => {
          state.studentsLoading = false;
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
        state.studentsLoading = false;
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
        state.mentorsLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableMentors.fulfilled, (state, action: PayloadAction<{ matches: AvailableMentorDto[]; alternates: AvailableMentorDto[] } | AvailableMentorDto[]>) => {
        state.mentorsLoading = false;
        if (Array.isArray(action.payload)) {
          state.availableMentors = { matches: action.payload, alternates: [] };
        } else {
          state.availableMentors = action.payload;
        }
      })
      .addCase(fetchAvailableMentors.rejected, (state, action) => {
        state.mentorsLoading = false;
        state.error = action.payload as string;
      });

    
    builder
      .addCase(assignMentorToTrialClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignMentorToTrialClass.fulfilled, (state) => {
        state.loading = false;
        state.availableMentors = { matches: [], alternates: [] }; 
      })
      .addCase(assignMentorToTrialClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchStudentsWithStats.pending, (state) => {
        state.studentsLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentsWithStats.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.studentsList = action.payload.students;
        state.studentsPagination = action.payload.pagination;
      })
      .addCase(fetchStudentsWithStats.rejected, (state, action) => {
        state.studentsLoading = false;
        state.error = action.payload as string;
      })
       .addCase(fetchTrialClassDetails.pending, (state) => {
      state.trialClassDetailsLoading = true;
      state.error = null;
    })
    .addCase(fetchTrialClassDetails.fulfilled, (state, action) => {
      state.trialClassDetailsLoading = false;
      state.trialClassDetails = action.payload;
    })
    .addCase(fetchTrialClassDetails.rejected, (state, action) => {
      state.trialClassDetailsLoading = false;
      state.error = action.payload as string;
    })
    
builder
  .addCase(fetchStudentTrialClasses.pending, (state) => {
    state.trialClassesLoading = true;
    state.error = null;
  })
  .addCase(fetchStudentTrialClasses.fulfilled, (state, action) => {
    state.trialClassesLoading = false;
    state.trialClasses = action.payload; 
  })
  .addCase(fetchStudentTrialClasses.rejected, (state, action) => {
    state.trialClassesLoading = false;
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
        state.trialClassesLoading = true;
        state.error = null;
      })
      .addCase(fetchAllTrialClassesAdmin.fulfilled, (state, action) => {
        state.trialClassesLoading = false;
        state.trialClasses = action.payload;
      })
      .addCase(fetchAllTrialClassesAdmin.rejected, (state, action) => {
        state.trialClassesLoading = false;
        state.error = action.payload as string;
      })
      // Fetch available mentors for course
.addCase(fetchAvailableMentorsForCourse.pending, (state) => {
  state.courseCreationLoading = true;
  state.courseCreationError = null;
})
.addCase(fetchAvailableMentorsForCourse.fulfilled, (state, action) => {
  state.courseCreationLoading = false;
  state.availableMentorsForCourse = action.payload;
})
.addCase(fetchAvailableMentorsForCourse.rejected, (state, action) => {
  state.courseCreationLoading = false;
  state.courseCreationError = action.payload as string;
})

// Create course
.addCase(createCourseThunk.pending, (state) => {
  state.courseCreationLoading = true;
  state.courseCreationError = null;
  state.courseCreationSuccess = false;
})
.addCase(createCourseThunk.fulfilled, (state) => {
  state.courseCreationLoading = false;
  state.courseCreationSuccess = true;
  state.availableMentorsForCourse = { matches: [], alternates: [] }; // reset
})
.addCase(createCourseThunk.rejected, (state, action) => {
  state.courseCreationLoading = false;
  state.courseCreationError = action.payload as string;
  state.courseCreationSuccess = false;
})
.addCase(updateCourseAdmin.pending, (state) => {
  state.courseCreationLoading = true;
  state.courseCreationError = null;
  state.courseCreationSuccess = false;
})
.addCase(updateCourseAdmin.fulfilled, (state, action) => {
  state.courseCreationLoading = false;
  state.courseCreationSuccess = true;
  state.availableMentorsForCourse = { matches: [], alternates: [] }; // reset
  // Update the item in the list if it exists
  if (Array.isArray(state.coursesList)) {
    const index = state.coursesList.findIndex(c => c._id === action.payload._id);
    if (index !== -1) {
      state.coursesList[index] = action.payload;
    }
  }
})
.addCase(updateCourseAdmin.rejected, (state, action) => {
  state.courseCreationLoading = false;
  state.courseCreationError = action.payload as string;
  state.courseCreationSuccess = false;
})
// In extraReducers
.addCase(fetchAllCoursesAdmin.pending, (state) => {
  state.coursesLoading = true;
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
  
  state.coursesLoading = false;
})
.addCase(fetchAllCoursesAdmin.rejected, (state, action) => {
  console.error("❌ Failed to fetch courses:", action.payload);
  state.coursesLoading = false;
  state.error = action.payload as string;
  state.coursesList = []; // Reset to empty array
})

// Paginated Courses
.addCase(fetchCoursesPaginated.pending, (state) => {
  state.coursesLoading = true;
  state.error = null;
})
.addCase(
  fetchCoursesPaginated.fulfilled,
  (state, action: PayloadAction<CoursePaginatedResponse>) => {
    state.coursesLoading = false;
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
  state.coursesLoading = false;
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
      
      // Paginated Course Requests
      .addCase(fetchCourseRequestsPaginated.pending, (state) => {
        state.courseRequestsLoading = true;
        state.courseRequestsError = null;
      })
      .addCase(fetchCourseRequestsPaginated.fulfilled, (state, action) => {
        state.courseRequestsLoading = false;
        state.courseRequests = action.payload.requests;
        state.courseRequestsPagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          totalStudents: action.payload.pagination.totalItems,
          hasNextPage: action.payload.pagination.hasNextPage,
          hasPrevPage: action.payload.pagination.hasPrevPage,
        };
      })
      .addCase(fetchCourseRequestsPaginated.rejected, (state, action) => {
        state.courseRequestsLoading = false;
        state.courseRequestsError = action.payload as string;
      })
      
      
      .addCase(updateCourseRequestStatusAdmin.fulfilled, (state) => {
        state.loading = false;
        // Optionally update the specific item in the list if not re-fetching
      })

      // Mentor Requests (Admin)
      .addCase(fetchAllMentorRequestsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMentorRequestsAdmin.fulfilled, (state, action) => {
        state.loading = false;
        // We'll need to store these requests. 
        // Assuming we add `mentorRequests` to state or just reuse courseRequests for now if structure allows? 
        // No, let's look at defining a new state property `mentorAssignmentRequests`.
        // Ideally we should have defined it in AdminState interface first.
        // For now, let's assume we will add it.
        state.mentorAssignmentRequests = action.payload; 
      })
      .addCase(fetchAllMentorRequestsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Student Profile
      .addCase(fetchStudentProfile.pending, (state) => {
        state.studentProfileLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        state.studentProfileLoading = false;
        state.selectedStudentProfile = action.payload;
      })
      .addCase(fetchStudentProfile.rejected, (state, action) => {
        state.studentProfileLoading = false;
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
      })
      
      // Fetch All Enrollments
      .addCase(fetchAllEnrollmentsAdmin.pending, (state) => {
        state.enrollmentsLoading = true;
        state.enrollmentsError = null;
      })
      .addCase(fetchAllEnrollmentsAdmin.fulfilled, (state, action) => {
        state.enrollmentsLoading = false;
        state.enrollmentsList = action.payload;
      })
      .addCase(fetchAllEnrollmentsAdmin.rejected, (state, action) => {
        state.enrollmentsLoading = false;
        state.enrollmentsError = action.payload as string;
      })

      // Paginated Enrollments
      .addCase(fetchEnrollmentsPaginated.pending, (state) => {
        state.enrollmentsLoading = true;
        state.enrollmentsError = null;
      })
      .addCase(fetchEnrollmentsPaginated.fulfilled, (state, action) => {
        state.enrollmentsLoading = false;
        state.enrollmentsList = action.payload.enrollments;
        state.enrollmentsPagination = {
          currentPage: action.payload.pagination.currentPage,
          totalPages: action.payload.pagination.totalPages,
          totalStudents: action.payload.pagination.totalItems,
          hasNextPage: action.payload.pagination.hasNextPage,
          hasPrevPage: action.payload.pagination.hasPrevPage,
        };
      })
      .addCase(fetchEnrollmentsPaginated.rejected, (state, action) => {
        state.enrollmentsLoading = false;
        state.enrollmentsError = action.payload as string;
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
  setCourseRequestsPagination,
  setEnrollmentsPagination,
  clearTrialClassDetails,
  clearTrialClasses,
  updateTrialClassInList,
  clearCourseCreationState,
  resetCoursesList,
  resetGrades
} = adminSlice.actions;
export default adminSlice.reducer;