import nodemailer from "nodemailer";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, use a simple test configuration
    // In production, replace with real SMTP settings
    if (process.env.NODE_ENV === "development") {
      // Use a fake transporter for development
      this.transporter = {
        sendMail: async (mailOptions: any) => {
          console.log("📧 Email would be sent:", {
            to: mailOptions.to,
            subject: mailOptions.subject,
            // Don't log the full HTML to keep logs clean
          });
          return { messageId: "dev-" + Date.now() };
        },
      } as any;
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER || "ethereal.user@ethereal.email",
          pass: process.env.SMTP_PASS || "ethereal.pass",
        },
      });
    }
  }

  async sendVerificationEmail(
    email: string,
    firstName: string | null,
    verificationToken: string,
    tenantName: string
  ): Promise<void> {
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: email,
      subject: `Welcome to ${tenantName} - Verify Your Email`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5e72e4;">Welcome to ${tenantName}!</h2>
          
          <p>Hello ${firstName || "there"},</p>
          
          <p>Thank you for registering with ${tenantName}. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #5e72e4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          
          <p>This verification link will expire in 24 hours for security reasons.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account with us, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Verification email sent:", info.messageId);

      // In development, log the preview URL
      if (process.env.NODE_ENV === "development") {
        console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error("Failed to send verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  async sendInvitationEmail(
    email: string,
    inviterName: string,
    tenantName: string,
    invitationToken: string,
    roleName: string
  ): Promise<void> {
    const invitationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/auth/accept-invitation?token=${invitationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: email,
      subject: `You're invited to join ${tenantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5e72e4;">You're Invited!</h2>
          
          <p>Hello,</p>
          
          <p><strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong> as a <strong>${roleName}</strong>.</p>
          
          <p>To accept this invitation and create your account, click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #2dce89; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
          
          <p>This invitation will expire in 7 days.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 12px;">
            If you weren't expecting this invitation, please ignore this email.
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Invitation email sent:", info.messageId);

      if (process.env.NODE_ENV === "development") {
        console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      throw new Error("Failed to send invitation email");
    }
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string | null,
    tenantName: string
  ): Promise<void> {
    const loginUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/auth/login`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: email,
      subject: `Welcome to ${tenantName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5e72e4;">Welcome to ${tenantName}!</h2>
          
          <p>Hello ${firstName || "there"},</p>
          
          <p>Your account has been successfully created and verified. You can now access your dashboard and start using all the features available to you.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #5e72e4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Login to Dashboard
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 12px;">
            Thank you for choosing ${tenantName}!
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Welcome email sent:", info.messageId);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // Don't throw error for welcome email failures
    }
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string | null,
    resetToken: string,
    tenantName: string
  ): Promise<void> {
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3001"
    }/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: email,
      subject: `Password Reset Request - ${tenantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f5365c;">Password Reset Request</h2>
          
          <p>Hello ${firstName || "there"},</p>
          
          <p>We received a request to reset your password for your ${tenantName} account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #f5365c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p>This reset link will expire in 1 hour for security reasons.</p>
          
          <p><strong>If you didn't request this password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #666; font-size: 12px;">
            For security reasons, this link will only work once.
          </p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Password reset email sent:", info.messageId);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }
}
