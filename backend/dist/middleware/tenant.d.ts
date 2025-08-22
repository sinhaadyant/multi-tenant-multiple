import { Request, Response, NextFunction } from "express";
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
export declare const resolveTenant: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Optional tenant resolution - doesn't fail if tenant not found
 */
export declare const optionalResolveTenant: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validate tenant access for user
 */
export declare const validateTenantAccess: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Tenant-aware database queries middleware
 * Automatically adds tenantId filter to database queries
 */
export declare const tenantAwareQueries: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Tenant resource quota validation
 */
export declare const validateResourceQuota: (resourceType: string) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Tenant settings validation
 */
export declare const validateTenantSettings: (settingKey: string) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=tenant.d.ts.map