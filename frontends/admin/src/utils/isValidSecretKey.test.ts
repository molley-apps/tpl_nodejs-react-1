import { describe, expect, it } from 'vitest';
import { isValidSecretKey } from './isValidSecretKey';

describe('isValidSecretKey', () => {
  it('accepts upper case names with digits and underscores', () => {
    expect(isValidSecretKey('ANTHROPIC_API_KEY')).toBe(true);
    expect(isValidSecretKey('S3_BUCKET_2')).toBe(true);
    expect(isValidSecretKey('AB')).toBe(true);
  });

  it('rejects lower case, spaces, dashes, leading digits and the wrong lengths', () => {
    expect(isValidSecretKey('anthropic_api_key')).toBe(false);
    expect(isValidSecretKey('API KEY')).toBe(false);
    expect(isValidSecretKey('API-KEY')).toBe(false);
    expect(isValidSecretKey('1KEY')).toBe(false);
    expect(isValidSecretKey('A')).toBe(false);
    expect(isValidSecretKey(`K${'E'.repeat(64)}`)).toBe(false);
    expect(isValidSecretKey('')).toBe(false);
  });
});
