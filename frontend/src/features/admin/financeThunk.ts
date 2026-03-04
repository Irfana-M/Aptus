import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAllPayments } from "./financeApi";
import { getErrorMessage } from "../../utils/errorUtils";

interface FetchFinanceParams {
  page?: number;
  limit?: number;
}
export const fetchFinanceData = createAsyncThunk(
  "admin/fetchFinanceData",
  async (params: FetchFinanceParams = {}, { rejectWithValue }) => {
    try {
      const { page=1, limit=10 } = params;
      const response = await getAllPayments(page, limit);
      return response;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
