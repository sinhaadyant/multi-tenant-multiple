import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extend Express Request type to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantContext?: {
        id: string;
        name: string;
        slug: string;
        domain?: string;
        status: string;
        settings?: any;
      };
    }
  }
}

/**
 * Tenant resolution middleware - identifies tenant from subdomain or header
 */
export const resolveTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let tenantIdentifier: string | null = null;

    // Method 1: Extract from X-Tenant-ID header
    const tenantIdHeader = req.headers["x-tenant-id"] as string;
    if (tenantIdHeader) {
      tenantIdentifier = tenantIdHeader;
    }

    // Method 2: Extract from subdomain
    if (!tenantIdentifier) {
      const host = req.get("host") || "";
      const subdomain = host.split(".")[0];

      // Skip common subdomains that aren't tenant identifiers
      if (
        subdomain &&
        !["www", "api", "admin", "app", "localhost"].includes(subdomain)
      ) {
        tenantIdentifier = subdomain;
      }
    }

    // Method 3: Extract from X-Tenant-Slug header
    if (!tenantIdentifier) {
      const tenantSlugHeader = req.headers["x-tenant-slug"] as string;
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
        message:
          "Tenant identifier is required. Please provide X-Tenant-ID header or use a subdomain.",
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
        message: `Tenant '${
          tenant.name
        }' is currently ${tenant.status.toLowerCase()}`,
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
  } catch (error) {
    console.error("Tenant resolution error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to resolve tenant",
    });
  }
};

/**
 * Optional tenant resolution - doesn't fail if tenant not found
 */
export const optionalResolveTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await resolveTenant(req, res, next);
  } catch (error) {
    // Continue without tenant context if resolution fails
    next();
  }
};

/**
 * Validate tenant access for user
 */
export const validateTenantAccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

/**
 * Tenant-aware database queries middleware
 * Automatically adds tenantId filter to database queries
 */
export const tenantAwareQueries = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

/**
 * Tenant resource quota validation
 */
export const validateResourceQuota = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Tenant context is required",
      });
    }

    try {
      const settings = req.tenantContext.settings as any;
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
    } catch (error) {
      console.error("Quota validation error:", error);
      next(); // Continue on error to avoid blocking operations
    }
  };
};

/**
 * Tenant settings validation
 */
export const validateTenantSettings = (settingKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenantContext) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Tenant context is required",
      });
    }

    const settings = req.tenantContext.settings as any;

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
