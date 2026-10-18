import path from 'path';
import dotenv from 'dotenv';
import { ConnectOptions } from 'mongoose';
import { ProcEnvHelper } from 'proc-env-helper';
import { EmailerSendTypes } from 'nunjucks-emailer';
import packageJson from '../package.json';
import { AppMiddlewareOptions } from '@/http/nodegen/middleware';

dotenv.config();

const csv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Mongo connection parameters, consumed by MongoConnectionService.
 */
export interface MongoDbConfig {
  mongoAdditionalParams?: string;
  mongoDatabase?: string;
  mongoHost?: string;
  mongoPassword?: string;
  mongoPort?: string;
  mongoProtocol?: string;
  mongoUri?: string;
  mongoUser?: string;
  mongoOpts?: ConnectOptions;
}

const env = ProcEnvHelper.getOrSetDefault('NODE_ENV', 'production');

// Public origin of this deployment as the browser sees it. The API serves the
// frontends as well as /api, so there is exactly one origin for everything:
// this process locally (http://localhost:8080), the Cloud Run URL or custom
// domain when deployed. Used in emails and anywhere an absolute URL is needed.
const appUrl = String(ProcEnvHelper.getOrSetDefault('APP_URL', 'http://localhost:8080')).replace(/\/+$/, '');

// Browser origins allowed to call the API with credentials from ANOTHER
// origin. Empty = reflect every origin (the generated cors middleware default),
// which is fine while the only client is the frontend the API serves itself.
// Set it when something else (the Vite dev server, a native app's web view)
// calls the API cross-origin.
const corsWhiteList = csv(String(ProcEnvHelper.getOrSetDefault('CORS_WHITELIST', '')));

// Where bucket objects are served from. Hoisted because the CSP below allows
// <img> loads from it: anything the API hands the frontends as a direct bucket
// URL would be blocked otherwise.
const gcsBaseUrl = String(ProcEnvHelper.getOrSetDefault('GCS_BASE_URL', 'https://storage.googleapis.com'));

/**
 * Add and remove config that you need.
 * Centralizing config into a single file.
 * Import this config file into your code opposed to hiding process.env everywhere.
 */
export default {
  // Instance
  env,
  gcpProjectId: String(ProcEnvHelper.getOrSetDefault('GCP_PROJECT_ID', '')),
  port: ProcEnvHelper.getOrSetDefault('PORT', 8080),

  appDetails: {
    name: ProcEnvHelper.getOrSetDefault('APP_NAME', 'App Template'),
    domain: appUrl,
    frontend: {
      // Public URL of the users app, used in emails. Served by this API under /users (see FrontendAssetsService).
      userApp: ProcEnvHelper.getOrSetDefault('APP_FRONTEND_URL', `${appUrl}/users/`),
    },
  },

  // How many proxy hops sit in front of the API (Cloud Run = 1). Express uses
  // it to derive req.ip from X-Forwarded-For without trusting a client-supplied
  // value. Locally there is no proxy, but a stray header is harmless.
  trustProxyHops: Number(ProcEnvHelper.getOrSetDefault('TRUST_PROXY_HOPS', 1)),

  // Logger mode - Controls console.log verbosity
  // Options: 'error', 'warn', 'info', 'log', 'debug', 'verbose'
  // Each level includes all higher priority levels (e.g., 'info' includes 'error' and 'warn')
  loggerMode: ProcEnvHelper.getOrSetDefault('LOGGER_MODE', 'log'),

  // Middleware config injections, eg helmet, cors, etc. Authentication is injected in src/utils/buildHttpOptions.ts
  appMiddlewareOptions: {
    cors: corsWhiteList.length > 0 ? { corsWhiteList } : undefined,
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          // MUI/emotion inject inline styles; the frontends load Google Fonts
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', gcsBaseUrl],
          mediaSrc: ["'self'", 'blob:', 'data:'],
          connectSrc: ["'self'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
          workerSrc: ["'self'", 'blob:'],
        },
      },
    },
  } as AppMiddlewareOptions,

  /**
   * Authentication - Better Auth (https://www.better-auth.com), self hosted inside this API, users stored in MongoDB.
   * Routes live under `basePath` and are handled by the library, see src/services/AuthService.ts
   */
  auth: {
    // Signs session cookies and tokens. Generate with: openssl rand -base64 32
    secret: ProcEnvHelper.requiredOrThrow('AUTH_SECRET'),

    // Public origin of this API, eg http://localhost:8080 or https://app.example.com
    // Leave empty to infer it from the request (x-forwarded-proto / host), which is what Cloud Run needs
    baseUrl: ProcEnvHelper.getOrSetDefault('AUTH_BASE_URL', ''),
    basePath: '/api/auth',

    // Origins allowed to call the auth routes with credentials. The API's own origin is always trusted, so this
    // only matters for cross-origin clients such as the Vite dev server.
    trustedOrigins: csv(ProcEnvHelper.getOrSetDefault('AUTH_TRUSTED_ORIGINS', 'http://localhost:3004')),

    // When true a user cannot sign in until the verification email link has been clicked
    requireEmailVerification: ProcEnvHelper.getOrSetDefault('AUTH_REQUIRE_EMAIL_VERIFICATION', 'false') === 'true',

    sessionExpiresInSeconds: 60 * 60 * 24 * 30,
    sessionUpdateAgeSeconds: 60 * 60 * 24,

    // API paths that do not require a session. Every other /api path returns 401 without one.
    // Frontend paths are not listed here: the apps are served without a session (their sign in page lives
    // inside the SPA) and FrontendAssetsService gates the role-restricted ones.
    publicPaths: ['/api/health', '/api/capabilities'],
  },

  // Local development fallback for EmailService only (NODE_ENV=local with no provider saved in the admin app):
  // FILE writes each message to emails/logs, or point the nodemailer settings at Mailpit. Deployed environments
  // send through the provider the administrator configures in Settings → Email, never through these values.
  email: {
    mode: ProcEnvHelper.getOrSetDefault('EMAIL_MODE', EmailerSendTypes.nodemailer),
    fallbackFrom: ProcEnvHelper.getOrSetDefault('EMAIL_FALLBACK_FROM', 'no-reply@example.com'),
    supportEmail: ProcEnvHelper.getOrSetDefault('EMAIL_SUPPORT', 'support@example.com'),
    techEmail: ProcEnvHelper.getOrSetDefault('EMAIL_SUPPORT', 'support@example.com'),
    nodemailer: {
      port: ProcEnvHelper.getOrSetDefault('EMAIL_PORT', 587),
      host: ProcEnvHelper.getOrSetDefault('EMAIL_HOST', 'smtp.sendgrid.net'),
      secure: ProcEnvHelper.getOrSetDefault('EMAIL_SECURE', false),
      auth: {
        user: ProcEnvHelper.getOrSetDefault('EMAIL_USERNAME', undefined),
        pass: ProcEnvHelper.getOrSetDefault('EMAIL_PASSWORD', undefined),
      },
    },
  },

  // Mongodb connection details
  mongoDb: {
    mongoAdditionalParams: ProcEnvHelper.getOrSetDefault('MONGO_ADDITIONAL_PARAMS', 'retryWrites=true&w=majority'),
    mongoDatabase: ProcEnvHelper.getOrSetDefault('MONGO_DB', packageJson.name),
    mongoHost: ProcEnvHelper.getOrSetDefault('MONGO_HOST', 'changeme'),
    mongoPassword: ProcEnvHelper.getOrSetDefault('MONGO_PW', 'changeme'),
    mongoUser: ProcEnvHelper.getOrSetDefault('MONGO_USER', 'changeme'),
    mongoPort: ProcEnvHelper.getOrSetDefault('MONGO_PORT', false),
    mongoProtocol: ProcEnvHelper.getOrSetDefault('MONGO_PROTOCOL', 'mongodb+srv'),
    mongoUri: ProcEnvHelper.getOrSetDefault('MONGO_URI', false),
    mongoOpts: {
      ssl: ProcEnvHelper.getOrSetDefault('MONGO_SSL', undefined),
      // Cap the per-instance pool: Cloud Run scales out into more instances
      // under load, and every instance holds its own pool against the same
      // cluster (an Atlas M0 allows 500 connections in total).
      maxPoolSize: Number(ProcEnvHelper.getOrSetDefault('MONGO_MAX_POOL_SIZE', 10)),
      // Deliberately 0, and it works WITH maxIdleTimeMS below: during a quiet
      // period the pool drains to nothing rather than holding sockets open for
      // a NAT to silently reap.
      minPoolSize: 0,
      // Recycle a pooled connection that has been idle this long, well under
      // Cloud NAT's 20 minute idle timeout so WE close idle sockets first.
      maxIdleTimeMS: Number(ProcEnvHelper.getOrSetDefault('MONGO_MAX_IDLE_TIME_MS', 10 * 60 * 1000)),
      // Ceiling on a single socket operation. The driver default is 0 (no
      // timeout), so an operation on a silently dead socket would hang for
      // minutes instead of failing fast and letting the driver reconnect.
      socketTimeoutMS: Number(ProcEnvHelper.getOrSetDefault('MONGO_SOCKET_TIMEOUT_MS', 45000)),
      // Fail a hung TCP/TLS handshake in line with the server selection timeout.
      connectTimeoutMS: Number(ProcEnvHelper.getOrSetDefault('MONGO_CONNECT_TIMEOUT_MS', 10000)),
    },
  } as MongoDbConfig,

  // Google Cloud Storage - the bucket holding the built frontends, one folder
  // per app (see FrontendAssetsService.frontendMap). Read with Application
  // Default Credentials, so the bucket stays private: only the API's service
  // account needs roles/storage.objectViewer on it.
  gcs: {
    bucketName: ProcEnvHelper.getOrSetDefault('GCS_FRONTEND_BUCKET', ''),
    baseUrl: gcsBaseUrl,
  },

  frontends: {
    // Where NODE_ENV=local serves the apps from: <dir>/<app>/dist. Defaults to
    // the repo's frontends folder, resolved from the API package directory the
    // process runs in (apis/api-mono/api -> ../../../frontends).
    localDir: String(
      ProcEnvHelper.getOrSetDefault('FRONTENDS_LOCAL_DIR', path.resolve(process.cwd(), '../../../frontends')),
    ),
    // Send X-Robots-Tag: noindex with every frontend response. On for a dev
    // environment, so "try my app" links stay shareable without search engines
    // indexing a half-built app.
    noindex: String(ProcEnvHelper.getOrSetDefault('FRONTENDS_NOINDEX', 'false')) === 'true',
  },
};
