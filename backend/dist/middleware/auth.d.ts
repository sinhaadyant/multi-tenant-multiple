import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                tenantId: string;
                email: string;
                roles: string[];
                permissions: string[];
            };
            tenant?: {
                id: string;
                name: string;
                slug: string;
                domain?: string;
                status: string;
            };
        }
    }
}
/**
 * Authentication middleware - verifies JWT token and sets user info
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Permission-based authorization middleware
 */
export declare const authorize: (requiredPermissions: string | string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Role-based authorization middleware
 */
export declare const authorizeRoles: (requiredRoles: string | string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Tenant isolation middleware - ensures user can only access their tenant's data
 */
export declare const enforceTenantIsolation: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Super admin check - allows cross-tenant access
 */
export declare const isSuperAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Rate limiting per user
 */
export declare const rateLimitByUser: (maxRequests?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map