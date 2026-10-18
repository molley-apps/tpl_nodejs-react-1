import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './authErrorMessage';

describe('authErrorMessage', () => {
  it('explains the 409 the API answers while email is not configured', () => {
    expect(authErrorMessage({ code: 'EMAIL_NOT_CONFIGURED', message: 'raw' }, 'fallback')).toMatch(/outgoing email is not set up/);
  });

  it('shows the server message otherwise, then the fallback', () => {
    expect(authErrorMessage({ code: 'INVALID_EMAIL', message: 'Invalid email' }, 'fallback')).toBe('Invalid email');
    expect(authErrorMessage({ code: 'X' }, 'fallback')).toBe('fallback');
    expect(authErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
