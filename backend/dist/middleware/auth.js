"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitByUser = exports.isSuperAdmin = exports.enforceTenantIsolation = exports.authorizeRoles = exports.authorize = exports.optionalAuth = exports.authenticate = void 0;
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
/**
 * Authentication middleware - verifies JWT token and sets user info
 */
const authenticate = async (req, res, next) => {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (!token) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Access token is required',
            });
        }
        // Verify token
        const decoded = (0, jwt_1.verifyToken)(token);
        if (decoded.type !== 'access') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token type',
            });
        }
        // Check if session exists and is not revoked
        const session = await prisma.session.findFirst({
            where: {
                token,
                isRevoked: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            include: {
                user: {
                    include: {
                        tenant: true,
                        userRoles: {
                            include: {
                                role: true,
                            },
                        },
                    },
                },
            },
        });
        if (!session || !session.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Session not found or expired',
            });
        }
        // Check user status
        if (session.user.status !== 'ACTIVE') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User account is not active',
            });
        }
        // Check tenant status
        if (session.user.tenant.status !== 'ACTIVE') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Tenant account is not active',
            });
        }
        // Get user permissions from roles
        const permissions = new Set();
        const roleNames = [];
        for (const userRole of session.user.userRoles) {
            if (userRole.isActive && (!userRole.expiresAt || userRole.expiresAt > new Date())) {
                roleNames.push(userRole.role.name);
                const rolePermissions = userRole.role.permissions;
                rolePermissions.forEach(permission => permissions.add(permission));
            }
        }
        // Set user and tenant info on request
        req.user = {
            id: session.user.id,
            tenantId: session.user.tenantId,
            email: session.user.email,
            roles: roleNames,
            permissions: Array.from(permissions),
        };
        req.tenant = {
            id: session.user.tenant.id,
            name: session.user.tenant.name,
            slug: session.user.tenant.slug,
            domain: session.user.tenant.domain || undefined,
            status: session.user.tenant.status,
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Authentication failed',
        });
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
        if (token) {
            await (0, exports.authenticate)(req, res, next);
        }
        else {
            next();
        }
    }
    catch (error) {
        // If authentication fails, continue without user info
        next();
    }
};
exports.optionalAuth = optionalAuth;
/**
 * Permission-based authorization middleware
 */
const authorize = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }
        const permissions = Array.isArray(requiredPermissions)
            ? requiredPermissions
            : [requiredPermissions];
        // Check if user has any of the required permissions
        const hasPermission = permissions.some(permission => req.user.permissions.includes(permission));
        if (!hasPermission) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
                required: permissions,
                current: req.user.permissions,
            });
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Role-based authorization middleware
 */
const authorizeRoles = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        // Check if user has any of the required roles
        const hasRole = roles.some(role => req.user.roles.includes(role));
        if (!hasRole) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient role privileges',
                required: roles,
                current: req.user.roles,
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
/**
 * Tenant isolation middleware - ensures user can only access their tenant's data
 */
const enforceTenantIsolation = (req, res, next) => {
    if (!req.user || !req.tenant) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }
    // Add tenant filter to query parameters
    req.query.tenantId = req.user.tenantId;
    next();
};
exports.enforceTenantIsolation = enforceTenantIsolation;
/**
 * Super admin check - allows cross-tenant access
 */
const isSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required',
        });
    }
    if (!req.user.roles.includes('Super Admin')) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Super admin privileges required',
        });
    }
    next();
};
exports.isSuperAdmin = isSuperAdmin;
/**
 * Rate limiting per user
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const userRequests = new Map();
    return (req, res, next) => {
        if (!req.user) {
            return next(); // Skip rate limiting for unauthenticated requests
        }
        const userId = req.user.id;
        const now = Date.now();
        const userLimit = userRequests.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
            // Reset or initialize user limit
            userRequests.set(userId, {
                count: 1,
                resetTime: now + windowMs,
            });
            return next();
        }
        if (userLimit.count >= maxRequests) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded for user',
                retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
            });
        }
        userLimit.count++;
        next();
    };
};
exports.rateLimitByUser = rateLimitByUser;
//# sourceMappingURL=auth.js.map