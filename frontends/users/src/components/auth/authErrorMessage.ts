/**
 * The message to show for a failed Better Auth call. The API answers 409 EMAIL_NOT_CONFIGURED for password reset
 * and magic links until the app's administrator has set up outgoing email; everything else shows the server's text.
 */
export function authErrorMessage(error: { code?: string; message?: string } | null | undefined, fallback: string): string {
  if (error?.code === 'EMAIL_NOT_CONFIGURED') {
    return "This is not available yet because outgoing email is not set up. Ask the app's administrator.";
  }
  return error?.message || fallback;
}
