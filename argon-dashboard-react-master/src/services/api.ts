import axios from "axios";
import { AuthTokens } from "../types/auth";

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
let currentTokens: AuthTokens | null = null;

export const setTokens = (tokens: AuthTokens | null) => {
  currentTokens = tokens;
  if (tokens) {
    localStorage.setItem("tokens", JSON.stringify(tokens));
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${tokens.accessToken}`;
  } else {
    localStorage.removeItem("tokens");
    delete api.defaults.headers.common["Authorization"];
  }
};

export const getTokens = (): AuthTokens | null => {
  if (currentTokens) return currentTokens;

  const stored = localStorage.getItem("tokens");
  if (stored) {
    try {
      const tokens = JSON.parse(stored);
      setTokens(tokens);
      return tokens;
    } catch (error) {
      console.error("Failed to parse stored tokens:", error);
      localStorage.removeItem("tokens");
    }
  }
  return null;
};

// Set tenant header
export const setTenantHeader = (tenantId: string) => {
  api.defaults.headers.common["X-Tenant-ID"] = tenantId;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Ensure token is set
    const tokens = getTokens();
    if (tokens && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const tokens = getTokens();
      if (tokens?.refreshToken) {
        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken: tokens.refreshToken }
          );

          const newTokens = response.data.data.tokens;
          setTokens(newTokens);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          setTokens(null);
          window.location.href = "/auth/login";
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
