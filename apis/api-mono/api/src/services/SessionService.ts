import express from 'express';
import config from '@/config';
import AuthService, { AuthSession } from '@/services/AuthService';
import { UnauthorizedException } from '@/http/nodegen/errors';

/**
 * The authenticated subject attached to every request as req.sessionData (see src/http/interfaces/NodegenRequest.ts)
 */
export interface SessionData {
  userId: string;
  sessionId: string;
  user: AuthSession['user'];
  /** The user's system roles (User.roles), empty for an ordinary user */
  userRoles: string[];
}

const API_PREFIX = '/api';

/**
 * SessionService
 *
 * Resolves the Better Auth session (cookie or bearer token) for every request and attaches it to the request.
 * Injected into the http layer via AppMiddlewareOptions.authentication, see src/utils/buildHttpOptions.ts
 *
 * Only the API is guarded here. Frontend paths (everything outside /api) always continue, with or without a
 * session: the apps are static bundles whose sign in page lives inside the SPA, and FrontendAssetsService
 * gates the role-restricted ones using the sessionData attached here.
 */
class SessionService {
  isApiPath(path: string): boolean {
    return path === API_PREFIX || path.startsWith(`${API_PREFIX}/`);
  }

  isPublicPath(path: string): boolean {
    return config.auth.publicPaths.includes(path);
  }

  toSessionData(session: AuthSession): SessionData {
    const roles = (session.user as { roles?: unknown }).roles;
    return {
      userId: session.user.id,
      sessionId: session.session.id,
      user: session.user,
      userRoles: Array.isArray(roles) ? roles.filter((role): role is string => typeof role === 'string') : [],
    };
  }

  /**
   * - Session found: req.sessionData is set and the request continues
   * - No session on a public API path or a frontend path: the request continues without sessionData
   * - No session on any other API path: 401
   */
  middleware(): express.RequestHandler {
    return (req, res, next) => {
      AuthService.getSession(req)
        .then((session) => {
          if (session) {
            req.sessionData = this.toSessionData(session);
            return next();
          }
          if (!this.isApiPath(req.path) || this.isPublicPath(req.path)) {
            return next();
          }
          next(new UnauthorizedException('Authentication required'));
        })
        .catch(next);
    };
  }
}

export default new SessionService();
