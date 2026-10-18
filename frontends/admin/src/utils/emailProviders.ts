import { Provider } from 'apis/api-mono/services/interfaces/AdminSettingsEmailPutPut';

/**
 * The SMTP presets offered on Settings → Email. Choosing one fills host, port and the fixed username; the
 * checklist is what the administrator has to do at the provider before a test email will arrive.
 * Mirrors the provider enum in the API spec.
 */
export interface EmailProviderPreset {
  provider: Provider;
  label: string;
  host: string;
  port: number;
  /** A fixed SMTP login (Resend, SendGrid) or null when the provider gives each account its own */
  username: string | null;
  usernameLabel: string;
  secretLabel: string;
  docsUrl: string | null;
  checklist: string[];
}

export const EMAIL_PROVIDERS: EmailProviderPreset[] = [
  {
    provider: Provider.Resend,
    label: 'Resend',
    host: 'smtp.resend.com',
    port: 465,
    username: 'resend',
    usernameLabel: 'Username',
    secretLabel: 'API key',
    docsUrl: 'https://resend.com/docs/send-with-smtp',
    checklist: [
      'Add and verify the domain of your from address under Domains.',
      'Create an API key with sending access under API Keys and paste it below.',
      'Send a test email.',
    ],
  },
  {
    provider: Provider.Brevo,
    label: 'Brevo',
    host: 'smtp-relay.brevo.com',
    port: 587,
    username: null,
    usernameLabel: 'Account login email',
    secretLabel: 'SMTP key (not the API key)',
    docsUrl: 'https://help.brevo.com/hc/en-us/articles/7924908994450',
    checklist: [
      'Verify the sender or domain of your from address under Senders & Domains.',
      'Under SMTP & API create an SMTP key; the username is your Brevo login email.',
      'Send a test email.',
    ],
  },
  {
    provider: Provider.Sendgrid,
    label: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    username: 'apikey',
    usernameLabel: 'Username',
    secretLabel: 'API key',
    docsUrl: 'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/integrating-with-the-smtp-api',
    checklist: [
      'Complete Sender Authentication for the domain of your from address.',
      'Create an API key with Mail Send access and paste it below.',
      'Send a test email.',
    ],
  },
  {
    provider: Provider.Mailgun,
    label: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    username: null,
    usernameLabel: 'SMTP login',
    secretLabel: 'SMTP password',
    docsUrl: 'https://documentation.mailgun.com/docs/mailgun/user-manual/sending-messages/send-via-smtp/',
    checklist: [
      'Add and verify the sending domain under Sending → Domains.',
      'Open the domain, create SMTP credentials and copy the login and password.',
      'Send a test email.',
    ],
  },
  {
    provider: Provider.Smtp,
    label: 'Custom SMTP',
    host: '',
    port: 587,
    username: null,
    usernameLabel: 'Username',
    secretLabel: 'Password',
    docsUrl: null,
    checklist: [
      'Enter the host, port and credentials your mail server gave you. TLS is required.',
      'Make sure the server allows the from address you enter.',
      'Send a test email.',
    ],
  },
];

export const emailProviderPreset = (provider: Provider | string | undefined): EmailProviderPreset =>
  EMAIL_PROVIDERS.find((preset) => preset.provider === provider) ?? EMAIL_PROVIDERS[0];
