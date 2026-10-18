import nodemailer, { Transporter } from 'nodemailer';
import { Emailer } from 'nunjucks-emailer';

/** Decrypted SMTP settings, built by EmailSettingsService. `updatedAt` keys the transport cache. */
export interface EmailTransportSettings {
  updatedAt: Date;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  replyTo?: string;
}

export interface EmailRecipient {
  email: string;
  name?: string | null;
}

export interface EmailMessage {
  to: EmailRecipient;
  /** Template under emails/templates without the .html.njk suffix, eg "auth/resetPassword" */
  tplRelativePath: string;
  tplObject?: Record<string, unknown>;
  /** Defaults to the <nunjuck-email-subject> of the rendered template */
  subject?: string;
}

export type EmailDeliveryResult = { ok: true; response: string } | { ok: false; error: string };

/**
 * Renders a template with the nunjucks-emailer set up in startup.ts and sends it over SMTP with the given settings.
 * No database access: EmailService decides which settings apply and records the outcome. The one piece the
 * emailer library does not offer is a per-send transport, which is what makes the admin-configured provider work.
 */
class EmailTransportService {
  private cached?: { updatedAt: number; transporter: Transporter };

  async deliver(settings: EmailTransportSettings, message: EmailMessage): Promise<EmailDeliveryResult> {
    const { html, text } = await Emailer.renderEmailToHtmlAndTxt({
      tplRelativePath: message.tplRelativePath,
      tplObject: message.tplObject || {},
    });
    try {
      const info = await this.transporter(settings).sendMail({
        from: { address: settings.fromAddress, name: settings.fromName },
        replyTo: settings.replyTo || undefined,
        to: { address: message.to.email, name: message.to.name || '' },
        subject: message.subject || this.subjectFrom(html),
        html,
        text,
      });
      return { ok: true, response: String(info.response || '') };
    } catch (e) {
      return { ok: false, error: this.describe(e) };
    }
  }

  /** The SMTP reply code and message, without anything the provider echoes back about the credentials. */
  private describe(e: unknown): string {
    const error = e as { responseCode?: number; response?: string; code?: string; message?: string };
    if (error.response) {
      return error.response.slice(0, 500);
    }
    return [error.code, error.message].filter(Boolean).join(' ').slice(0, 500) || 'Unknown error';
  }

  /** Templates carry their subject in a <nunjuck-email-subject text="…"> tag, as the emailer library does. */
  private subjectFrom(html: string): string {
    const match = /<nunjuck-email-subject[^>]*text="([^"]*)"/i.exec(html);
    return match ? match[1].trim() : '';
  }

  private transporter(settings: EmailTransportSettings): Transporter {
    const updatedAt = settings.updatedAt.getTime();
    if (!this.cached || this.cached.updatedAt !== updatedAt) {
      this.cached = {
        updatedAt,
        transporter: nodemailer.createTransport({
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          // Never fall back to plain text: without implicit TLS the server must offer STARTTLS
          requireTLS: !settings.secure,
          auth: { user: settings.username, pass: settings.password },
        }),
      };
    }
    return this.cached.transporter;
  }
}

export default new EmailTransportService();
