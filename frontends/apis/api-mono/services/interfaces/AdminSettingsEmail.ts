export interface AdminSettingsEmail {
  /**
   * Settings are saved
   */
  configured: boolean;
  /**
   * Must be on a domain verified at the provider, or nothing arrives
   */
  fromAddress?: string;
  /**
   * Defaults to the app name
   */
  fromName?: string;
  /**
   * SMTP host
   */
  host?: string;
  /**
   * The provider's last failure, cleared by the next successful send
   */
  lastError?: string;
  lastSendAt?: Date;
  /**
   * The only part of the secret ever returned
   */
  passwordLast4?: string;
  port?: number;
  /**
   * A preset the admin app fills host, port and username from, or smtp for any other server.
   */
  provider?: Provider;
  replyTo?: string;
  /**
   * Implicit TLS (port 465). Otherwise STARTTLS is required.
   */
  secure?: boolean;
  updatedAt?: Date;
  username?: string;
  /**
   * A test email went through since the last save, so the app sends real email
   */
  verified: boolean;
  verifiedAt?: Date;
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
