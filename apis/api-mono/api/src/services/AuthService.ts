import express from 'express';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { betterAuth, BetterAuthOptions } from 'better-auth';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { bearer, magicLink } from 'better-auth/plugins';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import config from '@/config';
import AuthEmailService from '@/services/AuthEmailService';

/**
 * AuthService
 *
 * Owns the Better Auth instance. Better Auth is a self hosted auth library living inside this API:
 * - Routes: everything under config.auth.basePath (/api/auth/*) is handled by the library, not the OpenAPI spec.
 *   Sign up, sign in, sign out, password reset, email verification, magic links, session management.
 * - Storage: the app's own MongoDB database. Collections `users`, `sessions`, `accounts`, `verifications`
 *   (and `rateLimits` in production). Ids are UUID strings so typegoose models can read the same documents.
 * - Clients: cookies for browsers, bearer tokens (set-auth-token response header) for native apps and CLIs.
 *
 * The instance is created lazily because the adapter needs the open mongoose connection from startup().
 */
class AuthService {
  private auth?: ReturnType<AuthService['build']>;

  /** The Better Auth instance, created on first access. Call once at startup to fail fast on bad config. */
  getInstance() {
    if (!this.auth) {
      this.auth = this.build();
    }
    return this.auth;
  }

  /**
   * Express middleware that lets Better Auth answer everything under config.auth.basePath.
   * Any other path is passed through untouched.
   */
  routeHandler(): express.RequestHandler {
    const prefix = `${config.auth.basePath}/`;
    return (req, res, next) => {
      if (!req.path.startsWith(prefix)) {
        return next();
      }
      toNodeHandler(this.getInstance())(req, res).catch(next);
    };
  }

  /** The session behind a request (cookie or bearer token), or null when there is none. */
  getSession(req: express.Request) {
    return this.getInstance().api.getSession({ headers: fromNodeHeaders(req.headers) });
  }

  private build() {
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('AuthService requires an open mongoose connection, call startup() before using auth');
    }

    return betterAuth({
      appName: config.appDetails.name,
      secret: config.auth.secret,
      baseURL: config.auth.baseUrl || undefined,
      basePath: config.auth.basePath,
      trustedOrigins: config.auth.trustedOrigins,

      // mongoose bundles its own copy of the mongodb driver, the types are the same shape as the adapter's peer
      database: mongodbAdapter(db as unknown as Parameters<typeof mongodbAdapter>[0], {
        // Atlas and replica sets support transactions, a single mongod in local docker does not
        transaction: false,
      }),
      advanced: {
        database: {
          // UUID strings, same as every other _id in this API
          generateId: () => randomUUID(),
        },
      },
      rateLimit: {
        enabled: config.env === 'production',
        // Cloud Run runs several instances, an in-memory limiter would be per instance
        storage: 'database',
        modelName: 'rateLimits',
      },

      ...this.schemaOptions(),
      ...this.emailFlowOptions(),

      plugins: [
        // Clients that cannot use cookies (Expo, CLIs) read the set-auth-token header and send Authorization: Bearer
        bearer(),
        magicLink({
          sendMagicLink: ({ email, url }) => AuthEmailService.sendMagicLink(email, url),
        }),
      ],
    });
  }

  /** Collection names and the user fields this app adds on top of the Better Auth user */
  private schemaOptions() {
    return {
      user: {
        modelName: 'users',
        additionalFields: {
          firstName: { type: 'string', required: true, input: true },
          lastName: { type: 'string', required: true, input: true },
          // Set by the application (eg an admin tool), never by the user on sign up
          roles: { type: 'string[]', required: false, defaultValue: [], input: false },
        },
      },
      session: {
        modelName: 'sessions',
        expiresIn: config.auth.sessionExpiresInSeconds,
        updateAge: config.auth.sessionUpdateAgeSeconds,
        // No cookieCache: the app updates users outside Better Auth (PUT /api/user/current) and sign out must
        // revoke immediately, so every request does one indexed lookup in the sessions collection instead.
      },
      account: { modelName: 'accounts' },
      verification: { modelName: 'verifications' },
    } satisfies Pick<BetterAuthOptions, 'user' | 'session' | 'account' | 'verification'>;
  }

  /** Password and verification flows, emails go through AuthEmailService */
  private emailFlowOptions() {
    return {
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: config.auth.requireEmailVerification,
        sendResetPassword: ({ user, url }) => AuthEmailService.sendPasswordReset(user, url),
      },
      emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: ({ user, url }) => AuthEmailService.sendEmailVerification(user, url),
      },
    } satisfies Pick<BetterAuthOptions, 'emailAndPassword' | 'emailVerification'>;
  }
}

export type AuthSession = NonNullable<Awaited<ReturnType<AuthService['getSession']>>>;

export default new AuthService();
