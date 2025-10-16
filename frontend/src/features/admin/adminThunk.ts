import { createAsyncThunk } from "@reduxjs/toolkit";
import { adminApi, type AdminLoginDto } from "./adminApi";
import type{ AdminLoginResponse } from "../../types/dtoTypes";
export const adminLoginThunk = createAsyncThunk<
  AdminLoginResponse,
  AdminLoginDto,
  { rejectValue: string }
>("admin/login", async (payload, { rejectWithValue }) => {
  try {
    const response = await adminApi.login(payload);
    return response.data; 
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Login failed");
  }
});
