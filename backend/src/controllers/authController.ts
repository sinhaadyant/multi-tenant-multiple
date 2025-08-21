import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthService } from "../services/authService";
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
} from "../types/auth";

const authService = new AuthService();

/**
 * Validation rules for login
 */
export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").isLength({ min: 1 }).withMessage("Password is required"),
];

/**
 * Validation rules for registration
 */
export const registerValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("firstName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
];

/**
 * Validation rules for refresh token
 */
export const refreshTokenValidation = [
  body("refreshToken")
    .isLength({ min: 1 })
    .withMessage("Refresh token is required"),
];

/**
 * Validation rules for forgot password
 */
export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

/**
 * Validation rules for reset password
 */
export const resetPasswordValidation = [
  body("token").isLength({ min: 1 }).withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];

/**
 * Validation rules for change password
 */
export const changePasswordValidation = [
  body("currentPassword")
    .isLength({ min: 1 })
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),
];

/**
 * Validation rules for verify email
 */
export const verifyEmailValidation = [
  body("token")
    .isLength({ min: 1 })
    .withMessage("Verification token is required"),
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req: Request, res: Response) => {
  const errors = validationResult(req);
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
export const login = async (req: Request, res: Response) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const loginData: LoginRequest = {
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      error: "Authentication Failed",
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
};

/**
 * User registration
 */
export const register = async (req: Request, res: Response) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const registerData: RegisterRequest = {
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
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      error: "Registration Failed",
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { refreshToken } = req.body as RefreshTokenRequest;

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      error: "Token Refresh Failed",
      message: error instanceof Error ? error.message : "Token refresh failed",
    });
  }
};

/**
 * User logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      await authService.logout(token);
    }

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout Failed",
      message: "An error occurred during logout",
    });
  }
};

/**
 * Forgot password
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { email } = req.body as ForgotPasswordRequest;
    const tenantId = req.tenantContext?.id;

    const result = await authService.forgotPassword(email, tenantId);

    res.status(200).json({
      success: true,
      message: result.message,
      ...(result.resetToken && { data: { resetToken: result.resetToken } }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      error: "Request Failed",
      message: "An error occurred while processing your request",
    });
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { token, password } = req.body as ResetPasswordRequest;

    const result = await authService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({
      error: "Password Reset Failed",
      message: error instanceof Error ? error.message : "Password reset failed",
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const { currentPassword, newPassword } = req.body as ChangePasswordRequest;

    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(400).json({
      error: "Password Change Failed",
      message:
        error instanceof Error ? error.message : "Password change failed",
    });
  }
};

/**
 * Verify email
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const { token } = req.body as VerifyEmailRequest;

    const result = await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(400).json({
      error: "Email Verification Failed",
      message:
        error instanceof Error ? error.message : "Email verification failed",
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Request Failed",
      message: "Failed to get user profile",
    });
  }
};

/**
 * Health check for auth service
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: "Auth service is healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Service Unavailable",
      message: "Auth service health check failed",
    });
  }
};
