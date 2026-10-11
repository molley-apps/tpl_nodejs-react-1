import express from 'express';
import { HttpOptions } from '@/http';
import config from '@/config';
import AuthService from '@/services/AuthService';
import FrontendAssetsService from '@/services/FrontendAssetsService';
import SessionService from '@/services/SessionService';
import readinessProbe from '@/utils/readinessProbe';
import { logHttpException } from '@/utils/httpExceptionLogger';

/**
 * Everything the application injects into the generated http layer (src/http/index.ts).
 * Kept out of app.ts so the integration tests can build the exact same express app
 * without opening a port.
 */
export const buildHttpOptions = (): HttpOptions => {
  const app = express();
  // Derive req.ip from X-Forwarded-For across the known proxy hops only (Cloud
  // Run), so logs and any per-IP limit key on the real client
  // and not on the proxy or a client-supplied header.
  app.set('trust proxy', config.trustProxyHops);

  return {
    app,

    appMiddlewareOptions: {
      ...config.appMiddlewareOptions,
      // Better Auth answers /api/auth/*, then the session is resolved for everything else
      authentication: [AuthService.routeHandler(), SessionService.middleware()],
    },

    // BEFORE the standard request middleware: the readiness probe must answer
    // while the DB is still connecting, so it cannot sit behind anything that
    // needs the DB (session lookup) to run.
    requestMiddlewareBefore: [readinessProbe],

    // AFTER the standard request middleware (so req.sessionData is set) and
    // before the API routes: serves the frontends from the bucket.
    requestMiddlewareAfter: [FrontendAssetsService.middleware()],

    // The generated handler logs every HttpException via console.error, which
    // Cloud Run ingests as severity=ERROR - so 404s and expired-session 401s
    // were being counted as service errors. This keeps 5xx at ERROR and drops
    // client errors to WARNING.
    httpException: { errorLogger: logHttpException },
  };
};
