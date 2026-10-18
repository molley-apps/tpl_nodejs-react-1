import { deriveSettingsKey } from '@/utils/deriveSettingsKey';
import { encryptSecret } from '@/utils/encryptSecret';
import { decryptSecret } from '@/utils/decryptSecret';

const secret = 'test-only-secret-that-is-at-least-32-characters-long';

describe('deriveSettingsKey', () => {
  it('is deterministic for the same secret and area, and 32 bytes', () => {
    const a = deriveSettingsKey(secret, 'email-settings');
    expect(a).toHaveLength(32);
    expect(a.equals(deriveSettingsKey(secret, 'email-settings'))).toBe(true);
  });

  it('gives unrelated keys per area and per secret', () => {
    const a = deriveSettingsKey(secret, 'email-settings');
    expect(a.equals(deriveSettingsKey(secret, 'other-settings'))).toBe(false);
    expect(a.equals(deriveSettingsKey(`${secret}x`, 'email-settings'))).toBe(false);
  });
});

describe('encryptSecret / decryptSecret', () => {
  const key = deriveSettingsKey(secret, 'email-settings');

  it('round trips and never stores the plain text', () => {
    const payload = encryptSecret('re_live_abcdef', key);
    expect(payload).not.toContain('re_live');
    expect(payload.split('.')).toHaveLength(3);
    expect(decryptSecret(payload, key)).toBe('re_live_abcdef');
  });

  it('uses a fresh iv each time', () => {
    expect(encryptSecret('same', key)).not.toBe(encryptSecret('same', key));
  });

  it('refuses a rotated key or a tampered payload', () => {
    const payload = encryptSecret('re_live_abcdef', key);
    expect(() => decryptSecret(payload, deriveSettingsKey('rotated-secret-rotated-secret-rotated-secret', 'email-settings'))).toThrow();
    const [iv, tag, data] = payload.split('.');
    expect(() => decryptSecret(`${iv}.${tag}.${data.slice(0, -2)}AA`, key)).toThrow();
    expect(() => decryptSecret('not-a-payload', key)).toThrow(/malformed/);
  });
});
