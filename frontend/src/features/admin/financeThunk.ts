import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAllPayments } from "./financeApi";
import { getErrorMessage } from "../../utils/errorUtils";

export const fetchFinanceData = createAsyncThunk(
  "admin/fetchFinanceData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllPayments();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
