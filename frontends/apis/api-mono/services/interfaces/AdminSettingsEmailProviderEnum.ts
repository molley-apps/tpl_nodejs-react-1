/**
 * A preset the admin app fills host, port and username from, or smtp for any other server.
 */
export enum AdminSettingsEmailProviderEnum {
  Brevo = 'brevo',
  Mailgun = 'mailgun',
  Resend = 'resend',
  Sendgrid = 'sendgrid',
  Smtp = 'smtp',
}
