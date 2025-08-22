import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthTokens } from "../types/auth";

const API_BASE_URL = "http://localhost:3000/api";

class ApiService {
  private baseURL: string;
  private tokens: AuthTokens | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadTokensFromStorage();
  }

  private async loadTokensFromStorage(): Promise<void> {
    try {
      const storedTokens = await AsyncStorage.getItem("tokens");
      if (storedTokens) {
        this.tokens = JSON.parse(storedTokens);
      }
    } catch (error) {
      console.error("Failed to load tokens from storage:", error);
    }
  }

  async setTokens(tokens: AuthTokens | null): Promise<void> {
    this.tokens = tokens;
    try {
      if (tokens) {
        await AsyncStorage.setItem("tokens", JSON.stringify(tokens));
      } else {
        await AsyncStorage.removeItem("tokens");
      }
    } catch (error) {
      console.error("Failed to save tokens to storage:", error);
    }
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.tokens?.accessToken) {
      headers["Authorization"] = `Bearer ${this.tokens.accessToken}`;
    }

    // Add default tenant header
    headers["X-Tenant-ID"] = "default";

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = "GET", body, headers: customHeaders } = options;

    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...customHeaders };

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && this.tokens?.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          const newHeaders = { ...this.getHeaders(), ...customHeaders };
          const retryConfig: RequestInit = {
            method,
            headers: newHeaders,
          };

          if (body && method !== "GET") {
            retryConfig.body = JSON.stringify(body);
          }

          const retryResponse = await fetch(url, retryConfig);
          return this.handleResponse<T>(retryResponse);
        } else {
          // Refresh failed, clear tokens
          await this.setTokens(null);
          throw new Error("Authentication failed");
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      if (contentType?.includes("application/json")) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      throw new Error(errorMessage);
    }

    if (contentType?.includes("application/json")) {
      return await response.json();
    }

    return response.text() as unknown as T;
  }

  private async refreshToken(): Promise<boolean> {
    if (!this.tokens?.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: this.tokens.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.tokens) {
          await this.setTokens(data.data.tokens);
          return true;
        }
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    return false;
  }

  // Auth endpoints
  async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) {
    return this.request("/auth/login", {
      method: "POST",
      body: credentials,
    });
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async getProfile() {
    return this.request("/auth/profile");
  }

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.request("/auth/register", {
      method: "POST",
      body: userData,
    });
  }

  // User management endpoints
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return this.request(`/users${query ? `?${query}` : ""}`);
  }

  async createUser(userData: any) {
    return this.request("/users", {
      method: "POST",
      body: userData,
    });
  }

  async updateUser(userId: string, userData: any) {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: userData,
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  // Role management endpoints
  async getRoles() {
    return this.request("/roles");
  }

  async createRole(roleData: any) {
    return this.request("/roles", {
      method: "POST",
      body: roleData,
    });
  }

  async updateRole(roleId: string, roleData: any) {
    return this.request(`/roles/${roleId}`, {
      method: "PUT",
      body: roleData,
    });
  }

  async deleteRole(roleId: string) {
    return this.request(`/roles/${roleId}`, {
      method: "DELETE",
    });
  }
}

export const apiService = new ApiService();
export default apiService;
