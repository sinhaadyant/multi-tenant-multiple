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
export declare const generateAccessToken: (payload: Omit<TokenPayload, "type">) => string;
/**
 * Generate JWT refresh token
 */
export declare const generateRefreshToken: (payload: Omit<TokenPayload, "type">) => string;
/**
 * Generate both access and refresh tokens
 */
export declare const generateTokenPair: (payload: Omit<TokenPayload, "type">) => TokenPair;
/**
 * Verify JWT token
 */
export declare const verifyToken: (token: string, isRefreshToken?: boolean) => TokenPayload;
/**
 * Extract token from Authorization header
 */
export declare const extractTokenFromHeader: (authHeader: string | undefined) => string | null;
/**
 * Generate secure random token for password reset, email verification, etc.
 */
export declare const generateSecureToken: (length?: number) => string;
/**
 * Hash token for storage (for password reset tokens, etc.)
 */
export declare const hashToken: (token: string) => string;
/**
 * Generate a unique session token
 */
export declare const generateSessionToken: () => string;
/**
 * Check if token is expired
 */
export declare const isTokenExpired: (expiresAt: Date) => boolean;
/**
 * Get token expiration time
 */
export declare const getTokenExpiration: (token: string) => Date | null;
/**
 * Refresh token rotation - generate new refresh token
 */
export declare const rotateRefreshToken: (payload: Omit<TokenPayload, "type">) => TokenPair;
//# sourceMappingURL=jwt.d.ts.map