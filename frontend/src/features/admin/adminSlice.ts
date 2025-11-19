import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MentorProfile } from "../mentor/mentorSlice";
import {
  adminLoginThunk,
  fetchMentorProfileAdmin,
  approveMentorAdmin,
  rejectMentorAdmin,
  fetchAllMentorsAdmin,
  fetchAllStudentsAdmin,
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
} from "./adminThunk";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import type { AddStudentResponseDto } from "./adminApi";
import type { AvailableMentor } from "../../types/adminTypes";

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


interface TrialClass {
  id: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  subject: {
    id: string;
    subjectName: string;
    syllabus: string;
    grade: number;
  };
  status: 'requested' | 'assigned' | 'completed' | 'cancelled';
  preferredDate: string;
  preferredTime: string;
  scheduledDateTime?: string;
  mentor?: {
    id: string;
    name: string;
    email: string;
  };
  meetLink?: string;
  notes?: string;
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AdminState {
  admin: Admin | null;
  accessToken: string | null;
  refreshToken: string | null;
  mentorProfile: MentorProfile | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  mentorsList: MentorProfile[];
  studentsList: StudentBaseResponseDto[];
  selectedStudent: StudentBaseResponseDto | null;
  trialClasses: TrialClass[];
  availableMentors: AvailableMentor[];
  studentsPagination: PaginationState;
  trialClassDetails: TrialClass | null;
}

const initialState: AdminState = {
  admin: null,
  accessToken: null,
  refreshToken: null,
  mentorProfile: null,
  mentorsList: [],
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
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
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
     clearTrialClassDetails: (state) => {
      state.trialClassDetails = null;
    },
    clearTrialClasses: (state) => {
      state.trialClasses = [];
    },
    updateTrialClassInList: (state, action: PayloadAction<TrialClass>) => {
      const index = state.trialClasses.findIndex(tc => tc.id === action.payload.id);
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
        
        const index = state.trialClasses.findIndex(tc => tc.id === action.payload.id);
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
  clearTrialClassDetails,
  clearTrialClasses,
  updateTrialClassInList,
} = adminSlice.actions;
export default adminSlice.reducer;