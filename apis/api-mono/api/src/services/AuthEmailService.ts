import { Emailer } from 'nunjucks-emailer';

interface Recipient {
  email: string;
  name?: string | null;
}

/**
 * AuthEmailService
 *
 * The emails Better Auth asks this API to send. Templates live in emails/templates/auth/ and
 * render through the nunjucks-emailer set up in src/utils/startup.ts (EMAIL_MODE=FILE writes them to emails/logs locally).
 */
class AuthEmailService {
  sendPasswordReset(user: Recipient, url: string): Promise<void> {
    return this.send(user, 'auth/resetPassword.html.njk', { url });
  }

  sendEmailVerification(user: Recipient, url: string): Promise<void> {
    return this.send(user, 'auth/verifyEmail.html.njk', { url });
  }

  sendMagicLink(email: string, url: string): Promise<void> {
    return this.send({ email }, 'auth/magicLink.html.njk', { url });
  }

  private async send(to: Recipient, tplRelativePath: string, tplObject: Record<string, string>): Promise<void> {
    await Emailer.send({
      to: { email: to.email, name: to.name || undefined },
      tplRelativePath,
      tplObject: { ...tplObject, name: to.name || to.email },
    });
  }
}

export default new AuthEmailService();
