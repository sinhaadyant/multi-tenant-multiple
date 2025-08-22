import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";
import { tap } from "rxjs/operators";
import {
  LoginRequest,
  LoginResponse,
  AuthTokens,
  User,
  Tenant,
} from "../models/auth.model";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly API_URL = "http://localhost:3000/api/auth";
  private currentTokensSubject = new BehaviorSubject<AuthTokens | null>(null);

  constructor(private http: HttpClient) {
    // Load tokens from localStorage on service initialization
    this.loadTokensFromStorage();
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        if (response.success && response.data) {
          this.setTokens(response.data.tokens);
          this.setUser(response.data.user);
          this.setTenant(response.data.tenant);
          this.setRoles(response.data.roles);
          this.setPermissions(response.data.permissions);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/logout`, {}).pipe(
      tap(() => {
        this.clearAuthData();
      })
    );
  }

  refreshToken(): Observable<any> {
    const tokens = this.getTokens();
    if (!tokens?.refreshToken) {
      throw new Error("No refresh token available");
    }

    return this.http
      .post<any>(`${this.API_URL}/refresh`, {
        refreshToken: tokens.refreshToken,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.setTokens(response.data.tokens);
          }
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/register`, userData);
  }

  acceptInvitation(invitationData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/accept-invitation`, invitationData);
  }

  createInvitation(email: string, roleId: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/invite`, { email, roleId });
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/verify-email`, { token });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.API_URL}/profile`);
  }

  // Token management
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem("tokens", JSON.stringify(tokens));
    this.currentTokensSubject.next(tokens);
  }

  getTokens(): AuthTokens | null {
    const stored = localStorage.getItem("tokens");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Failed to parse stored tokens:", error);
        localStorage.removeItem("tokens");
      }
    }
    return null;
  }

  getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.accessToken || null;
  }

  // User data management
  setUser(user: User): void {
    localStorage.setItem("user", JSON.stringify(user));
  }

  getUser(): User | null {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    return null;
  }

  setTenant(tenant: Tenant): void {
    localStorage.setItem("tenant", JSON.stringify(tenant));
  }

  getTenant(): Tenant | null {
    const stored = localStorage.getItem("tenant");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Failed to parse stored tenant:", error);
        localStorage.removeItem("tenant");
      }
    }
    return null;
  }

  setRoles(roles: string[]): void {
    localStorage.setItem("roles", JSON.stringify(roles));
  }

  getRoles(): string[] {
    const stored = localStorage.getItem("roles");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Failed to parse stored roles:", error);
        localStorage.removeItem("roles");
      }
    }
    return [];
  }

  setPermissions(permissions: string[]): void {
    localStorage.setItem("permissions", JSON.stringify(permissions));
  }

  getPermissions(): string[] {
    const stored = localStorage.getItem("permissions");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Failed to parse stored permissions:", error);
        localStorage.removeItem("permissions");
      }
    }
    return [];
  }

  isAuthenticated(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;

    // Check if token is expired
    const expiresAt = new Date(tokens.expiresAt);
    return expiresAt > new Date();
  }

  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    const roles = this.getRoles();
    return roles.includes(role);
  }

  clearAuthData(): void {
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    localStorage.removeItem("roles");
    localStorage.removeItem("permissions");
    this.currentTokensSubject.next(null);
  }

  private loadTokensFromStorage(): void {
    const tokens = this.getTokens();
    this.currentTokensSubject.next(tokens);
  }
}
