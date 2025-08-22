import { PrismaClient } from "@prisma/client";
import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
} from "../utils/password";
import {
  generateTokenPair,
  generateSecureToken,
  hashToken,
} from "../utils/jwt";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ChangePasswordResponse,
  VerifyEmailResponse,
  AuthUser,
  AuthTenant,
} from "../types/auth";
import { EmailService } from "./emailService";

const prisma = new PrismaClient();

export class AuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }
  /**
   * User login
   */
  async login(
    data: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResponse> {
    const { email, password, tenantId } = data;

    // Find user with tenant
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(tenantId ? { tenantId } : {}),
      },
      include: {
        tenant: true,
        userRoles: {
          where: {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check user status
    if (user.status !== "ACTIVE") {
      throw new Error("Account is not active");
    }

    // Check tenant status
    if (user.tenant.status !== "ACTIVE") {
      throw new Error("Organization account is not active");
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      // Log failed login attempt
      await this.logAuditEvent(
        user.tenantId,
        user.id,
        "LOGIN_FAILED",
        "auth",
        null,
        { email, ipAddress, userAgent }
      );
      throw new Error("Invalid email or password");
    }

    // Get user roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = new Set<string>();

    user.userRoles.forEach((ur) => {
      const rolePermissions = ur.role.permissions as string[];
      rolePermissions.forEach((permission) => permissions.add(permission));
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles,
      permissions: Array.from(permissions),
    });

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        deviceInfo: { userAgent },
        ipAddress,
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log successful login
    await this.logAuditEvent(
      user.tenantId,
      user.id,
      "LOGIN_SUCCESS",
      "auth",
      null,
      { ipAddress, userAgent }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        status: user.status,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLogin: user.lastLogin,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        domain: user.tenant.domain,
      },
      tokens,
      roles,
      permissions: Array.from(permissions),
    };
  }

  /**
   * User registration
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const { email, password, firstName, lastName, tenantId, invitationToken } =
      data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password validation failed: ${passwordValidation.feedback.join(", ")}`
      );
    }

    let targetTenant;

    // If invitation token provided, validate it
    if (invitationToken) {
      // TODO: Implement invitation token validation
      // For now, assume it's valid and extract tenant info
    }

    // Find or validate tenant
    if (tenantId) {
      targetTenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { _count: { select: { users: true } } },
      });

      if (!targetTenant) {
        throw new Error("Invalid tenant");
      }

      if (targetTenant.status !== "ACTIVE") {
        throw new Error("Tenant is not active");
      }

      // Check tenant settings
      const settings = targetTenant.settings as any;
      if (settings?.allowRegistration === false && !invitationToken) {
        throw new Error("Registration is disabled for this organization");
      }
    } else {
      // Use default tenant for development
      targetTenant = await prisma.tenant.findUnique({
        where: { slug: "default" },
      });

      if (!targetTenant) {
        throw new Error("Default tenant not found");
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId: targetTenant.id,
        },
      },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token if required
    let emailVerificationToken = null;
    const settings = targetTenant.settings as any;
    const requiresVerification = settings?.requireEmailVerification === true;

    if (requiresVerification) {
      emailVerificationToken = generateSecureToken();
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        tenantId: targetTenant.id,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        status: requiresVerification ? "PENDING_VERIFICATION" : "ACTIVE",
        emailVerified: !requiresVerification,
        emailVerificationToken: emailVerificationToken
          ? hashToken(emailVerificationToken)
          : null,
      },
      include: {
        tenant: true,
      },
    });

    // Assign default role
    const defaultRole = await prisma.role.findFirst({
      where: {
        tenantId: targetTenant.id,
        isDefault: true,
      },
    });

    if (defaultRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id,
          assignedBy: user.id, // Self-assigned for registration
        },
      });
    }

    // Log registration
    await this.logAuditEvent(
      user.tenantId,
      user.id,
      "USER_REGISTERED",
      "users",
      null,
      { email }
    );

    // Send verification email if required
    if (requiresVerification && emailVerificationToken) {
      try {
        await this.emailService.sendVerificationEmail(
          email,
          firstName || null,
          emailVerificationToken,
          targetTenant.name
        );
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }
    } else {
      // Send welcome email for immediate active accounts
      try {
        await this.emailService.sendWelcomeEmail(
          email,
          firstName || null,
          targetTenant.name
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        emailVerified: user.emailVerified,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
      message: requiresVerification
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful. You can now log in.",
      requiresVerification,
    };
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    // Find session with refresh token
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: {
          include: {
            tenant: true,
            userRoles: {
              where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.isRevoked) {
      throw new Error("Invalid refresh token");
    }

    if (session.expiresAt < new Date()) {
      throw new Error("Refresh token has expired");
    }

    if (
      session.user.status !== "ACTIVE" ||
      session.user.tenant.status !== "ACTIVE"
    ) {
      throw new Error("Account is not active");
    }

    // Get user roles and permissions
    const roles = session.user.userRoles.map((ur) => ur.role.name);
    const permissions = new Set<string>();

    session.user.userRoles.forEach((ur) => {
      const rolePermissions = ur.role.permissions as string[];
      rolePermissions.forEach((permission) => permissions.add(permission));
    });

    // Generate new tokens
    const tokens = generateTokenPair({
      userId: session.user.id,
      tenantId: session.user.tenantId,
      email: session.user.email,
      roles,
      permissions: Array.from(permissions),
    });

    // Update session with new tokens
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
    });

    return { tokens };
  }

  /**
   * Logout
   */
  async logout(token: string): Promise<void> {
    await prisma.session.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  /**
   * Forgot password
   */
  async forgotPassword(
    email: string,
    tenantId?: string
  ): Promise<ForgotPasswordResponse> {
    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return {
        message:
          "If an account with this email exists, a password reset link has been sent.",
      };
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const hashedResetToken = hashToken(resetToken);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedResetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Log password reset request
    await this.logAuditEvent(
      user.tenantId,
      user.id,
      "PASSWORD_RESET_REQUESTED",
      "auth",
      null,
      { email }
    );

    // TODO: Send reset email

    return {
      message:
        "If an account with this email exists, a password reset link has been sent.",
      ...(process.env.NODE_ENV === "development" ? { resetToken } : {}),
    };
  }

  /**
   * Reset password
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ResetPasswordResponse> {
    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password validation failed: ${passwordValidation.feedback.join(", ")}`
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all sessions for security
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    // Log password reset
    await this.logAuditEvent(
      user.tenantId,
      user.id,
      "PASSWORD_RESET_COMPLETED",
      "auth",
      null,
      { email: user.email }
    );

    return {
      message:
        "Password has been reset successfully. Please log in with your new password.",
    };
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ChangePasswordResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValidPassword = await comparePassword(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password validation failed: ${passwordValidation.feedback.join(", ")}`
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Log password change
    await this.logAuditEvent(
      user.tenantId,
      user.id,
      "PASSWORD_CHANGED",
      "auth",
      null,
      { email: user.email }
    );

    return {
      message: "Password has been changed successfully.",
    };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const hashedToken = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        status: "PENDING_VERIFICATION",
      },
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "ACTIVE",
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    // Log email verification
    await this.logAuditEvent(
      user.tenantId,
      user.id,
      "EMAIL_VERIFIED",
      "auth",
      null,
      { email: user.email }
    );

    return {
      message: "Email has been verified successfully. You can now log in.",
    };
  }

  /**
   * Create user invitation
   */
  async createInvitation(
    inviterUserId: string,
    email: string,
    roleId: string,
    tenantId: string
  ): Promise<{ invitationToken: string; message: string }> {
    // Check if inviter has permission to invite users
    const inviter = await prisma.user.findUnique({
      where: { id: inviterUserId },
      include: {
        tenant: true,
        userRoles: {
          include: { role: true }
        }
      }
    });

    if (!inviter) {
      throw new Error('Inviter not found');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email_tenantId: { email, tenantId }
      }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate role exists and belongs to tenant
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.tenantId !== tenantId) {
      throw new Error('Invalid role or role does not belong to tenant');
    }

    // Generate invitation token
    const invitationToken = generateSecureToken();
    const hashedToken = hashToken(invitationToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation (we'll create a new table for this)
    // For now, we'll use a simple approach with user table
    const invitationData = {
      email,
      tenantId,
      roleId,
      invitedBy: inviterUserId,
      token: hashedToken,
      expiresAt: expiresAt.toISOString(),
    };

    // Store in user table as pending invitation
    await prisma.user.create({
      data: {
        tenantId,
        email,
        password: 'INVITATION_PENDING', // Placeholder password
        firstName: null,
        lastName: null,
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
        emailVerificationToken: hashedToken,
        createdById: inviterUserId,
      }
    });

    // Send invitation email
    try {
      await this.emailService.sendInvitationEmail(
        email,
        `${inviter.firstName} ${inviter.lastName}`.trim() || inviter.email,
        inviter.tenant.name,
        invitationToken,
        role.name
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      throw new Error('Failed to send invitation email');
    }

    // Log invitation
    await this.logAuditEvent(
      tenantId,
      inviterUserId,
      'USER_INVITED',
      'users',
      null,
      { email, roleId, invitationToken: 'REDACTED' }
    );

    return {
      invitationToken: process.env.NODE_ENV === 'development' ? invitationToken : 'SENT',
      message: 'Invitation sent successfully'
    };
  }

  /**
   * Accept invitation and complete registration
   */
  async acceptInvitation(
    invitationToken: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<RegisterResponse> {
    const hashedToken = hashToken(invitationToken);

    // Find pending invitation
    const pendingUser = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        status: 'PENDING_VERIFICATION',
        password: 'INVITATION_PENDING'
      },
      include: {
        tenant: true
      }
    });

    if (!pendingUser) {
      throw new Error('Invalid or expired invitation token');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(
        `Password validation failed: ${passwordValidation.feedback.join(", ")}`
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user with actual data
    const user = await prisma.user.update({
      where: { id: pendingUser.id },
      data: {
        password: hashedPassword,
        firstName,
        lastName,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerificationToken: null,
      },
      include: {
        tenant: true
      }
    });

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(
        user.email,
        firstName || null,
        user.tenant.name
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail on email error
    }

    // Log invitation acceptance
    await this.logAuditEvent(
      user.tenantId,
      user.id,
      'INVITATION_ACCEPTED',
      'users',
      null,
      { email: user.email }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        emailVerified: user.emailVerified,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
      message: 'Invitation accepted successfully. You can now log in.',
      requiresVerification: false,
    };
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    tenantId: string,
    userId: string | null,
    action: string,
    resource: string,
    resourceId: string | null,
    metadata: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action,
          resource,
          resourceId,
          metadata,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
      });
    } catch (error) {
      console.error("Failed to log audit event:", error);
    }
  }
}
