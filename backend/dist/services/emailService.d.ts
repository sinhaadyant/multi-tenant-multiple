export declare class EmailService {
    private transporter;
    constructor();
    sendVerificationEmail(email: string, firstName: string | null, verificationToken: string, tenantName: string): Promise<void>;
    sendInvitationEmail(email: string, inviterName: string, tenantName: string, invitationToken: string, roleName: string): Promise<void>;
    sendWelcomeEmail(email: string, firstName: string | null, tenantName: string): Promise<void>;
    sendPasswordResetEmail(email: string, firstName: string | null, resetToken: string, tenantName: string): Promise<void>;
}
//# sourceMappingURL=emailService.d.ts.map