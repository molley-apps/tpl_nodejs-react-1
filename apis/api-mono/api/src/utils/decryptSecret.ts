import { createDecipheriv } from 'crypto';

/**
 * Reverses encryptSecret. Throws when the payload was tampered with or the key is not the one that encrypted it
 * (eg AUTH_SECRET was rotated).
 */
export function decryptSecret(payload: string, key: Buffer): string {
  const [iv, tag, encrypted] = payload.split('.').map((part) => Buffer.from(part, 'base64'));
  if (!iv || !tag || !encrypted) {
    throw new Error('Encrypted payload is malformed');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
