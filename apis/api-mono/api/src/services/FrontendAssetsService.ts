import { NextFunction, Request, RequestHandler, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { lookup as mimeLookup } from 'mime-types';
import { Storage } from '@google-cloud/storage';
import config from '@/config';
import { hasAnySystemRole } from '@/constants/ROLES';
import { SessionData } from '@/services/SessionService';
import { escapeHtml } from '@/utils/escapeHtml';

// Requests ending in one of these are real files; anything else under an app
// prefix is a client-side route and gets the app's index.html.
const assetExtensions =
  /\.(js|mjs|css|map|json|webmanifest|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|xml|txt)$/i;

// Vite writes content-hashed files under assets/, so they can be cached forever.
const immutableAssetPath = /\/assets\/[^/]+-[\w-]{8,}\.\w+$/;

const API_PREFIX = '/api';

export interface FrontendConfig {
  /** Folder of this app inside the GCS bucket (where the build pipeline uploads its dist/). */
  bucketFolder: string;
  /** Folder under frontends/ whose dist/ is served when NODE_ENV=local. */
  localFolder: string;
  /** Only sessions carrying this user role may load the app. */
  roleRequired?: string;
  /** Any system role may load the app, the pages inside gate themselves by role. */
  anySystemRoleRequired?: boolean;
}

/**
 * URL prefix -> frontend app. Every app is a Vite build whose `base` is the
 * prefix with a trailing slash, so its index.html asks for `${prefix}/assets/*`.
 *
 * !important: the API is namespaced under /api, so a prefix can never be /api.
 */
export const frontendMap: Record<string, FrontendConfig> = {
  '/users': {
    bucketFolder: 'users',
    localFolder: 'users',
  },
  '/admin': {
    bucketFolder: 'admin',
    localFolder: 'admin',
    anySystemRoleRequired: true,
  },
};

/** Where the bare root and unknown browser paths land. Must not be role-gated: it hosts the sign in page. */
export const defaultAppPrefix = '/users';

const isGated = (app: FrontendConfig): boolean => Boolean(app.roleRequired || app.anySystemRoleRequired);

/** Does the session lack the role an app demands? */
const roleRefused = (app: FrontendConfig, sessionData: SessionData): boolean => {
  if (app.roleRequired && !sessionData.userRoles.includes(app.roleRequired)) {
    return true;
  }
  return !!app.anySystemRoleRequired && !hasAnySystemRole(sessionData.userRoles);
};

/** The app a path targets, if any. */
export const matchFrontend = (requestPath: string): { prefix: string; app: FrontendConfig } | undefined => {
  for (const [prefix, app] of Object.entries(frontendMap)) {
    if (requestPath === prefix || requestPath.startsWith(`${prefix}/`)) {
      return { prefix, app };
    }
  }
  return undefined;
};

/**
 * Serves the frontend apps through the API, so one Cloud Run service delivers
 * both /api and every app: from the private GCS bucket when deployed, from the
 * local `frontends/<app>/dist` folders when NODE_ENV=local.
 */
class FrontendAssetsService {
  private readonly bucketName = config.gcs.bucketName;
  private readonly isLocalDevelopment = config.env === 'local';
  // <localDistPath>/<app>/dist, the repo's frontends folder (config.frontends.localDir).
  private readonly localDistPath = config.frontends.localDir;
  private storageClient?: Storage;

  /** GCS client, created on first use with Application Default Credentials (the Cloud Run service account). */
  private get storage(): Storage {
    if (!this.storageClient) {
      this.storageClient = new Storage();
    }
    return this.storageClient;
  }

  middleware(): RequestHandler {
    return (req, res, next) => {
      this.handle(req, res, next).catch(next);
    };
  }

  async handle(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    const match = matchFrontend(req.path);
    if (match) {
      return this.serveApp(req, res, match.prefix, match.app);
    }

    // The bare root and any unknown browser path land in the default app.
    // 302 so nothing caches it.
    if (req.path === '/' || (!this.isApiPath(req.path) && !assetExtensions.test(req.path))) {
      console.verbose(`[FrontendAssets] ${req.path} is not an app or API path, redirecting to ${defaultAppPrefix}/`);
      res.redirect(302, `${defaultAppPrefix}/`);
      return;
    }

    next();
  }

  private isApiPath(requestPath: string): boolean {
    return requestPath === API_PREFIX || requestPath.startsWith(`${API_PREFIX}/`);
  }

  private async serveApp(req: Request, res: Response, prefix: string, app: FrontendConfig): Promise<void> {
    if (isGated(app)) {
      if (!req.sessionData) {
        // The sign in page lives inside the default app; bring the user back here afterwards.
        res.redirect(302, `${defaultAppPrefix}/?returnTo=${encodeURIComponent(req.originalUrl)}`);
        return;
      }
      if (roleRefused(app, req.sessionData)) {
        this.sendForbiddenPage(res, req.sessionData);
        return;
      }
    }

    // Canonicalize the bare app root to the trailing-slash form so relative
    // asset URLs (and a PWA service worker scoped to `${prefix}/`) resolve.
    // Runs after the access checks so a forbidden user still gets the 403.
    if (req.path === prefix) {
      const query = req.originalUrl.slice(req.path.length);
      res.redirect(301, `${req.path}/${query}`);
      return;
    }

    let assetPath = req.path.substring(prefix.length);
    if (assetPath === '/' || !assetExtensions.test(assetPath)) {
      // A client-side route: serve the SPA shell and let the router take over.
      assetPath = '/index.html';
    }

    await this.serveAsset(app, assetPath, res);
  }

  /** Fetch an asset from the bucket (deployed) or the local dist folder (NODE_ENV=local). */
  async serveAsset(app: FrontendConfig, assetPath: string, res: Response): Promise<void> {
    if (this.isLocalDevelopment) {
      return this.serveLocalAsset(app.localFolder, assetPath, res);
    }
    return this.serveRemoteAsset(app.bucketFolder, assetPath, res);
  }

  private async serveLocalAsset(localFolder: string, assetPath: string, res: Response): Promise<void> {
    const distRoot = path.join(this.localDistPath, localFolder, 'dist');
    const filePath = path.resolve(distRoot, `.${assetPath}`);

    // Never leave the app's dist folder, whatever the request path contained.
    if (!filePath.startsWith(distRoot + path.sep)) {
      res.status(403).send('Forbidden');
      return;
    }

    try {
      const fileContent = await fs.readFile(filePath);
      res.setHeader('Content-Type', mimeLookup(filePath) || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(fileContent);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.verbose(`[FrontendAssets] Not found locally: ${filePath} (run the app's build first)`);
        res.status(404).send('Asset not found');
        return;
      }
      console.error(`[FrontendAssets] Error reading ${filePath}:`, error);
      res.status(500).send('Error reading asset');
    }
  }

  private async serveRemoteAsset(bucketFolder: string, assetPath: string, res: Response): Promise<void> {
    const objectPath = `${bucketFolder}${assetPath}`;
    const file = this.storage.bucket(this.bucketName).file(objectPath);

    // One metadata round trip answers both "does it exist" and "what is it".
    let contentType: string | undefined;
    let size: string | number | undefined;
    try {
      const [metadata] = await file.getMetadata();
      contentType = metadata.contentType;
      size = metadata.size;
    } catch (error: any) {
      if (error?.code === 404) {
        console.verbose(`[FrontendAssets] Not found in gs://${this.bucketName}/${objectPath}`);
        res.status(404).send('Asset not found');
        return;
      }
      throw error;
    }

    res.setHeader('Content-Type', contentType || mimeLookup(assetPath) || 'application/octet-stream');
    res.setHeader('Cache-Control', cacheControlFor(assetPath));
    if (size !== undefined) {
      res.setHeader('Content-Length', String(size));
    }

    await new Promise<void>((resolve) => {
      file
        .createReadStream()
        .on('error', (error: Error) => {
          console.error(`[FrontendAssets] Stream error for ${objectPath}:`, error);
          if (!res.headersSent) {
            res.status(500).send('Error streaming asset');
          } else {
            res.destroy(error);
          }
          resolve();
        })
        .on('end', resolve)
        .pipe(res);
    });
  }

  /**
   * A friendly HTML 403 for a signed in user who lacks the role an app needs,
   * naming who they are signed in as so a wrong-account session explains itself.
   */
  private sendForbiddenPage(res: Response, sessionData: SessionData): void {
    const appName = escapeHtml(String(config.appDetails.name));
    const email = sessionData.user.email ? escapeHtml(sessionData.user.email) : '';
    const html = forbiddenPageHtml({ appName, email, homePath: `${defaultAppPrefix}/` });
    res.status(403).setHeader('Content-Type', 'text/html').send(html);
  }
}

/**
 * HTML: no-store (always check for updates).
 * Hashed Vite assets: cache for a year, the file name changes with the content.
 * Everything else (favicons, manifest): short cache.
 */
export const cacheControlFor = (assetPath: string): string => {
  if (assetPath.endsWith('.html')) {
    return 'no-cache, no-store, must-revalidate';
  }
  if (immutableAssetPath.test(assetPath)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=300';
};

const forbiddenPageHtml = (input: { appName: string; email: string; homePath: string }): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access denied - ${input.appName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f1f5f9; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; color: #334155; }
    .container { background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); max-width: 480px; width: 100%; padding: 40px 32px; text-align: center; }
    h1 { font-size: 26px; color: #0f172a; margin-bottom: 8px; }
    .code { font-size: 15px; color: #64748b; margin-bottom: 24px; }
    p { line-height: 1.6; margin-bottom: 14px; }
    .identity { background: #f8fafc; border-left: 4px solid #0f172a; padding: 14px; margin: 20px 0; border-radius: 4px; text-align: left; font-size: 14px; }
    a { color: #0369a1; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Access denied</h1>
    <div class="code">403 Forbidden</div>
    ${input.email ? `<div class="identity">You are signed in as <strong>${input.email}</strong></div>` : ''}
    <p>Your account does not have the role this page requires.</p>
    <p><a href="${input.homePath}">Go to ${input.appName}</a> to continue, or sign out there to use a different account.</p>
  </div>
</body>
</html>
`;

export default new FrontendAssetsService();
