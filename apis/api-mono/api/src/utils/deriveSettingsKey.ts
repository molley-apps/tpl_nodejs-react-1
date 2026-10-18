import { hkdfSync } from 'crypto';

/**
 * A 32 byte AES key for one settings area, derived from the app's AUTH_SECRET so no extra secret is needed.
 * `info` names the area (eg "email-settings"); different areas get unrelated keys from the same secret.
 * Rotating AUTH_SECRET changes the key, so anything encrypted before must be entered again.
 */
export function deriveSettingsKey(secret: string, info: string): Buffer {
  return Buffer.from(hkdfSync('sha256', secret, '', info, 32));
}
