"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
// Rate limiting configurations
const strictRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: "Too Many Requests",
        message: "Too many attempts from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const moderateRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
        error: "Too Many Requests",
        message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const generalRateLimit = (0, express_rate_limit_1.default)({
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
router.get("/health", authController_1.healthCheck);
/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 * @rateLimit Strict (5 attempts per 15 minutes)
 */
router.post("/login", strictRateLimit, tenant_1.optionalResolveTenant, authController_1.loginValidation, authController_1.login);
/**
 * @route   POST /api/auth/register
 * @desc    User registration
 * @access  Public
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post("/register", moderateRateLimit, tenant_1.optionalResolveTenant, (0, tenant_1.validateTenantSettings)("allowRegistration"), authController_1.registerValidation, authController_1.register);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post("/refresh", moderateRateLimit, authController_1.refreshTokenValidation, authController_1.refreshToken);
/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 * @rateLimit General (100 requests per 15 minutes)
 */
router.post("/logout", generalRateLimit, auth_1.optionalAuth, authController_1.logout);
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @rateLimit Strict (5 attempts per 15 minutes)
 */
router.post("/forgot-password", strictRateLimit, tenant_1.optionalResolveTenant, authController_1.forgotPasswordValidation, authController_1.forgotPassword);
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @rateLimit Strict (5 attempts per 15 minutes)
 */
router.post("/reset-password", strictRateLimit, authController_1.resetPasswordValidation, authController_1.resetPassword);
/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post("/change-password", moderateRateLimit, tenant_1.resolveTenant, auth_1.authenticate, authController_1.changePasswordValidation, authController_1.changePassword);
/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post("/verify-email", moderateRateLimit, authController_1.verifyEmailValidation, authController_1.verifyEmail);
/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 * @rateLimit General (100 requests per 15 minutes)
 */
router.get("/profile", generalRateLimit, tenant_1.resolveTenant, auth_1.authenticate, authController_1.getProfile);
/**
 * @route   GET /api/auth/me
 * @desc    Get current user info (alias for profile)
 * @access  Private
 * @rateLimit General (100 requests per 15 minutes)
 */
router.get("/me", generalRateLimit, tenant_1.resolveTenant, auth_1.authenticate, authController_1.getProfile);
/**
 * @route   POST /api/auth/invite
 * @desc    Create user invitation
 * @access  Private (requires users:create permission)
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post("/invite", moderateRateLimit, tenant_1.resolveTenant, auth_1.authenticate, authController_1.createInvitationValidation, authController_1.createInvitation);
/**
 * @route   POST /api/auth/accept-invitation
 * @desc    Accept invitation and complete registration
 * @access  Public
 * @rateLimit Moderate (10 attempts per 15 minutes)
 */
router.post("/accept-invitation", moderateRateLimit, authController_1.acceptInvitationValidation, authController_1.acceptInvitation);
// Export the router
exports.default = router;
//# sourceMappingURL=authRoutes.js.map