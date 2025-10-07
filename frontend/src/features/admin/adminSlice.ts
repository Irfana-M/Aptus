import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { adminLoginThunk } from "./adminThunk";

interface Admin {
  _id: string;
  email: string;
}

interface AdminState {
  admin: Admin | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  admin: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    logoutAdmin(state) {
      state.admin = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        adminLoginThunk.fulfilled,
        (
          state,
          action: PayloadAction<{
            admin: Admin;
            accessToken: string;
            refreshToken: string;
          }>
        ) => {
          state.loading = false;
          state.admin = action.payload.admin;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
        }
      )
      .addCase(adminLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logoutAdmin } = adminSlice.actions;
export default adminSlice.reducer;
