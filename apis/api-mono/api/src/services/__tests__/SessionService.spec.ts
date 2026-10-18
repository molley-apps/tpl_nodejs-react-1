import express from 'express';
import SessionService from '@/services/SessionService';
import AuthService from '@/services/AuthService';
import { UnauthorizedException } from '@/http/nodegen/errors';

jest.mock('@/services/AuthService', () => ({
  __esModule: true,
  default: { getSession: jest.fn() },
}));

const mockedGetSession = AuthService.getSession as jest.Mock;

const runMiddleware = (path: string): Promise<{ err?: unknown; req: express.Request }> =>
  new Promise((resolve) => {
    const req = { path, headers: {} } as unknown as express.Request;
    SessionService.middleware()(req, {} as express.Response, (err?: unknown) => resolve({ err, req }));
  });

const session = {
  session: { id: 'session-1', userId: 'user-1' },
  user: { id: 'user-1', email: 'ada@example.com', roles: ['SUPER_ADMIN'] },
};

describe('SessionService', () => {
  beforeEach(() => mockedGetSession.mockReset());

  describe('middleware', () => {
    it('attaches sessionData (with the user roles) and continues when a session exists', async () => {
      mockedGetSession.mockResolvedValue(session);

      const { err, req } = await runMiddleware('/api/user/current');

      expect(err).toBeUndefined();
      expect(req.sessionData).toEqual({
        userId: 'user-1',
        sessionId: 'session-1',
        user: session.user,
        userRoles: ['SUPER_ADMIN'],
      });
    });

    it('defaults userRoles to an empty array when the user has none', async () => {
      mockedGetSession.mockResolvedValue({ ...session, user: { id: 'user-1', email: 'ada@example.com' } });

      const { req } = await runMiddleware('/api/user/current');

      expect(req.sessionData.userRoles).toEqual([]);
    });

    it('rejects with 401 when there is no session on a protected API path', async () => {
      mockedGetSession.mockResolvedValue(null);

      const { err, req } = await runMiddleware('/api/user/current');

      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(req.sessionData).toBeUndefined();
    });

    it('continues without sessionData when there is no session on a public API path', async () => {
      mockedGetSession.mockResolvedValue(null);

      const { err, req } = await runMiddleware('/api/health');

      expect(err).toBeUndefined();
      expect(req.sessionData).toBeUndefined();
    });

    it('continues without sessionData on frontend paths, which gate themselves', async () => {
      mockedGetSession.mockResolvedValue(null);

      for (const path of ['/', '/users/', '/admin/settings', '/users/assets/index-abc.js']) {
        const { err, req } = await runMiddleware(path);
        expect(err).toBeUndefined();
        expect(req.sessionData).toBeUndefined();
      }
    });

    it('still attaches sessionData on a public path when a session exists', async () => {
      mockedGetSession.mockResolvedValue(session);

      const { err, req } = await runMiddleware('/api/health');

      expect(err).toBeUndefined();
      expect(req.sessionData.userId).toBe('user-1');
    });

    it('forwards auth layer failures to the error handler', async () => {
      const failure = new Error('database down');
      mockedGetSession.mockRejectedValue(failure);

      const { err } = await runMiddleware('/api/user/current');

      expect(err).toBe(failure);
    });
  });

  describe('path classification', () => {
    it('matches exact public paths only', () => {
      expect(SessionService.isPublicPath('/api/health')).toBe(true);
      expect(SessionService.isPublicPath('/api/health/deep')).toBe(false);
      // Cloud Scheduler's job calls carry their own OIDC token instead of a session
      expect(SessionService.isPublicPath('/api/internal/jobs/purge-expired-sessions')).toBe(true);
      expect(SessionService.isPublicPath('/api/user/current')).toBe(false);
    });

    it('treats only /api and its children as API paths', () => {
      expect(SessionService.isApiPath('/api')).toBe(true);
      expect(SessionService.isApiPath('/api/user/current')).toBe(true);
      expect(SessionService.isApiPath('/apiary')).toBe(false);
      expect(SessionService.isApiPath('/users/')).toBe(false);
    });
  });
});
