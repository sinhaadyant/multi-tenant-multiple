import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  type: "access" | "refresh";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (
  payload: Omit<TokenPayload, "type">
): string => {
  const tokenPayload: TokenPayload = {
    ...payload,
    type: "access",
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    issuer: "multi-tenant-rbac",
    audience: "multi-tenant-app",
  } as any);
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (
  payload: Omit<TokenPayload, "type">
): string => {
  const tokenPayload: TokenPayload = {
    ...payload,
    type: "refresh",
  };

  return jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    issuer: "multi-tenant-rbac",
    audience: "multi-tenant-app",
  } as any);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (
  payload: Omit<TokenPayload, "type">
): TokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculate expiration time
  const expiresIn = process.env.JWT_EXPIRES_IN || "15m";
  const expiresAt = new Date();

  // Parse expiration time (supports formats like '15m', '1h', '7d')
  const timeValue = parseInt(expiresIn.slice(0, -1));
  const timeUnit = expiresIn.slice(-1);

  switch (timeUnit) {
    case "m":
      expiresAt.setMinutes(expiresAt.getMinutes() + timeValue);
      break;
    case "h":
      expiresAt.setHours(expiresAt.getHours() + timeValue);
      break;
    case "d":
      expiresAt.setDate(expiresAt.getDate() + timeValue);
      break;
    default:
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Default to 15 minutes
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
};

/**
 * Verify JWT token
 */
export const verifyToken = (
  token: string,
  isRefreshToken = false
): TokenPayload => {
  const secret = isRefreshToken
    ? process.env.JWT_REFRESH_SECRET!
    : process.env.JWT_SECRET!;

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: "multi-tenant-rbac",
      audience: "multi-tenant-app",
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    } else {
      throw new Error("Token verification failed");
    }
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (
  authHeader: string | undefined
): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

/**
 * Generate secure random token for password reset, email verification, etc.
 */
export const generateSecureToken = (length = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Hash token for storage (for password reset tokens, etc.)
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generate a unique session token
 */
export const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString("base64url");
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Refresh token rotation - generate new refresh token
 */
export const rotateRefreshToken = (
  payload: Omit<TokenPayload, "type">
): TokenPair => {
  return generateTokenPair(payload);
};
