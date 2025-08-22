import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthState,
  User,
  Tenant,
  AuthTokens,
  LoginRequest,
} from "../../types/auth";
import apiService from "../../services/api";

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response: any = await apiService.login(credentials);

      if (response.success && response.data) {
        // Store auth data
        await AsyncStorage.multiSet([
          ["user", JSON.stringify(response.data.user)],
          ["tenant", JSON.stringify(response.data.tenant)],
          ["roles", JSON.stringify(response.data.roles)],
          ["permissions", JSON.stringify(response.data.permissions)],
        ]);

        // Set tokens in API service
        await apiService.setTokens(response.data.tokens);

        return response.data;
      } else {
        return rejectWithValue(response.message || "Login failed");
      }
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Clear local storage regardless of API call result
      await AsyncStorage.multiRemove([
        "user",
        "tenant",
        "roles",
        "permissions",
      ]);
      await apiService.setTokens(null);
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  "auth/loadStoredAuth",
  async (_, { rejectWithValue }) => {
    try {
      const [user, tenant, roles, permissions, tokens] =
        await AsyncStorage.multiGet([
          "user",
          "tenant",
          "roles",
          "permissions",
          "tokens",
        ]);

      if (user[1] && tenant[1] && tokens[1]) {
        const userData = JSON.parse(user[1]);
        const tenantData = JSON.parse(tenant[1]);
        const rolesData = roles[1] ? JSON.parse(roles[1]) : [];
        const permissionsData = permissions[1]
          ? JSON.parse(permissions[1])
          : [];
        const tokensData = JSON.parse(tokens[1]);

        // Check if tokens are still valid
        const expiresAt = new Date(tokensData.expiresAt);
        if (expiresAt > new Date()) {
          await apiService.setTokens(tokensData);

          return {
            user: userData,
            tenant: tenantData,
            tokens: tokensData,
            roles: rolesData,
            permissions: permissionsData,
          };
        } else {
          // Tokens expired, clear storage
          await AsyncStorage.multiRemove([
            "user",
            "tenant",
            "roles",
            "permissions",
            "tokens",
          ]);
          return rejectWithValue("Tokens expired");
        }
      }

      return rejectWithValue("No stored auth data");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load stored auth");
    }
  }
);

const initialState: AuthState = {
  user: null,
  tenant: null,
  tokens: null,
  roles: [],
  permissions: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    resetAuth: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tenant = action.payload.tenant;
        state.tokens = action.payload.tokens;
        state.roles = action.payload.roles;
        state.permissions = action.payload.permissions;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return initialState;
      })
      .addCase(logoutUser.rejected, (state) => {
        return initialState;
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tenant = action.payload.tenant;
        state.tokens = action.payload.tokens;
        state.roles = action.payload.roles;
        state.permissions = action.payload.permissions;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadStoredAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = null; // Don't show error for failed auth load
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setLoading, updateUser, resetAuth } =
  authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectTenant = (state: { auth: AuthState }) => state.auth.tenant;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectUserRoles = (state: { auth: AuthState }) => state.auth.roles;
export const selectUserPermissions = (state: { auth: AuthState }) =>
  state.auth.permissions;
