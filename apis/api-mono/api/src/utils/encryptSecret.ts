import { createCipheriv, randomBytes } from 'crypto';

/**
 * AES-256-GCM. Returns "iv.tag.ciphertext" in base64 so it stores as one string; decryptSecret reverses it.
 */
export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join('.');
}
