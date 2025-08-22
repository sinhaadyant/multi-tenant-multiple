"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTenantSettings = exports.validateResourceQuota = exports.tenantAwareQueries = exports.validateTenantAccess = exports.optionalResolveTenant = exports.resolveTenant = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Tenant resolution middleware - identifies tenant from subdomain or header
 */
const resolveTenant = async (req, res, next) => {
    try {
        let tenantIdentifier = null;
        // Method 1: Extract from X-Tenant-ID header
        const tenantIdHeader = req.headers["x-tenant-id"];
        if (tenantIdHeader) {
            tenantIdentifier = tenantIdHeader;
        }
        // Method 2: Extract from subdomain
        if (!tenantIdentifier) {
            const host = req.get("host") || "";
            const subdomain = host.split(".")[0];
            // Skip common subdomains that aren't tenant identifiers
            if (subdomain &&
                !["www", "api", "admin", "app", "localhost"].includes(subdomain)) {
                tenantIdentifier = subdomain;
            }
        }
        // Method 3: Extract from X-Tenant-Slug header
        if (!tenantIdentifier) {
            const tenantSlugHeader = req.headers["x-tenant-slug"];
            if (tenantSlugHeader) {
                tenantIdentifier = tenantSlugHeader;
            }
        }
        // Method 4: Use default tenant for development
        if (!tenantIdentifier && process.env.NODE_ENV === "development") {
            tenantIdentifier = "default";
        }
        if (!tenantIdentifier) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Tenant identifier is required. Please provide X-Tenant-ID header or use a subdomain.",
            });
        }
        // Find tenant by ID, slug, or domain
        const tenant = await prisma.tenant.findFirst({
            where: {
                OR: [
                    { id: tenantIdentifier },
                    { slug: tenantIdentifier },
                    { domain: tenantIdentifier },
                ],
            },
        });
        if (!tenant) {
            return res.status(404).json({
                error: "Tenant Not Found",
                message: `Tenant '${tenantIdentifier}' does not exist`,
            });
        }
        if (tenant.status !== "ACTIVE") {
            return res.status(403).json({
                error: "Tenant Unavailable",
                message: `Tenant '${tenant.name}' is currently ${tenant.status.toLowerCase()}`,
            });
        }
        // Set tenant context
        req.tenantContext = {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            domain: tenant.domain || undefined,
            status: tenant.status,
            settings: tenant.settings,
        };
        next();
    }
    catch (error) {
        console.error("Tenant resolution error:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to resolve tenant",
        });
    }
};
exports.resolveTenant = resolveTenant;
/**
 * Optional tenant resolution - doesn't fail if tenant not found
 */
const optionalResolveTenant = async (req, res, next) => {
    try {
        await (0, exports.resolveTenant)(req, res, next);
    }
    catch (error) {
        // Continue without tenant context if resolution fails
        next();
    }
};
exports.optionalResolveTenant = optionalResolveTenant;
/**
 * Validate tenant access for user
 */
const validateTenantAccess = (req, res, next) => {
    if (!req.user || !req.tenantContext) {
        return res.status(401).json({
            error: "Unauthorized",
            message: "Authentication and tenant context required",
        });
    }
    // Super admins can access any tenant
    if (req.user.roles.includes("Super Admin")) {
        return next();
    }
    // Regular users can only access their own tenant
    if (req.user.tenantId !== req.tenantContext.id) {
        return res.status(403).json({
            error: "Forbidden",
            message: "Access denied to this tenant",
        });
    }
    next();
};
exports.validateTenantAccess = validateTenantAccess;
/**
 * Tenant-aware database queries middleware
 * Automatically adds tenantId filter to database queries
 */
const tenantAwareQueries = (req, res, next) => {
    if (!req.tenantContext) {
        return res.status(400).json({
            error: "Bad Request",
            message: "Tenant context is required",
        });
    }
    // Add tenant ID to request body for POST/PUT requests
    if (req.method === "POST" || req.method === "PUT") {
        if (req.body && typeof req.body === "object") {
            req.body.tenantId = req.tenantContext.id;
        }
    }
    // Add tenant ID to query params for filtering
    req.query.tenantId = req.tenantContext.id;
    next();
};
exports.tenantAwareQueries = tenantAwareQueries;
/**
 * Tenant resource quota validation
 */
const validateResourceQuota = (resourceType) => {
    return async (req, res, next) => {
        if (!req.tenantContext) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Tenant context is required",
            });
        }
        try {
            const settings = req.tenantContext.settings;
            const quotas = settings?.quotas || {};
            let currentCount = 0;
            let maxAllowed = 0;
            switch (resourceType) {
                case "users":
                    currentCount = await prisma.user.count({
                        where: { tenantId: req.tenantContext.id },
                    });
                    maxAllowed = quotas.maxUsers || 1000;
                    break;
                case "roles":
                    currentCount = await prisma.role.count({
                        where: { tenantId: req.tenantContext.id, isSystem: false },
                    });
                    maxAllowed = quotas.maxRoles || 50;
                    break;
                case "files":
                    currentCount = await prisma.file.count({
                        where: { tenantId: req.tenantContext.id },
                    });
                    maxAllowed = quotas.maxFiles || 10000;
                    break;
                default:
                    return next(); // No quota validation for unknown resource types
            }
            if (currentCount >= maxAllowed) {
                return res.status(429).json({
                    error: "Quota Exceeded",
                    message: `Maximum ${resourceType} limit (${maxAllowed}) reached for tenant`,
                    current: currentCount,
                    limit: maxAllowed,
                });
            }
            next();
        }
        catch (error) {
            console.error("Quota validation error:", error);
            next(); // Continue on error to avoid blocking operations
        }
    };
};
exports.validateResourceQuota = validateResourceQuota;
/**
 * Tenant settings validation
 */
const validateTenantSettings = (settingKey) => {
    return (req, res, next) => {
        if (!req.tenantContext) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Tenant context is required",
            });
        }
        const settings = req.tenantContext.settings;
        switch (settingKey) {
            case "allowRegistration":
                if (!settings?.allowRegistration && req.path.includes("/register")) {
                    return res.status(403).json({
                        error: "Registration Disabled",
                        message: "User registration is disabled for this tenant",
                    });
                }
                break;
            case "requireEmailVerification":
                if (settings?.requireEmailVerification) {
                    req.body._requireEmailVerification = true;
                }
                break;
            case "enforcePasswordPolicy":
                if (settings?.enforcePasswordPolicy) {
                    req.body._enforcePasswordPolicy = true;
                }
                break;
        }
        next();
    };
};
exports.validateTenantSettings = validateTenantSettings;
//# sourceMappingURL=tenant.js.map