"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
// Health check endpoint
router.get("/health", authController_1.healthCheck);
// Authentication endpoints
router.post("/login", tenant_1.optionalResolveTenant, authController_1.loginValidation, authController_1.login);
router.post("/register", tenant_1.optionalResolveTenant, (0, tenant_1.validateTenantSettings)("allowRegistration"), authController_1.registerValidation, authController_1.register);
router.post("/refresh", authController_1.refreshTokenValidation, authController_1.refreshToken);
router.post("/logout", auth_1.optionalAuth, authController_1.logout);
// Password management
router.post("/forgot-password", tenant_1.optionalResolveTenant, authController_1.forgotPasswordValidation, authController_1.forgotPassword);
router.post("/reset-password", authController_1.resetPasswordValidation, authController_1.resetPassword);
router.post("/change-password", tenant_1.resolveTenant, auth_1.authenticate, authController_1.changePasswordValidation, authController_1.changePassword);
// Email verification
router.post("/verify-email", authController_1.verifyEmailValidation, authController_1.verifyEmail);
// Profile
router.get("/profile", tenant_1.resolveTenant, auth_1.authenticate, authController_1.getProfile);
router.get("/me", tenant_1.resolveTenant, auth_1.authenticate, authController_1.getProfile);
// Invitation system
router.post("/invite", tenant_1.resolveTenant, auth_1.authenticate, authController_1.createInvitationValidation, authController_1.createInvitation);
router.post("/accept-invitation", authController_1.acceptInvitationValidation, authController_1.acceptInvitation);
exports.default = router;
//# sourceMappingURL=authRoutesSimple.js.map