import express from 'express';
import InternalAuthService from '@/services/InternalAuthService';
import { verifySchedulerOidc } from '@/utils/verifySchedulerOidc';
import { UnauthorizedException } from '@/http/nodegen/errors';

jest.mock('@/utils/verifySchedulerOidc', () => ({ verifySchedulerOidc: jest.fn() }));

const mockedVerify = verifySchedulerOidc as jest.Mock;

const runMiddleware = (path: string, authorization?: string): Promise<unknown> =>
  new Promise((resolve) => {
    const req = { path, headers: { authorization } } as unknown as express.Request;
    InternalAuthService.middleware()(req, {} as express.Response, (err?: unknown) => resolve(err));
  });

describe('InternalAuthService.middleware', () => {
  beforeEach(() => mockedVerify.mockReset());

  it('leaves every path outside /api/internal/ alone', async () => {
    for (const path of ['/api/user/current', '/api/admin/users', '/api/meta', '/users/', '/api/internalish']) {
      expect(await runMiddleware(path)).toBeUndefined();
    }
    expect(mockedVerify).not.toHaveBeenCalled();
  });

  it('verifies the Google OIDC token for any path under the prefix, the existing job route or a future one', async () => {
    mockedVerify.mockResolvedValue(undefined);

    expect(await runMiddleware('/api/internal/jobs/purge-expired-sessions', 'Bearer tok')).toBeUndefined();
    expect(await runMiddleware('/api/internal/something-added-later', 'Bearer tok')).toBeUndefined();

    expect(mockedVerify).toHaveBeenCalledTimes(2);
    expect(mockedVerify).toHaveBeenCalledWith('Bearer tok', {
      audience: expect.any(String),
      invokerEmail: expect.any(String),
    });
  });

  it('refuses the request with the verifier\'s 401 before any route runs', async () => {
    mockedVerify.mockRejectedValue(new UnauthorizedException('Invalid scheduler token'));

    const err = await runMiddleware('/api/internal/jobs/purge-expired-sessions', 'Bearer forged');

    expect(err).toBeInstanceOf(UnauthorizedException);
  });
});
