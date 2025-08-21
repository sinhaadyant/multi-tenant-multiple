export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  tenantId?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    status: string;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin: Date | null;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
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

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
}

export interface ForgotPasswordRequest {
  email: string;
  tenantId?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string; // Only in development mode
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface Setup2FARequest {
  password: string;
}

export interface Setup2FAResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface Verify2FARequest {
  token: string;
  code: string;
}

export interface Verify2FAResponse {
  message: string;
  backupCodes?: string[];
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  status: string;
  roles: string[];
  permissions: string[];
  lastLogin: Date | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  settings?: any;
}

export interface SessionInfo {
  id: string;
  deviceInfo: any;
  ipAddress: string | null;
  createdAt: Date;
  expiresAt: Date;
  isCurrentSession: boolean;
}

export interface AuthError {
  error: string;
  message: string;
  code?: string;
  details?: any;
}
