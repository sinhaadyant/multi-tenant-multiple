"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        // For development, use ethereal email (fake SMTP)
        // In production, replace with real SMTP settings
        this.transporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'ethereal.user@ethereal.email',
                pass: 'ethereal.pass'
            }
        });
    }
    async sendVerificationEmail(email, firstName, verificationToken, tenantName) {
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/verify-email?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
            to: email,
            subject: `Welcome to ${tenantName} - Verify Your Email`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5e72e4;">Welcome to ${tenantName}!</h2>
          
          <p>Hello ${firstName || 'there'},</p>
          
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
      `
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Verification email sent:', info.messageId);
            // In development, log the preview URL
            if (process.env.NODE_ENV === 'development') {
                console.log('Preview URL:', nodemailer_1.default.getTestMessageUrl(info));
            }
        }
        catch (error) {
            console.error('Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }
    async sendInvitationEmail(email, inviterName, tenantName, invitationToken, roleName) {
        const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/accept-invitation?token=${invitationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
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
      `
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Invitation email sent:', info.messageId);
            if (process.env.NODE_ENV === 'development') {
                console.log('Preview URL:', nodemailer_1.default.getTestMessageUrl(info));
            }
        }
        catch (error) {
            console.error('Failed to send invitation email:', error);
            throw new Error('Failed to send invitation email');
        }
    }
    async sendWelcomeEmail(email, firstName, tenantName) {
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login`;
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
            to: email,
            subject: `Welcome to ${tenantName}!`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5e72e4;">Welcome to ${tenantName}!</h2>
          
          <p>Hello ${firstName || 'there'},</p>
          
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
      `
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Welcome email sent:', info.messageId);
        }
        catch (error) {
            console.error('Failed to send welcome email:', error);
            // Don't throw error for welcome email failures
        }
    }
    async sendPasswordResetEmail(email, firstName, resetToken, tenantName) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
            to: email,
            subject: `Password Reset Request - ${tenantName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f5365c;">Password Reset Request</h2>
          
          <p>Hello ${firstName || 'there'},</p>
          
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
      `
        };
        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent:', info.messageId);
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=emailService.js.map