const mockEmail = { send: jest.fn() };
jest.mock('@/services/EmailService', () => ({ __esModule: true, default: mockEmail }));

import { APIError } from 'better-auth/api';
import AuthEmailService from '@/services/AuthEmailService';

const user = { email: 'ada@acme.com', name: 'Ada' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockEmail.send.mockResolvedValue({ sent: true });
});

describe('AuthEmailService', () => {
  it('renders the auth templates by their folder path, with the recipient name', async () => {
    await AuthEmailService.sendPasswordReset(user, 'https://app/reset');
    await AuthEmailService.sendEmailVerification({ email: 'bob@acme.com', name: null }, 'https://app/verify');
    await AuthEmailService.sendMagicLink('cat@acme.com', 'https://app/magic');

    expect(mockEmail.send.mock.calls.map(([m]) => [m.tplRelativePath, m.tplObject.name])).toEqual([
      ['auth/resetPassword', 'Ada'],
      ['auth/verifyEmail', 'bob@acme.com'],
      ['auth/magicLink', 'cat@acme.com'],
    ]);
    expect(mockEmail.send.mock.calls[0][0]).toMatchObject({ to: user, tplObject: { url: 'https://app/reset' } });
  });

  it('lets sign up continue when the verification email cannot be sent', async () => {
    mockEmail.send.mockResolvedValue({ sent: false, reason: 'not-configured' });

    await expect(AuthEmailService.sendEmailVerification(user, 'u')).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not-configured'));
  });

  it('answers 409 EMAIL_NOT_CONFIGURED for a reset or magic link with no provider', async () => {
    mockEmail.send.mockResolvedValue({ sent: false, reason: 'not-configured' });

    const error = await AuthEmailService.sendPasswordReset(user, 'u').catch((e) => e);
    expect(error).toBeInstanceOf(APIError);
    expect(error.status).toBe('CONFLICT');
    expect(error.body).toMatchObject({ code: 'EMAIL_NOT_CONFIGURED' });
    await expect(AuthEmailService.sendMagicLink('x@acme.com', 'u')).rejects.toBeInstanceOf(APIError);
  });

  it('fails loudly on a provider error so the caller never reports a sent message', async () => {
    mockEmail.send.mockResolvedValue({ sent: false, reason: 'provider', error: '535 bad key' });

    await expect(AuthEmailService.sendPasswordReset(user, 'u')).rejects.toThrow('535 bad key');
  });
});
