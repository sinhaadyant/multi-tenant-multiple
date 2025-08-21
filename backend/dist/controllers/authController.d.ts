import { Request, Response } from 'express';
/**
 * Validation rules for login
 */
export declare const loginValidation: import("express-validator").ValidationChain[];
/**
 * Validation rules for registration
 */
export declare const registerValidation: import("express-validator").ValidationChain[];
/**
 * Validation rules for refresh token
 */
export declare const refreshTokenValidation: import("express-validator").ValidationChain[];
/**
 * Validation rules for forgot password
 */
export declare const forgotPasswordValidation: import("express-validator").ValidationChain[];
/**
 * Validation rules for reset password
 */
export declare const resetPasswordValidation: import("express-validator").ValidationChain[];
/**
 * Validation rules for change password
 */
export declare const changePasswordValidation: import("express-validator").ValidationChain[];
/**
 * Validation rules for verify email
 */
export declare const verifyEmailValidation: import("express-validator").ValidationChain[];
/**
 * User login
 */
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * User registration
 */
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Refresh token
 */
export declare const refreshToken: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * User logout
 */
export declare const logout: (req: Request, res: Response) => Promise<void>;
/**
 * Forgot password
 */
export declare const forgotPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Reset password
 */
export declare const resetPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Change password
 */
export declare const changePassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Verify email
 */
export declare const verifyEmail: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get current user profile
 */
export declare const getProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Health check for auth service
 */
export declare const healthCheck: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map