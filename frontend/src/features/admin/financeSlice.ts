import { createSlice } from "@reduxjs/toolkit";
import { fetchFinanceData } from "./financeThunk";

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface Payment {
  _id: string;
  studentId: {
    _id: string;
    fullName: string;
    email: string;
  };
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  invoiceId: string;
  purpose: string;
  createdAt: string;
}

interface FinanceState {
  payments: Payment[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  payments: [],
  pagination: null,
  loading: false,
  error: null,
};

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    clearFinanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinanceData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinanceData.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFinanceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearFinanceError } = financeSlice.actions;
export default financeSlice.reducer;
