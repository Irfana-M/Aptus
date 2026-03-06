import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  requestTrialClass,
  fetchStudentTrialClasses,
  fetchTrialClassById,
  submitTrialFeedback,
  cancelTrialClass,
  fetchGrades,
  fetchSubjectsByGrade,
  fetchSubjectsByGradeAndSyllabus,
  updateTrialClass,
} from "./studentTrialThunk";
import type { TrialClassResponse, Grade, Subject } from "../../../types/trial.types";

interface StudentTrialState {
  trialClasses: TrialClassResponse[];
  currentTrialClass: TrialClassResponse | null;
  loading: boolean;
  error: string | null;
  bookingStatus: "idle" | "loading" | "success" | "failed";
  feedbackStatus: "idle" | "loading" | "success" | "failed";
  grades: Grade[];
  subjects: Subject[];
  selectedGrade: string | null;
  gradesLoading: boolean;
  subjectsLoading: boolean;
  educationTypes: Array<{ id: string; name: string; description: string }>;
  selectedEducationType: string | null;
}

const initialState: StudentTrialState = {
  trialClasses: [],
  currentTrialClass: null,
  loading: false,
  error: null,
  bookingStatus: "idle",
  feedbackStatus: "idle",
  grades: [],
  subjects: [],
  selectedGrade: null,
  gradesLoading: false,
  subjectsLoading: false,
  educationTypes: [
    {
      id: "CBSE",
      name: "CBSE",
      description: "Central Board of Secondary Education",
    },
    {
      id: "ICSE",
      name: "ICSE",
      description: "Indian Certificate of Secondary Education",
    },
    {
      id: "STATE",
      name: "State Board",
      description: "State Specific Syllabus",
    },
  ],
  selectedEducationType: null,
};

const studentTrialSlice = createSlice({
  name: "studentTrial",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearBookingStatus: (state) => {
      state.bookingStatus = "idle";
    },
    clearFeedbackStatus: (state) => {
      state.feedbackStatus = "idle";
    },
    setCurrentTrialClass: (state, action) => {
      state.currentTrialClass = action.payload;
    },
    setGrades: (state, action: PayloadAction<Grade[]>) => {
      state.grades = action.payload;
    },
    setSubjects: (state, action: PayloadAction<Subject[]>) => {
      state.subjects = action.payload;
    },
    setSelectedGrade: (state, action: PayloadAction<string | null>) => {
      state.selectedGrade = action.payload;
      state.subjects = [];
    },
    setSelectedEducationType: (state, action: PayloadAction<string | null>) => {
      state.selectedEducationType = action.payload;
      state.grades = [];
      state.subjects = [];
    },
    clearFormData: (state) => {
      state.selectedEducationType = null;
      state.selectedGrade = null;
      state.subjects = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestTrialClass.pending, (state) => {
        state.loading = true;
        state.bookingStatus = "loading";
        state.error = null;
      })
      .addCase(requestTrialClass.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingStatus = "success";
        state.trialClasses.unshift(action.payload);
        state.error = null;
      })
      .addCase(requestTrialClass.rejected, (state, action) => {
        state.loading = false;
        state.bookingStatus = "failed";
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchStudentTrialClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentTrialClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.trialClasses = action.payload;
        state.error = null;
      })
      .addCase(fetchStudentTrialClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder.addCase(fetchTrialClassById.fulfilled, (state, action) => {
      state.currentTrialClass = action.payload;
    });

    builder
      .addCase(submitTrialFeedback.pending, (state) => {
        state.feedbackStatus = "loading";
        state.error = null;
      })
      .addCase(submitTrialFeedback.fulfilled, (state, action) => {
        state.feedbackStatus = "success";
        const index = state.trialClasses.findIndex(
          (tc) => tc.id === action.payload.id
        );
        if (index !== -1) {
          state.trialClasses[index] = action.payload;
        }
        if (state.currentTrialClass?.id === action.payload.id) {
          state.currentTrialClass = action.payload;
        }
        state.error = null;
      })
      .addCase(submitTrialFeedback.rejected, (state, action) => {
        state.feedbackStatus = "failed";
        state.error = action.payload as string;
      });

    builder.addCase(cancelTrialClass.fulfilled, (state, action) => {
      const index = state.trialClasses.findIndex(
        (tc) => tc.id === action.payload.id
      );
      if (index !== -1) {
        state.trialClasses[index] = action.payload;
      }
      if (state.currentTrialClass?.id === action.payload.id) {
        state.currentTrialClass = action.payload;
      }
    });

    builder
      .addCase(fetchGrades.pending, (state) => {
        state.gradesLoading = true;
        state.error = null;
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.gradesLoading = false;
        state.grades = action.payload;
      })
      .addCase(fetchGrades.rejected, (state, action) => {
        state.gradesLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSubjectsByGrade.pending, (state) => {
        state.subjectsLoading = true;
        state.error = null;
      })
      .addCase(fetchSubjectsByGrade.fulfilled, (state, action) => {
        state.subjectsLoading = false;
        state.subjects = action.payload;
      })
      .addCase(fetchSubjectsByGrade.rejected, (state, action) => {
        state.subjectsLoading = false;
        state.error = action.payload as string;
      });
    builder
      .addCase(fetchSubjectsByGradeAndSyllabus.pending, (state) => {
        state.subjectsLoading = true;
        state.error = null;
      })
      .addCase(fetchSubjectsByGradeAndSyllabus.fulfilled, (state, action) => {
        state.subjectsLoading = false;
        state.subjects = action.payload;
      })
      .addCase(fetchSubjectsByGradeAndSyllabus.rejected, (state, action) => {
        state.subjectsLoading = false;
        state.error = action.payload as string;
      });
      // features/trial/student/studentTrialSlice.ts - Add to extraReducers
builder
  .addCase(updateTrialClass.pending, (state) => {
    state.loading = true;
    state.bookingStatus = "loading";
    state.error = null;
  })
  .addCase(updateTrialClass.fulfilled, (state, action) => {
    state.loading = false;
    state.bookingStatus = "success";
    
    // Update the specific trial class in the array
    const index = state.trialClasses.findIndex(tc => tc.id === action.payload.id);
    if (index !== -1) {
      state.trialClasses[index] = action.payload;
    }
    
    // Update current trial class if it's the one being edited
    if (state.currentTrialClass?.id === action.payload.id) {
      state.currentTrialClass = action.payload;
    }
    
    state.error = null;
  })
  .addCase(updateTrialClass.rejected, (state, action) => {
    state.loading = false;
    state.bookingStatus = "failed";
    state.error = action.payload as string;
  });
  },
});

export const {
  clearError,
  clearBookingStatus,
  clearFeedbackStatus,
  setCurrentTrialClass,
  setGrades,
  setSubjects,
  setSelectedGrade,
  clearFormData
} = studentTrialSlice.actions;

export default studentTrialSlice.reducer;
