"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateRefreshToken = exports.getTokenExpiration = exports.isTokenExpired = exports.generateSessionToken = exports.hashToken = exports.generateSecureToken = exports.extractTokenFromHeader = exports.verifyToken = exports.generateTokenPair = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate JWT access token
 */
const generateAccessToken = (payload) => {
    const tokenPayload = {
        ...payload,
        type: 'access',
    };
    return jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'multi-tenant-rbac',
        audience: 'multi-tenant-app',
    });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (payload) => {
    const tokenPayload = {
        ...payload,
        type: 'refresh',
    };
    return jsonwebtoken_1.default.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'multi-tenant-rbac',
        audience: 'multi-tenant-app',
    });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Generate both access and refresh tokens
 */
const generateTokenPair = (payload) => {
    const accessToken = (0, exports.generateAccessToken)(payload);
    const refreshToken = (0, exports.generateRefreshToken)(payload);
    // Calculate expiration time
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const expiresAt = new Date();
    // Parse expiration time (supports formats like '15m', '1h', '7d')
    const timeValue = parseInt(expiresIn.slice(0, -1));
    const timeUnit = expiresIn.slice(-1);
    switch (timeUnit) {
        case 'm':
            expiresAt.setMinutes(expiresAt.getMinutes() + timeValue);
            break;
        case 'h':
            expiresAt.setHours(expiresAt.getHours() + timeValue);
            break;
        case 'd':
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
exports.generateTokenPair = generateTokenPair;
/**
 * Verify JWT token
 */
const verifyToken = (token, isRefreshToken = false) => {
    const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret, {
            issuer: 'multi-tenant-rbac',
            audience: 'multi-tenant-app',
        });
        return decoded;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token has expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        else {
            throw new Error('Token verification failed');
        }
    }
};
exports.verifyToken = verifyToken;
/**
 * Extract token from Authorization header
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
exports.extractTokenFromHeader = extractTokenFromHeader;
/**
 * Generate secure random token for password reset, email verification, etc.
 */
const generateSecureToken = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
/**
 * Hash token for storage (for password reset tokens, etc.)
 */
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
exports.hashToken = hashToken;
/**
 * Generate a unique session token
 */
const generateSessionToken = () => {
    return crypto_1.default.randomBytes(32).toString('base64url');
};
exports.generateSessionToken = generateSessionToken;
/**
 * Check if token is expired
 */
const isTokenExpired = (expiresAt) => {
    return new Date() > expiresAt;
};
exports.isTokenExpired = isTokenExpired;
/**
 * Get token expiration time
 */
const getTokenExpiration = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (decoded && decoded.exp) {
            return new Date(decoded.exp * 1000);
        }
        return null;
    }
    catch (error) {
        return null;
    }
};
exports.getTokenExpiration = getTokenExpiration;
/**
 * Refresh token rotation - generate new refresh token
 */
const rotateRefreshToken = (payload) => {
    return (0, exports.generateTokenPair)(payload);
};
exports.rotateRefreshToken = rotateRefreshToken;
//# sourceMappingURL=jwt.js.map