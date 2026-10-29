import express from 'express';
import config from '@/config';
import { verifySchedulerOidc } from '@/utils/verifySchedulerOidc';

/** Every path under here skips the session check (config.auth.publicPathPrefixes) and is guarded by this service instead. */
export const INTERNAL_API_PREFIX = '/api/internal/';

/**
 * Guards the whole `/api/internal/` prefix: these routes are called by Google Cloud (Cloud Scheduler today) with
 * a Google OIDC token for this environment's invoker service account, never by a signed-in user, so the session
 * middleware lets them through and this one verifies the token instead. Anything else is 401 before any route,
 * validator or domain runs, so a route added under the prefix is protected without remembering to check.
 *
 * Injected after SessionService in AppMiddlewareOptions.authentication, see src/utils/buildHttpOptions.ts.
 */
class InternalAuthService {
  isInternalPath(path: string): boolean {
    return path.startsWith(INTERNAL_API_PREFIX);
  }

  middleware(): express.RequestHandler {
    return (req, res, next) => {
      if (!this.isInternalPath(req.path)) {
        return next();
      }
      verifySchedulerOidc(req.headers.authorization, {
        audience: config.appDetails.domain,
        invokerEmail: config.scheduler.invokerEmail,
      })
        .then(() => next())
        .catch(next);
    };
  }
}

export default new InternalAuthService();
