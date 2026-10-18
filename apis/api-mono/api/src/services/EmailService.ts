import { Emailer } from 'nunjucks-emailer';
import config from '@/config';
import EmailSettingsService from '@/services/EmailSettingsService';
import EmailTransportService, { EmailMessage } from '@/services/EmailTransportService';

export type EmailSendResult =
  | { sent: true }
  | { sent: false; reason: 'not-configured' }
  | { sent: false; reason: 'rate-limited' }
  | { sent: false; reason: 'provider'; error: string };

const RATE_LIMIT_PER_RECIPIENT = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * The one way this app sends email. Templates live in emails/templates; the provider is whatever the administrator
 * configured and verified in the admin app (EmailSettingsService). While nothing is configured `send` resolves
 * with `sent: false, reason: 'not-configured'` and logs a warning, it never throws for a missing provider, so a
 * request that only wanted to notify someone keeps working.
 *
 * Local development (NODE_ENV=local) with no verified settings falls back to the emailer set up from the EMAIL_*
 * env in startup.ts: EMAIL_MODE=FILE writes each message to emails/logs, or point EMAIL_HOST at Mailpit.
 */
class EmailService {
  private readonly recentSends = new Map<string, number[]>();

  /** True when sends will leave this server: verified settings exist, or the local fallback applies. */
  async isEnabled(): Promise<boolean> {
    return this.localFallback() || (await EmailSettingsService.verifiedTransport()) !== null;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const recipient = message.to.email.toLowerCase();
    if (this.overLimit(recipient)) {
      console.warn(`EmailService: not sending ${message.tplRelativePath}, ${recipient} hit the hourly limit`);
      return { sent: false, reason: 'rate-limited' };
    }

    const transport = await EmailSettingsService.verifiedTransport();
    if (!transport) {
      if (this.localFallback()) {
        await Emailer.send({
          to: { email: message.to.email, name: message.to.name || undefined },
          tplRelativePath: message.tplRelativePath,
          tplObject: message.tplObject || {},
        });
        this.count(recipient);
        return { sent: true };
      }
      console.warn(`EmailService: not sending ${message.tplRelativePath}, no verified email provider is configured`);
      return { sent: false, reason: 'not-configured' };
    }

    const result = await EmailTransportService.deliver(transport, message);
    this.count(recipient);
    if (result.ok) {
      await EmailSettingsService.recordSendOutcome();
      return { sent: true };
    }
    console.warn(`EmailService: provider rejected ${message.tplRelativePath}: ${result.error}`);
    await EmailSettingsService.recordSendOutcome(result.error);
    return { sent: false, reason: 'provider', error: result.error };
  }

  private localFallback(): boolean {
    return config.env === 'local';
  }

  /** At most RATE_LIMIT_PER_RECIPIENT messages per recipient per hour, per instance: enough to stop a loop. */
  private overLimit(recipient: string): boolean {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recent = (this.recentSends.get(recipient) || []).filter((at) => at > cutoff);
    this.recentSends.set(recipient, recent);
    return recent.length >= RATE_LIMIT_PER_RECIPIENT;
  }

  private count(recipient: string): void {
    this.recentSends.set(recipient, [...(this.recentSends.get(recipient) || []), Date.now()]);
  }
}

export default new EmailService();
