import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User, Tenant, AuthTokens } from "../../types/auth";

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

// Try to load from localStorage on initialization
const loadStoredAuth = (): Partial<AuthState> => {
  try {
    const storedTokens = localStorage.getItem("tokens");
    const storedUser = localStorage.getItem("user");
    const storedTenant = localStorage.getItem("tenant");
    const storedRoles = localStorage.getItem("roles");
    const storedPermissions = localStorage.getItem("permissions");

    if (storedTokens && storedUser) {
      return {
        tokens: JSON.parse(storedTokens),
        user: JSON.parse(storedUser),
        tenant: storedTenant ? JSON.parse(storedTenant) : null,
        roles: storedRoles ? JSON.parse(storedRoles) : [],
        permissions: storedPermissions ? JSON.parse(storedPermissions) : [],
        isAuthenticated: true,
      };
    }
  } catch (error) {
    console.error("Failed to load stored auth data:", error);
    // Clear corrupted data
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    localStorage.removeItem("roles");
    localStorage.removeItem("permissions");
  }
  return {};
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    ...initialState,
    ...loadStoredAuth(),
  },
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        user: User;
        tenant: Tenant;
        tokens: AuthTokens;
        roles: string[];
        permissions: string[];
      }>
    ) => {
      const { user, tenant, tokens, roles, permissions } = action.payload;

      state.user = user;
      state.tenant = tenant;
      state.tokens = tokens;
      state.roles = roles;
      state.permissions = permissions;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;

      // Store in localStorage
      localStorage.setItem("tokens", JSON.stringify(tokens));
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("tenant", JSON.stringify(tenant));
      localStorage.setItem("roles", JSON.stringify(roles));
      localStorage.setItem("permissions", JSON.stringify(permissions));
    },
    logout: (state) => {
      state.user = null;
      state.tenant = null;
      state.tokens = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      // Clear localStorage
      localStorage.removeItem("tokens");
      localStorage.removeItem("user");
      localStorage.removeItem("tenant");
      localStorage.removeItem("roles");
      localStorage.removeItem("permissions");
    },
    updateTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload;
      localStorage.setItem("tokens", JSON.stringify(action.payload));
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  loginSuccess,
  logout,
  updateTokens,
  updateUser,
  clearError,
} = authSlice.actions;

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
