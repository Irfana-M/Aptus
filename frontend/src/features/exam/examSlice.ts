import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { examApi } from "./examApi";
import type { CreateExamDTO, SubmitExamDTO, IExam, IExamResult } from "../../types/examTypes";
import { getErrorMessage } from "../../utils/errorUtils";

interface ExamState {
  exams: IExam[];
  currentExam: IExam | null;
  results: IExamResult[];
  loading: boolean;
  error: string | null;
}

const initialState: ExamState = {
  exams: [],
  currentExam: null,
  results: [],
  loading: false,
  error: null,
};

// Async Thunks
export const createExam = createAsyncThunk(
  "exam/create",
  async (data: CreateExamDTO, { rejectWithValue }) => {
    try {
      const res = await examApi.createExam(data);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getExamsByMentor = createAsyncThunk(
  "exam/getByMentor",
  async (_, { rejectWithValue }) => {
    try {
      const res = await examApi.getExamsByMentor();
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getExamsForStudent = createAsyncThunk(
  "exam/getForStudent",
  async (_, { rejectWithValue }) => {
    try {
      const res = await examApi.getExamsForStudent();
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getExamById = createAsyncThunk(
  "exam/getById",
  async (examId: string, { rejectWithValue }) => {
    try {
      const res = await examApi.getExamById(examId);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const submitExam = createAsyncThunk(
  "exam/submit",
  async (data: SubmitExamDTO, { rejectWithValue }) => {
    try {
      const res = await examApi.submitExam(data);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getStudentResults = createAsyncThunk(
  "exam/getResults",
  async (_, { rejectWithValue }) => {
    try {
      const res = await examApi.getStudentResults();
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getExamResults = createAsyncThunk(
  "exam/getExamResults",
  async (examId: string, { rejectWithValue }) => {
    try {
      const res = await examApi.getExamResults(examId);
      return res.data.data;
    } catch (error) {
       return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const gradeExam = createAsyncThunk(
  "exam/gradeExam",
  async ({ resultId, grades }: { resultId: string; grades: { questionId: string; marks: number; feedback?: string }[] }, { rejectWithValue }) => {
    try {
      const res = await examApi.gradeExam(resultId, grades);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    clearCurrentExam: (state) => {
      state.currentExam = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Specific Success handlers
    builder
      .addCase(createExam.fulfilled, (state, action) => {
        state.loading = false;
        state.exams.push(action.payload);
      })
      .addCase(getExamsByMentor.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(getExamsForStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(getExamById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentExam = action.payload;
      })
      .addCase(submitExam.fulfilled, (state, action) => {
        state.loading = false;
        state.results.push(action.payload);
      })
      .addCase(getStudentResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload; // For student viewing their own results
      })
      .addCase(getExamResults.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload; // For mentor viewing their exam's results
      })
      .addCase(gradeExam.fulfilled, (state, action) => {
        state.loading = false;
        // Update the specific result in the list
        const index = state.results.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.results[index] = action.payload;
        }
      })
      // General Loading/Error state handling (Matchers must come last)
      .addMatcher(
        (action) => action.type.startsWith('exam/') && action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('exam/') && action.type.endsWith('/rejected'),
        (state, action: PayloadAction<string | null>) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { clearCurrentExam, clearError } = examSlice.actions;
export default examSlice.reducer;
