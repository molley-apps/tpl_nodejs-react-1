import config from '@/config';
import EmailSettingsRepository from '@/database/EmailSettingsRepository';
import { EmailSettingsClass } from '@/database/models/EmailSettingsModel';
import { AdminSettingsEmail, AdminSettingsEmailPutPut, AdminSettingsEmailTest } from '@/http/nodegen/interfaces';
import { BadRequestException } from '@/http/nodegen/errors';
import EmailTransportService, { EmailRecipient, EmailTransportSettings } from '@/services/EmailTransportService';
import { decryptSecret } from '@/utils/decryptSecret';
import { deriveSettingsKey } from '@/utils/deriveSettingsKey';
import { encryptSecret } from '@/utils/encryptSecret';

const KEY_INFO = 'email-settings';
const IMPLICIT_TLS_PORT = 465;

export const PROVIDER_LABELS: Record<string, string> = {
  resend: 'Resend',
  brevo: 'Brevo',
  sendgrid: 'SendGrid',
  mailgun: 'Mailgun',
  smtp: 'custom SMTP',
};

/**
 * The outgoing email provider an administrator configures in the admin app (Settings → Email).
 *
 * The secret is encrypted with a key derived from AUTH_SECRET and never leaves this service decrypted except
 * inside the transport settings handed to EmailTransportService. Saving clears verification; a successful test
 * send (to the admin's own address) verifies the settings, and only verified settings are used for real sends.
 */
class EmailSettingsService {
  private key?: Buffer;

  async get(): Promise<AdminSettingsEmail> {
    return this.toApi(await EmailSettingsRepository.fetch());
  }

  async save(input: AdminSettingsEmailPutPut, actorId: string): Promise<AdminSettingsEmail> {
    const existing = await EmailSettingsRepository.fetch();
    const password = input.password?.trim();
    const secret = password
      ? { passwordEncrypted: encryptSecret(password, this.secretKey()), passwordLast4: password.slice(-4) }
      : existing && { passwordEncrypted: existing.passwordEncrypted, passwordLast4: existing.passwordLast4 };
    if (!secret) {
      throw new BadRequestException('A password or API key is required');
    }

    const saved = await EmailSettingsRepository.save({
      provider: input.provider,
      host: input.host.trim(),
      port: input.port,
      secure: input.secure ?? input.port === IMPLICIT_TLS_PORT,
      username: input.username.trim(),
      ...secret,
      fromAddress: input.fromAddress.trim(),
      fromName: input.fromName?.trim() || config.appDetails.name,
      replyTo: input.replyTo?.trim() || undefined,
      updatedBy: actorId,
    });
    return this.toApi(saved);
  }

  /** Sends the test template to the caller through the saved settings; success switches outgoing email on. */
  async test(recipient: EmailRecipient): Promise<AdminSettingsEmailTest> {
    const settings = await EmailSettingsRepository.fetch();
    if (!settings) {
      throw new BadRequestException('Save the email settings before sending a test');
    }
    const result = await EmailTransportService.deliver(this.toTransport(settings), {
      to: recipient,
      tplRelativePath: 'system/emailTest',
      tplObject: {
        name: recipient.name || recipient.email,
        providerLabel: PROVIDER_LABELS[settings.provider] || settings.provider,
        fromAddress: settings.fromAddress,
        sentAt: new Date().toUTCString(),
      },
    });
    if (result.ok) {
      await EmailSettingsRepository.markVerified(new Date());
      return { success: true, providerResponse: result.response };
    }
    await EmailSettingsRepository.recordSendFailure(result.error);
    return { success: false, providerResponse: result.error };
  }

  async clear(): Promise<void> {
    await EmailSettingsRepository.remove();
  }

  /** Decrypted settings for real sends, or null while nothing verified is saved. */
  async verifiedTransport(): Promise<EmailTransportSettings | null> {
    const settings = await EmailSettingsRepository.fetch();
    return settings?.verifiedAt ? this.toTransport(settings) : null;
  }

  recordSendOutcome(error?: string): Promise<unknown> {
    return error
      ? EmailSettingsRepository.recordSendFailure(error)
      : EmailSettingsRepository.recordSendSuccess(new Date());
  }

  private toTransport(settings: EmailSettingsClass): EmailTransportSettings {
    return {
      updatedAt: settings.updatedAt,
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      username: settings.username,
      password: decryptSecret(settings.passwordEncrypted, this.secretKey()),
      fromAddress: settings.fromAddress,
      fromName: settings.fromName,
      replyTo: settings.replyTo,
    };
  }

  /** Everything but the secret; the admin app only ever sees the last four characters. */
  private toApi(settings: EmailSettingsClass | null): AdminSettingsEmail {
    if (!settings) {
      return { configured: false, verified: false };
    }
    return {
      configured: true,
      verified: !!settings.verifiedAt,
      provider: settings.provider as AdminSettingsEmail['provider'],
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      username: settings.username,
      passwordLast4: settings.passwordLast4,
      fromAddress: settings.fromAddress,
      fromName: settings.fromName,
      replyTo: settings.replyTo,
      verifiedAt: settings.verifiedAt,
      lastSendAt: settings.lastSendAt,
      lastError: settings.lastError,
      updatedAt: settings.updatedAt,
    };
  }

  private secretKey(): Buffer {
    if (!this.key) {
      this.key = deriveSettingsKey(config.auth.secret, KEY_INFO);
    }
    return this.key;
  }
}

export default new EmailSettingsService();
