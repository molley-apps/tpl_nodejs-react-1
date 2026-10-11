# Frontend assets

One Cloud Run service delivers everything: `/api/*` is the OpenAPI generated API, every other path is one of the
React apps. The apps are Vite builds stored in a **private** GCS bucket, one folder per app, and the API streams them
to the browser. Nothing is public on the bucket and the API image never contains frontend code.

Why this shape:

- One hostname, one TLS certificate, one origin. Cookies and CORS are a non-issue because the apps and the API share
  the origin, so Better Auth needs no trusted origin configuration beyond the Vite dev server.
- Scale to zero. The service only runs while someone is using it; the bucket costs cents.
- Frontends deploy independently of the API: upload a new `dist/`, the next request serves it. No API rebuild, no
  revision, no cache purge (HTML is `no-store`, hashed assets are immutable).
- The API can gate an app on a role before a single byte of it is served (the admin app).

## Request flow

```
GET /                      → 302 /users/
GET /users                 → 301 /users/
GET /users/                → users/index.html             (no session needed, the sign in page is inside the SPA)
GET /users/settings        → users/index.html             (client-side route)
GET /users/assets/x-H4sh.js→ users/assets/x-H4sh.js       (Cache-Control: immutable)
GET /admin/                → 302 /users/?returnTo=/admin/ (no session)
                           → 403 page                     (session without a system role)
                           → admin/index.html             (session with a system role)
GET /anything-else         → 302 /users/
GET /api/...               → the API (SessionService: 401 without a session unless public)
GET /readyz                → readiness probe, answered before everything else
```

Implemented in `src/services/FrontendAssetsService.ts`, injected via `requestMiddlewareAfter` in
`src/utils/buildHttpOptions.ts` so it runs after the session middleware (it needs `req.sessionData`) and before the
API routes.

## Registering an app

`frontendMap` in `FrontendAssetsService.ts` maps a URL prefix to the app:

```ts
'/admin': {
  bucketFolder: 'admin',        // gs://<GCS_FRONTEND_BUCKET>/admin/
  localFolder: 'admin',         // frontends/admin/dist/ when NODE_ENV=local
  anySystemRoleRequired: true,  // or roleRequired: 'SOME_ROLE'; omit both for an open app
},
```

Three things must agree on the prefix:

1. The key in `frontendMap`.
2. The app's Vite `base` (`VITE_BASE_PATH=/admin/` in `frontends/admin/.env.*`), so its `index.html` asks for
   `/admin/assets/*`.
3. The folder the build pipeline uploads `dist/` into: `gs://<GCS_FRONTEND_BUCKET>/<prefix without slash>/`.

The default app (`defaultAppPrefix`, `/users`) must stay open: it hosts the sign in page every other app redirects to.

## Serving modes

| `NODE_ENV` | Source | Notes |
|---|---|---|
| `local` | `frontends/<localFolder>/dist/` on disk | The repo's `frontends` folder, resolved from the API directory (`FRONTENDS_LOCAL_DIR` overrides). Run the app's `pnpm build` first, or use its Vite dev server instead. |
| anything else | `gs://<GCS_FRONTEND_BUCKET>/<bucketFolder>/` | Read with Application Default Credentials, i.e. the Cloud Run service account, which only needs `roles/storage.objectViewer` on the bucket. The bucket stays private. |

Cache headers set by the API:

| Path | `Cache-Control` |
|---|---|
| `*.html` | `no-cache, no-store, must-revalidate` |
| `/assets/<name>-<hash>.<ext>` | `public, max-age=31536000, immutable` |
| everything else | `public, max-age=300` |

## Deploying an app

`deploy/upload-frontends.sh <env> <app…>` builds each app with `VITE_BASE_PATH=/<name>/` and `VITE_API_BASE_URL=`
(same origin), then replaces the app's folder in the environment's bucket (`deploy/README.md` has the whole flow):

```bash
pnpm --filter <name> build
gsutil -m rm -r gs://${BUCKET}/<name>/** || true
gsutil -m cp -r frontends/<name>/dist/* gs://${BUCKET}/<name>/
```

Only that folder is touched, so the other apps keep serving. Uploading a new build is the whole frontend deploy;
no API change or new Cloud Run revision is needed. The API itself ships as the `Dockerfile` in `apis/api-mono/api`
(`deploy/push-api.sh`), with `/readyz` as its startup probe and `/api/health` as its liveness probe
(`deploy/terraform/main.tf`).

## Local development

There is no containerised dev loop; everything runs in the cloud, and locally the API runs as a plain Node process.

- `npm run dev:start` in `apis/api-mono/api` serves the API on `http://localhost:8080`. With `NODE_ENV=local` it
  also serves `frontends/users/dist` at `http://localhost:8080/users/` once you have run `pnpm build` in
  `frontends/users` (same for `/admin/`).
- For hot reload run `pnpm dev` in the app (`http://localhost:3004/users/`, `http://localhost:3005/admin/`) and
  point it at the API with `VITE_API_BASE_URL=http://localhost:8080` (`.env.development`). That is the one
  cross-origin case, which is why `AUTH_TRUSTED_ORIGINS` lists those two origins.

## Tests

`src/services/__tests__/FrontendAssetsService.spec.ts` covers routing, access control and cache headers with the
GCS client mocked. `src/__tests__/auth.integration.spec.ts` drives the redirects and the 403 through the real express
app.
