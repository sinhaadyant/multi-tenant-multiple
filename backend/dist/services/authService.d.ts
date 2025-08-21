import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, RefreshTokenResponse, ForgotPasswordResponse, ResetPasswordResponse, ChangePasswordResponse, VerifyEmailResponse } from '../types/auth';
export declare class AuthService {
    /**
     * User login
     */
    login(data: LoginRequest, ipAddress?: string, userAgent?: string): Promise<LoginResponse>;
    /**
     * User registration
     */
    register(data: RegisterRequest): Promise<RegisterResponse>;
    /**
     * Refresh token
     */
    refreshToken(refreshToken: string): Promise<RefreshTokenResponse>;
    /**
     * Logout
     */
    logout(token: string): Promise<void>;
    /**
     * Forgot password
     */
    forgotPassword(email: string, tenantId?: string): Promise<ForgotPasswordResponse>;
    /**
     * Reset password
     */
    resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse>;
    /**
     * Change password
     */
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ChangePasswordResponse>;
    /**
     * Verify email
     */
    verifyEmail(token: string): Promise<VerifyEmailResponse>;
    /**
     * Log audit event
     */
    private logAuditEvent;
}
//# sourceMappingURL=authService.d.ts.map