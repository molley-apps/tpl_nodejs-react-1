# Authentication

This API authenticates its own users with [Better Auth](https://www.better-auth.com), a self hosted TypeScript auth
library running inside the Express process. There is no third party identity provider and no proxy in front of the
service. Users, sessions and verification tokens live in the app's own MongoDB database.

## Why a library inside the API

- Works for every client type. Browsers get an httpOnly session cookie, native apps and CLIs get a bearer token.
  Nothing about the API changes per client.
- One user base per app, in the app's database. No per-app tenant to create at a vendor, no user export problem later.
- Mongo only, no extra container. Fits a scale-to-zero Cloud Run service.
- Everything is code in this repo: email templates, session length, which flows are enabled.

## Where things live

| What | Where |
|---|---|
| Better Auth instance and options | `src/services/AuthService.ts` |
| Session resolution for every request (`req.sessionData`) | `src/services/SessionService.ts` |
| Emails Better Auth asks us to send | `src/services/AuthEmailService.ts`, templates in `emails/templates/auth/` |
| Wiring into the generated http layer | `src/utils/buildHttpOptions.ts` → `AppMiddlewareOptions.authentication` |
| App-side read/update of users | `src/database/models/UserModel.ts`, `src/database/UserRepository.ts` |
| Config and env vars | `src/config.ts` → `auth`, `.env.example` |
| Browser client | `frontends/services/src/AuthService.ts`, UI in `frontends/users/src/components/auth/` |

## Request flow

```
request
  ├─ /api/auth/*  ──► Better Auth handler (AuthService.routeHandler)   responds, never reaches routes
  └─ anything else ─► SessionService.middleware
                        ├─ session found          → req.sessionData = { userId, sessionId, user, userRoles } → continue
                        ├─ no session, public API → continue (config.auth.publicPaths, eg /api/health)
                        ├─ no session, frontend   → continue without sessionData (FrontendAssetsService gates the app)
                        └─ no session, other /api → 401
```

Both middlewares are injected through `AppMiddlewareOptions.authentication`, so the generated `src/http/` folder
stays auth-agnostic and can be regenerated freely. The frontends are served by the same API after this middleware
(see `docs/FRONTEND_ASSETS.md`): the users app is open because its sign in page is inside the SPA, the admin app
requires a system role on `userRoles` and redirects anonymous visitors to `/users/?returnTo=…`.

## Routes

All under `/api/auth`. These are served by the library and are **not** in the OpenAPI spec. The main ones:

| Route | Purpose |
|---|---|
| `POST /sign-up/email` | `{ email, password, name, firstName, lastName }` |
| `POST /sign-in/email` | `{ email, password }` → session cookie, plus `set-auth-token` header for bearer clients |
| `POST /sign-out` | ends the session |
| `GET /get-session` | current session and user, or null |
| `POST /request-password-reset` | `{ email, redirectTo }` → emails a link, the link lands on `redirectTo?token=…` |
| `POST /reset-password` | `{ newPassword, token }` |
| `POST /send-verification-email` | resend the verification email |
| `GET /verify-email?token=…` | link target from the verification email |
| `POST /sign-in/magic-link` | `{ email, callbackURL }` → emails a one-time sign in link |
| `POST /change-password`, `POST /update-user`, `POST /change-email` | account management |

Enabled plugins: `bearer` (token auth for non-browser clients) and `magicLink`. Others available in the library and a
one-line addition in `AuthService.ts`: `twoFactor`, `passkey`, `organization`, `admin`, `apiKey`, `deviceAuthorization`,
social providers (Google, Apple, GitHub…).

## Clients

**Browser (React):** `frontends/services/src/AuthService.ts` builds the Better Auth React client. `AuthService.auth`
exposes `signIn`, `signUp`, `signOut`, `useSession`, `requestPasswordReset`, `resetPassword`… The cookie is httpOnly,
so the frontend never reads it; `useSession()` is the source of truth. Every axios request sends credentials.

**Native / CLI:** sign in with the same routes, read the `set-auth-token` response header, then send
`Authorization: Bearer <token>` on every request. Expo apps can use `@better-auth/expo` instead.

## Data

Collections written by Better Auth, with UUID string `_id`s so the typegoose models can read them:

| Collection | Content |
|---|---|
| `users` | `email`, `emailVerified`, `name`, `image`, `firstName`, `lastName`, `roles` + timestamps |
| `sessions` | session token, expiry, ip, user agent |
| `accounts` | credential (password hash) and future social provider links |
| `verifications` | email verification, password reset and magic link tokens |
| `rateLimits` | production only |

Indexes are created by the library on first use. The `users` collection is also the app's user model: add app fields
through `user.additionalFields` in `AuthService.ts` **and** `UserModel.ts` **and** the OpenAPI `user` schema together.
`roles` is `input: false`, meaning the user cannot set it on sign up; the app assigns roles.

## Configuration

| Env var | Purpose |
|---|---|
| `AUTH_SECRET` | Required. Signs cookies and tokens. `openssl rand -base64 32`. Rotating it signs everyone out. |
| `AUTH_BASE_URL` | Public origin of the API. Leave empty on Cloud Run to infer from `x-forwarded-proto`/`host`. |
| `AUTH_TRUSTED_ORIGINS` | Comma separated extra browser origins allowed to call auth routes with credentials. The API's own origin is always trusted and the frontends are served from it, so only the Vite dev server needs listing. |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | `true` blocks sign in until the email link is clicked. Default `false`. |
| `APP_NAME`, `APP_URL` | Used in emails, the sign in page and the 403 page. `APP_URL` is the one public origin (API and frontends). |

Sessions last 30 days and are refreshed daily (`config.auth.sessionExpiresInSeconds` / `sessionUpdateAgeSeconds`).

## Local development

1. Copy `.env.example` to `.env` and set `AUTH_SECRET`.
2. `npm run dev:start` in `apis/api-mono/api` (API on `http://localhost:8080`), then `pnpm dev` in
   `frontends/users` (Vite on `http://localhost:3004/users/`, listed in `AUTH_TRUSTED_ORIGINS` by default). After
   `pnpm build` the API also serves the app itself at `http://localhost:8080/users/`.
3. Create an account with the sign up form. With `EMAIL_MODE=FILE` (the `.env.example` default) the verification,
   reset and magic link emails are written to `apis/api-mono/api/emails/logs` instead of being sent; open the
   file and follow the link.

## Tests

- `src/services/__tests__/SessionService.spec.ts` — the middleware decisions, auth layer mocked.
- `src/__tests__/auth.integration.spec.ts` — sign up, cookie and bearer sessions, the generated `/api/user/current`
  routes, the frontend redirects and 403, sign out and password reset request, end to end against an in-memory
  MongoDB (`mongodb-memory-server`, downloads a `mongod` binary on first run).

Better Auth ships as ESM only. `jest.config.js` transpiles it and its ESM dependencies through ts-jest with `allowJs`
(`esmOnlyPackages` list) because the API itself is CommonJS. Node 22+ handles `require()` of ESM at runtime natively.
