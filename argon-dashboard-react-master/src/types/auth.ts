export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLogin: Date | null;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  tenantId?: string;
}

export interface LoginResponse {
  user: User;
  tenant: Tenant;
  tokens: AuthTokens;
  roles: string[];
  permissions: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
  invitationToken?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: string;
    emailVerified: boolean;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  message: string;
  requiresVerification: boolean;
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  tokens: AuthTokens | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
