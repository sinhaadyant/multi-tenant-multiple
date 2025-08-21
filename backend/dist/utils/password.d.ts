/**
 * Hash password using bcrypt
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compare password with hash
 */
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
/**
 * Password strength validation
 */
export interface PasswordStrength {
    isValid: boolean;
    score: number;
    feedback: string[];
}
export declare const validatePasswordStrength: (password: string) => PasswordStrength;
/**
 * Generate random password
 */
export declare const generateRandomPassword: (length?: number) => string;
/**
 * Check if password has been compromised (basic check against common passwords)
 */
export declare const isCommonPassword: (password: string) => boolean;
//# sourceMappingURL=password.d.ts.map