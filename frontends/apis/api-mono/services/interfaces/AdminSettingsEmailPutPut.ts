export interface AdminSettingsEmailPutPut {
  /**
   * Must be on a domain verified at the provider, or nothing arrives
   */
  fromAddress: string;
  /**
   * Defaults to the app name
   */
  fromName?: string;
  /**
   * SMTP host
   */
  host: string;
  /**
   * The provider's SMTP password or API key. Required on first save, omit later to keep the
   * stored one.
   */
  password?: string;
  port: number;
  /**
   * A preset the admin app fills host, port and username from, or smtp for any other server.
   */
  provider: Provider;
  replyTo?: string;
  /**
   * Implicit TLS (port 465). Otherwise STARTTLS is required.
   */
  secure?: boolean;
  username: string;
}

/**
 * A preset the admin app fills host, port and username from, or smtp for any other server.
 */
export enum Provider {
  Brevo = 'brevo',
  Mailgun = 'mailgun',
  Resend = 'resend',
  Sendgrid = 'sendgrid',
  Smtp = 'smtp',
}
