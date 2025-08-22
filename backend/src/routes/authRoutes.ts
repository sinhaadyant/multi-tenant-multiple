import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  getProfile,
  healthCheck,
  createInvitation,
  acceptInvitation,
  loginValidation,
  registerValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  verifyEmailValidation,
  createInvitationValidation,
  acceptInvitationValidation,
} from "../controllers/authController";
import { authenticate, optionalAuth } from "../middleware/auth";
import {
  resolveTenant,
  optionalResolveTenant,
  validateTenantSettings,
} from "../middleware/tenant";

const router = Router();

// Rate limiting configurations
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: "Too Many Requests",
    message: "Too many attempts from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const moderateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
router.get("/health", healthCheck);

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 * @rateLimit Strict (5 attempts per 15 minutes)
 */
router.post(
  "/login",
  strictRateLimit,
  optionalResolveTenant,
  loginValidation,
  login
);

/**
 * @route   POST /api/auth/register
 * @desc    User registration
 * @access  Public
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post(
  "/register",
  moderateRateLimit,
  optionalResolveTenant,
  validateTenantSettings("allowRegistration"),
  registerValidation,
  register
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post(
  "/refresh",
  moderateRateLimit,
  refreshTokenValidation,
  refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 * @rateLimit General (100 requests per 15 minutes)
 */
router.post("/logout", generalRateLimit, optionalAuth, logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @rateLimit Strict (5 attempts per 15 minutes)
 */
router.post(
  "/forgot-password",
  strictRateLimit,
  optionalResolveTenant,
  forgotPasswordValidation,
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @rateLimit Strict (5 attempts per 15 minutes)
 */
router.post(
  "/reset-password",
  strictRateLimit,
  resetPasswordValidation,
  resetPassword
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post(
  "/change-password",
  moderateRateLimit,
  resolveTenant,
  authenticate,
  changePasswordValidation,
  changePassword
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post(
  "/verify-email",
  moderateRateLimit,
  verifyEmailValidation,
  verifyEmail
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 * @rateLimit General (100 requests per 15 minutes)
 */
router.get(
  "/profile",
  generalRateLimit,
  resolveTenant,
  authenticate,
  getProfile
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info (alias for profile)
 * @access  Private
 * @rateLimit General (100 requests per 15 minutes)
 */
router.get("/me", generalRateLimit, resolveTenant, authenticate, getProfile);

/**
 * @route   POST /api/auth/invite
 * @desc    Create user invitation
 * @access  Private (requires users:create permission)
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post(
  "/invite",
  moderateRateLimit,
  resolveTenant,
  authenticate,
  createInvitationValidation,
  createInvitation
);

/**
 * @route   POST /api/auth/accept-invitation
 * @desc    Accept invitation and complete registration
 * @access  Public
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post(
  "/accept-invitation",
  moderateRateLimit,
  acceptInvitationValidation,
  acceptInvitation
);

// Export the router
export default router;
