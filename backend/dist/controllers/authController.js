"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = exports.acceptInvitation = exports.createInvitation = exports.getProfile = exports.verifyEmail = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.register = exports.login = exports.acceptInvitationValidation = exports.createInvitationValidation = exports.verifyEmailValidation = exports.changePasswordValidation = exports.resetPasswordValidation = exports.forgotPasswordValidation = exports.refreshTokenValidation = exports.registerValidation = exports.loginValidation = void 0;
const express_validator_1 = require("express-validator");
const authService_1 = require("../services/authService");
const authService = new authService_1.AuthService();
/**
 * Validation rules for login
 */
exports.loginValidation = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("password").isLength({ min: 1 }).withMessage("Password is required"),
];
/**
 * Validation rules for registration
 */
exports.registerValidation = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
    (0, express_validator_1.body)("firstName")
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage("First name must be between 1 and 50 characters"),
    (0, express_validator_1.body)("lastName")
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage("Last name must be between 1 and 50 characters"),
];
/**
 * Validation rules for refresh token
 */
exports.refreshTokenValidation = [
    (0, express_validator_1.body)("refreshToken")
        .isLength({ min: 1 })
        .withMessage("Refresh token is required"),
];
/**
 * Validation rules for forgot password
 */
exports.forgotPasswordValidation = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
];
/**
 * Validation rules for reset password
 */
exports.resetPasswordValidation = [
    (0, express_validator_1.body)("token").isLength({ min: 1 }).withMessage("Reset token is required"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
];
/**
 * Validation rules for change password
 */
exports.changePasswordValidation = [
    (0, express_validator_1.body)("currentPassword")
        .isLength({ min: 1 })
        .withMessage("Current password is required"),
    (0, express_validator_1.body)("newPassword")
        .isLength({ min: 8 })
        .withMessage("New password must be at least 8 characters long"),
];
/**
 * Validation rules for verify email
 */
exports.verifyEmailValidation = [
    (0, express_validator_1.body)("token")
        .isLength({ min: 1 })
        .withMessage("Verification token is required"),
];
/**
 * Validation rules for create invitation
 */
exports.createInvitationValidation = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("roleId")
        .isLength({ min: 1 })
        .withMessage("Role ID is required"),
];
/**
 * Validation rules for accept invitation
 */
exports.acceptInvitationValidation = [
    (0, express_validator_1.body)("token")
        .isLength({ min: 1 })
        .withMessage("Invitation token is required"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long"),
    (0, express_validator_1.body)("firstName")
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage("First name must be between 1 and 50 characters"),
    (0, express_validator_1.body)("lastName")
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage("Last name must be between 1 and 50 characters"),
];
/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: "Validation Error",
            message: "Please check your input data",
            details: errors.array(),
        });
    }
    return null;
};
/**
 * User login
 */
const login = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        const loginData = {
            email: req.body.email,
            password: req.body.password,
            rememberMe: req.body.rememberMe || false,
            tenantId: req.tenantContext?.id || req.body.tenantId,
        };
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get("User-Agent");
        const result = await authService.login(loginData, ipAddress, userAgent);
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(401).json({
            error: "Authentication Failed",
            message: error instanceof Error ? error.message : "Login failed",
        });
    }
};
exports.login = login;
/**
 * User registration
 */
const register = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        const registerData = {
            email: req.body.email,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            tenantId: req.tenantContext?.id || req.body.tenantId,
            invitationToken: req.body.invitationToken,
        };
        const result = await authService.register(registerData);
        res.status(201).json({
            success: true,
            message: result.message,
            data: result,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(400).json({
            error: "Registration Failed",
            message: error instanceof Error ? error.message : "Registration failed",
        });
    }
};
exports.register = register;
/**
 * Refresh token
 */
const refreshToken = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Token refresh error:", error);
        res.status(401).json({
            error: "Token Refresh Failed",
            message: error instanceof Error ? error.message : "Token refresh failed",
        });
    }
};
exports.refreshToken = refreshToken;
/**
 * User logout
 */
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (token) {
            await authService.logout(token);
        }
        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            error: "Logout Failed",
            message: "An error occurred during logout",
        });
    }
};
exports.logout = logout;
/**
 * Forgot password
 */
const forgotPassword = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        const { email } = req.body;
        const tenantId = req.tenantContext?.id;
        const result = await authService.forgotPassword(email, tenantId);
        res.status(200).json({
            success: true,
            message: result.message,
            ...(result.resetToken && { data: { resetToken: result.resetToken } }),
        });
    }
    catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            error: "Request Failed",
            message: "An error occurred while processing your request",
        });
    }
};
exports.forgotPassword = forgotPassword;
/**
 * Reset password
 */
const resetPassword = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        const { token, password } = req.body;
        const result = await authService.resetPassword(token, password);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Reset password error:", error);
        res.status(400).json({
            error: "Password Reset Failed",
            message: error instanceof Error ? error.message : "Password reset failed",
        });
    }
};
exports.resetPassword = resetPassword;
/**
 * Change password
 */
const changePassword = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Authentication required",
            });
        }
        const { currentPassword, newPassword } = req.body;
        const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Change password error:", error);
        res.status(400).json({
            error: "Password Change Failed",
            message: error instanceof Error ? error.message : "Password change failed",
        });
    }
};
exports.changePassword = changePassword;
/**
 * Verify email
 */
const verifyEmail = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        const { token } = req.body;
        const result = await authService.verifyEmail(token);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Email verification error:", error);
        res.status(400).json({
            error: "Email Verification Failed",
            message: error instanceof Error ? error.message : "Email verification failed",
        });
    }
};
exports.verifyEmail = verifyEmail;
/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Authentication required",
            });
        }
        res.status(200).json({
            success: true,
            data: {
                user: req.user,
                tenant: req.tenant,
            },
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            error: "Request Failed",
            message: "Failed to get user profile",
        });
    }
};
exports.getProfile = getProfile;
/**
 * Create user invitation
 */
const createInvitation = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Authentication required",
            });
        }
        const { email, roleId } = req.body;
        const tenantId = req.user.tenantId;
        const result = await authService.createInvitation(req.user.id, email, roleId, tenantId);
        res.status(201).json({
            success: true,
            message: result.message,
            data: { invitationToken: result.invitationToken },
        });
    }
    catch (error) {
        console.error("Create invitation error:", error);
        res.status(400).json({
            error: "Invitation Failed",
            message: error instanceof Error ? error.message : "Failed to create invitation",
        });
    }
};
exports.createInvitation = createInvitation;
/**
 * Accept invitation
 */
const acceptInvitation = async (req, res) => {
    try {
        const validationError = handleValidationErrors(req, res);
        if (validationError)
            return validationError;
        const { token, password, firstName, lastName } = req.body;
        const result = await authService.acceptInvitation(token, password, firstName, lastName);
        res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    }
    catch (error) {
        console.error("Accept invitation error:", error);
        res.status(400).json({
            error: "Invitation Acceptance Failed",
            message: error instanceof Error ? error.message : "Failed to accept invitation",
        });
    }
};
exports.acceptInvitation = acceptInvitation;
/**
 * Health check for auth service
 */
const healthCheck = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Auth service is healthy",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            error: "Service Unavailable",
            message: "Auth service health check failed",
        });
    }
};
exports.healthCheck = healthCheck;
//# sourceMappingURL=authController.js.map