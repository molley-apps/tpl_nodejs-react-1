// Mocks BEFORE importing the service so it binds to the stubs.
const mockGetMetadata = jest.fn();
const mockCreateReadStream = jest.fn();

jest.mock('@google-cloud/storage', () => ({
  __esModule: true,
  Storage: class Storage {
    bucket() {
      return { file: () => ({ getMetadata: mockGetMetadata, createReadStream: mockCreateReadStream }) };
    }
  },
}));

import { PassThrough } from 'stream';
import FrontendAssetsService, { cacheControlFor, defaultAppPrefix } from '@/services/FrontendAssetsService';
import { SessionData } from '@/services/SessionService';
import { SYSTEM_SUPER_ADMIN } from '@/constants/ROLES';

interface Sent {
  statusCode?: number;
  body?: unknown;
  headers: Record<string, string>;
  redirect: jest.Mock;
  headersSent: boolean;
}

function buildRes(): Sent & { res: any } {
  const sent: Sent = { headers: {}, redirect: jest.fn(), headersSent: false };
  const res: any = {
    status: (code: number) => {
      sent.statusCode = code;
      return res;
    },
    setHeader: (name: string, value: string) => {
      sent.headers[name] = value;
      return res;
    },
    send: (body: unknown) => {
      sent.body = body;
      sent.headersSent = true;
      return res;
    },
    redirect: sent.redirect,
    get headersSent() {
      return sent.headersSent;
    },
    // pipe() target
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    destroy: jest.fn(),
  };
  return Object.assign(sent, { res });
}

const session = (userRoles: string[] = []): SessionData => ({
  userId: 'u1',
  sessionId: 's1',
  user: { id: 'u1', email: 'sam@example.com' } as SessionData['user'],
  userRoles,
});

async function request(input: { path: string; originalUrl?: string; method?: string; sessionData?: SessionData }) {
  const sent = buildRes();
  const next = jest.fn();
  const req = {
    method: input.method ?? 'GET',
    path: input.path,
    originalUrl: input.originalUrl ?? input.path,
    sessionData: input.sessionData,
  } as never;
  await FrontendAssetsService.handle(req, sent.res, next);
  return { ...sent, next };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetMetadata.mockResolvedValue([{ contentType: 'text/html', size: '12' }]);
  mockCreateReadStream.mockImplementation(() => {
    const stream = new PassThrough();
    setImmediate(() => stream.end('<html></html>'));
    return stream;
  });
});

describe('FrontendAssetsService routing', () => {
  it('passes API paths through untouched', async () => {
    const { next, redirect } = await request({ path: '/api/user/current' });
    expect(next).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('passes non-GET requests through', async () => {
    const { next } = await request({ path: '/users/', method: 'POST' });
    expect(next).toHaveBeenCalled();
  });

  it('sends the bare root to the default app', async () => {
    const { redirect } = await request({ path: '/' });
    expect(redirect).toHaveBeenCalledWith(302, `${defaultAppPrefix}/`);
  });

  it('sends unknown browser paths to the default app', async () => {
    const { redirect, next } = await request({ path: '/nowhere' });
    expect(redirect).toHaveBeenCalledWith(302, `${defaultAppPrefix}/`);
    expect(next).not.toHaveBeenCalled();
  });

  it('lets unknown file requests fall through to the 404 handler', async () => {
    const { next } = await request({ path: '/favicon.ico' });
    expect(next).toHaveBeenCalled();
  });

  it('301s the bare app root to the trailing-slash form, keeping the query', async () => {
    const { redirect } = await request({ path: '/users', originalUrl: '/users?tab=home' });
    expect(redirect).toHaveBeenCalledWith(301, '/users/?tab=home');
  });
});

describe('FrontendAssetsService serving from the bucket', () => {
  it('serves index.html for the app root and for client-side routes', async () => {
    const spy = jest.spyOn(FrontendAssetsService, 'serveAsset').mockResolvedValue(undefined);

    await request({ path: '/users/' });
    await request({ path: '/users/settings/profile' });

    expect(spy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ bucketFolder: 'users' }),
      '/index.html',
      expect.anything(),
    );
    expect(spy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ bucketFolder: 'users' }),
      '/index.html',
      expect.anything(),
    );
    spy.mockRestore();
  });

  it('serves real files by their path', async () => {
    const spy = jest.spyOn(FrontendAssetsService, 'serveAsset').mockResolvedValue(undefined);
    await request({ path: '/users/assets/index-abc12345.js' });
    expect(spy).toHaveBeenCalledWith(expect.anything(), '/assets/index-abc12345.js', expect.anything());
    spy.mockRestore();
  });

  it('streams the object with its content type and cache headers', async () => {
    mockGetMetadata.mockResolvedValue([{ contentType: 'application/javascript', size: '42' }]);
    const sent = await request({ path: '/users/assets/index-abc12345.js' });

    expect(sent.statusCode).toBeUndefined();
    expect(sent.headers['Content-Type']).toBe('application/javascript');
    expect(sent.headers['Content-Length']).toBe('42');
    expect(sent.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    expect(sent.res.end).toHaveBeenCalled();
  });

  it('404s when the object is missing from the bucket', async () => {
    mockGetMetadata.mockRejectedValue(Object.assign(new Error('No such object'), { code: 404 }));
    const sent = await request({ path: '/users/missing.png' });
    expect(sent.statusCode).toBe(404);
  });

  it('surfaces other bucket errors to the error handler', async () => {
    mockGetMetadata.mockRejectedValue(Object.assign(new Error('Forbidden'), { code: 403 }));
    const sent = buildRes();
    const next = jest.fn();
    const req = { method: 'GET', path: '/users/', originalUrl: '/users/' } as never;
    await expect(FrontendAssetsService.handle(req, sent.res, next)).rejects.toThrow('Forbidden');
  });
});

describe('FrontendAssetsService access control', () => {
  it('serves an open app without a session', async () => {
    const spy = jest.spyOn(FrontendAssetsService, 'serveAsset').mockResolvedValue(undefined);
    const { redirect, statusCode } = await request({ path: '/users/' });
    expect(redirect).not.toHaveBeenCalled();
    expect(statusCode).toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('redirects an anonymous user from a gated app to sign in, remembering where they were going', async () => {
    const { redirect } = await request({ path: '/admin/users', originalUrl: '/admin/users?x=1' });
    expect(redirect).toHaveBeenCalledWith(
      302,
      `${defaultAppPrefix}/?returnTo=${encodeURIComponent('/admin/users?x=1')}`,
    );
  });

  it('403s a signed in user without a system role, naming the account', async () => {
    const sent = await request({ path: '/admin/', sessionData: session([]) });
    expect(sent.statusCode).toBe(403);
    expect(sent.headers['Content-Type']).toBe('text/html');
    expect(sent.body).toContain('sam@example.com');
    expect(sent.body).toContain(`href="${defaultAppPrefix}/"`);
  });

  it('serves the gated app to a user with a system role', async () => {
    const spy = jest.spyOn(FrontendAssetsService, 'serveAsset').mockResolvedValue(undefined);
    const sent = await request({ path: '/admin/', sessionData: session([SYSTEM_SUPER_ADMIN]) });
    expect(sent.statusCode).toBeUndefined();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ bucketFolder: 'admin' }),
      '/index.html',
      expect.anything(),
    );
    spy.mockRestore();
  });

  it('still 403s (not 301s) a forbidden user on the bare prefix', async () => {
    const sent = await request({ path: '/admin', sessionData: session([]) });
    expect(sent.statusCode).toBe(403);
    expect(sent.redirect).not.toHaveBeenCalled();
  });
});

describe('cacheControlFor', () => {
  it('never caches html', () => {
    expect(cacheControlFor('/index.html')).toBe('no-cache, no-store, must-revalidate');
  });

  it('caches hashed Vite assets for a year', () => {
    expect(cacheControlFor('/assets/index-6hR_QwvJ.js')).toBe('public, max-age=31536000, immutable');
    expect(cacheControlFor('/assets/logo-Bq3kd9Xa.png')).toBe('public, max-age=31536000, immutable');
  });

  it('caches everything else briefly', () => {
    expect(cacheControlFor('/favicon.ico')).toBe('public, max-age=300');
    expect(cacheControlFor('/manifest.webmanifest')).toBe('public, max-age=300');
  });
});
