/**
 * The 409 Better Auth answers for password reset, magic link and resend-verification while the app's
 * administrator has not set up outgoing email (Settings → Email in the admin app). The users app shows a
 * friendly message for this code and hides those options when GET /api/capabilities reports email off.
 */
export const EMAIL_NOT_CONFIGURED = 'EMAIL_NOT_CONFIGURED';
export const EMAIL_NOT_CONFIGURED_MESSAGE = 'Outgoing email is not set up for this app yet. Ask the administrator.';
