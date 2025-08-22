import { Router } from "express";
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

// Health check endpoint
router.get("/health", healthCheck);

// Authentication endpoints
router.post("/login", optionalResolveTenant, loginValidation, login);
router.post("/register", optionalResolveTenant, validateTenantSettings("allowRegistration"), registerValidation, register);
router.post("/refresh", refreshTokenValidation, refreshToken);
router.post("/logout", optionalAuth, logout);

// Password management
router.post("/forgot-password", optionalResolveTenant, forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);
router.post("/change-password", resolveTenant, authenticate, changePasswordValidation, changePassword);

// Email verification
router.post("/verify-email", verifyEmailValidation, verifyEmail);

// Profile
router.get("/profile", resolveTenant, authenticate, getProfile);
router.get("/me", resolveTenant, authenticate, getProfile);

// Invitation system
router.post("/invite", resolveTenant, authenticate, createInvitationValidation, createInvitation);
router.post("/accept-invitation", acceptInvitationValidation, acceptInvitation);

export default router;
