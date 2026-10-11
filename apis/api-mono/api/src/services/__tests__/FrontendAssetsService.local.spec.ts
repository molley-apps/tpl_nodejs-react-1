// NODE_ENV=local serving: the apps come from <FRONTENDS_LOCAL_DIR>/<app>/dist on disk.
// The config is mocked before the service is imported so it binds to a temp folder.
jest.mock('@/config', () => {
  const os = jest.requireActual('os');
  const path = jest.requireActual('path');
  const actual = jest.requireActual('@/config').default;
  return {
    __esModule: true,
    default: {
      ...actual,
      env: 'local',
      frontends: { localDir: path.join(os.tmpdir(), 'api-mono-frontend-assets-local-spec') },
    },
  };
});

jest.mock('@google-cloud/storage', () => ({ __esModule: true, Storage: class Storage {} }));

import fs from 'fs';
import path from 'path';
import config from '@/config';
import FrontendAssetsService from '@/services/FrontendAssetsService';

const distRoot = path.join(config.frontends.localDir, 'users', 'dist');

interface Sent {
  statusCode?: number;
  body?: unknown;
  headers: Record<string, string>;
}

function buildRes(): Sent & { res: any } {
  const sent: Sent = { headers: {} };
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
      return res;
    },
    redirect: jest.fn(),
  };
  return Object.assign(sent, { res });
}

async function get(requestPath: string) {
  const sent = buildRes();
  const req = { method: 'GET', path: requestPath, originalUrl: requestPath } as never;
  await FrontendAssetsService.handle(req, sent.res, jest.fn());
  return sent;
}

beforeAll(() => {
  fs.mkdirSync(path.join(distRoot, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(distRoot, 'index.html'), '<html>users</html>');
  fs.writeFileSync(path.join(distRoot, 'assets', 'index-abcdefgh.js'), 'console.log(1)');
  // A file OUTSIDE every dist folder that a traversal would try to reach
  fs.writeFileSync(path.join(config.frontends.localDir, 'secret.txt'), 'nope');
});

afterAll(() => {
  fs.rmSync(config.frontends.localDir, { recursive: true, force: true });
});

describe('FrontendAssetsService local serving (NODE_ENV=local)', () => {
  it('serves index.html for the app root and client-side routes', async () => {
    for (const requestPath of ['/users/', '/users/settings']) {
      const sent = await get(requestPath);
      expect(sent.statusCode).toBeUndefined();
      expect(sent.headers['Content-Type']).toBe('text/html');
      expect(sent.headers['Cache-Control']).toBe('no-cache');
      expect(String(sent.body)).toBe('<html>users</html>');
    }
  });

  it('serves real files with their content type', async () => {
    const sent = await get('/users/assets/index-abcdefgh.js');
    expect(sent.headers['Content-Type']).toBe('text/javascript');
    expect(String(sent.body)).toBe('console.log(1)');
  });

  it('404s a missing file', async () => {
    const sent = await get('/users/assets/missing.css');
    expect(sent.statusCode).toBe(404);
  });

  it('refuses to leave the dist folder', async () => {
    const sent = await get('/users/../../secret.txt');
    expect(sent.statusCode).toBe(403);
    expect(String(sent.body)).not.toContain('nope');
  });
});
