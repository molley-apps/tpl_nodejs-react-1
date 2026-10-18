import { APIError } from 'better-auth/api';
import EmailService, { EmailSendResult } from '@/services/EmailService';
import { EmailRecipient } from '@/services/EmailTransportService';
import { EMAIL_NOT_CONFIGURED, EMAIL_NOT_CONFIGURED_MESSAGE } from '@/constants/EMAIL';

/**
 * The emails Better Auth asks this API to send, see AuthService. Templates live in emails/templates/auth/.
 *
 * Verification on sign up must never block the sign up, so a failed or unconfigured send is only logged there.
 * Password reset and magic link exist only to deliver a message, so they fail loudly: AuthService refuses those
 * routes with 409 EMAIL_NOT_CONFIGURED before they get here, and a provider failure surfaces as an error.
 */
class AuthEmailService {
  async sendPasswordReset(user: EmailRecipient, url: string): Promise<void> {
    this.assertSent(await this.send(user, 'auth/resetPassword', { url }));
  }

  async sendEmailVerification(user: EmailRecipient, url: string): Promise<void> {
    const result = await this.send(user, 'auth/verifyEmail', { url });
    if (!result.sent) {
      console.warn(`AuthEmailService: verification email to ${user.email} not sent (${result.reason})`);
    }
  }

  async sendMagicLink(email: string, url: string): Promise<void> {
    this.assertSent(await this.send({ email }, 'auth/magicLink', { url }));
  }

  private send(
    to: EmailRecipient,
    tplRelativePath: string,
    tplObject: Record<string, string>,
  ): Promise<EmailSendResult> {
    return EmailService.send({ to, tplRelativePath, tplObject: { ...tplObject, name: to.name || to.email } });
  }

  private assertSent(result: EmailSendResult): void {
    if (result.sent) {
      return;
    }
    if (result.reason === 'not-configured') {
      throw new APIError('CONFLICT', { code: EMAIL_NOT_CONFIGURED, message: EMAIL_NOT_CONFIGURED_MESSAGE });
    }
    throw new Error(`Email not sent: ${result.reason === 'provider' ? result.error : result.reason}`);
  }
}

export default new AuthEmailService();
