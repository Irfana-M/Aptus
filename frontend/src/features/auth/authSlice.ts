import { createSlice } from "@reduxjs/toolkit";
import type { AuthState} from "../../types/authTypes";
import { registerUser, verifyOtp, resendOtp, logoutUser, loginUser, refreshAccessToken } from "./authThunks";

const initialState: AuthState = {
  loading: false,
  user: null,
  accessToken: null,
  error: null,
  isVerified: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isVerified = false;
      state.error = null;
      state.loading = false;
      localStorage.removeItem("token");
      localStorage.removeItem("signupEmail");
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.isVerified = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken; 
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
       .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isVerified = false;
        state.error = null;
        state.loading = false;
      });
  },
});

export const { logout,clearError } = authSlice.actions;
export default authSlice.reducer;
