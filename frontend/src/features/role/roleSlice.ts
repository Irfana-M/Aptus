import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from "../../api/api";
import { getApiErrorMessage } from "../../utils/errorUtils";


export interface VerifyRoleResponse {
  success: boolean;
  role?: 'mentor' | 'student';
  userId?: string;
  email?: string;
  user?: {
    id: string;
    email: string;
    role: 'mentor' | 'student';
    fullName?: string;
    name?: string;
    phoneNumber?: string;
  };
  tokenInfo?: {
    issuedAt: string;
    expiresAt: string;
  };
  verifiedAt?: string;
}

export interface RoleOnlyResponse {
  success: boolean;
  role: string;
  userId: string;
  email: string;
}


export const roleApi = {
  
  verifyRoleWithToken: (expectedRole?: string) => {
    return api.get<VerifyRoleResponse>('/role/verify', {
      headers: expectedRole ? { 'x-expected-role': expectedRole } : {}
    });
  },

  getRoleOnly: () => {
    return api.get<RoleOnlyResponse>('/role-only');
  },

  
  getUserRoleById: (userId: string) => {
    return api.get<RoleOnlyResponse>(`/role/${userId}`);
  },
};

export const verifyUserRole = createAsyncThunk(
  'role/verifyUserRole',
  async (expectedRole: string | undefined, { rejectWithValue }) => {
    try {
      const response = await roleApi.verifyRoleWithToken(expectedRole);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to verify role'));
    }
  }
);

export const getUserRoleOnly = createAsyncThunk(
  'role/getUserRoleOnly',
  async (_, { rejectWithValue }) => {
    try {
      const response = await roleApi.getRoleOnly();
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to get role'));
    }
  }
);

export const getUserRoleById = createAsyncThunk(
  'role/getUserRoleById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await roleApi.getUserRoleById(userId);
      return response.data;
    } catch (error: unknown) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to get user role'));
    }
  }
);



interface RoleState {
  loading: boolean;
  error: string | null;
  role: 'mentor' | 'student' | null;
  userId: string | null;
  email: string | null;
  user: VerifyRoleResponse['user'] | null;
  verifiedAt: string | null;
}

const initialState: RoleState = {
  loading: false,
  error: null,
  role: null,
  userId: null,
  email: null,
  user: null,
  verifiedAt: null,
};

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    clearRole: (state) => {
      state.role = null;
      state.userId = null;
      state.email = null;
      state.user = null;
      state.verifiedAt = null;
      state.error = null;
    },
    setRole: (state, action: PayloadAction<VerifyRoleResponse>) => {
      state.role = action.payload.role || null;
      state.userId = action.payload.userId || null;
      state.email = action.payload.email || null;
      state.user = action.payload.user || null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Verify User Role
    builder
      .addCase(verifyUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.role = action.payload.user?.role || action.payload.role || null;
        state.userId = action.payload.user?.id || action.payload.userId || null;
        state.email = action.payload.user?.email || action.payload.email || null;
        state.user = action.payload.user;
        state.verifiedAt = action.payload.verifiedAt || new Date().toISOString();
      })
      .addCase(verifyUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.role = null;
        state.userId = null;
        state.email = null;
        state.user = null;
      });

    // Get Role Only
    builder
      .addCase(getUserRoleOnly.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserRoleOnly.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.role = action.payload.role as 'mentor' | 'student';
        state.userId = action.payload.userId;
        state.email = action.payload.email;
      })
      .addCase(getUserRoleOnly.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get User Role By ID
    builder
      .addCase(getUserRoleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserRoleById.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.role = action.payload.role as 'mentor' | 'student';
        state.userId = action.payload.userId;
        state.email = action.payload.email;
      })
      .addCase(getUserRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearRole, setRole, setLoading, setError } = roleSlice.actions;

// Selectors
export const selectRole = (state: { role: RoleState }) => state.role.role;
export const selectUserId = (state: { role: RoleState }) => state.role.userId;
export const selectUserEmail = (state: { role: RoleState }) => state.role.email;
export const selectUser = (state: { role: RoleState }) => state.role.user;
export const selectIsLoading = (state: { role: RoleState }) => state.role.loading;
export const selectError = (state: { role: RoleState }) => state.role.error;
export const selectIsVerified = (state: { role: RoleState }) => !!state.role.verifiedAt;
export const selectVerifiedAt = (state: { role: RoleState }) => state.role.verifiedAt;

export default roleSlice.reducer;