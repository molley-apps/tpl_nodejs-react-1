# Node App Template

A full-stack application template using an API-first development workflow. The backend is an Express/TypeScript API generated from an OpenAPI specification. The frontend is a React app that consumes auto-generated API clients via a pnpm workspace.

Authentication is built in: [Better Auth](https://www.better-auth.com) runs inside the API with users stored in MongoDB, so the same sign up / sign in works for the React app, native apps and CLIs. See `apis/api-mono/api/docs/AUTHENTICATION.md`.

It is one deployable: the API serves the React app(s) too, streaming each Vite build from a private GCS bucket under its own prefix (`/users/`, later `/admin/`). One Cloud Run service, one origin, scale to zero; uploading a new build is the whole frontend deploy. See `apis/api-mono/api/docs/FRONTEND_ASSETS.md`.

## Project Structure

```
├── apis/
│   └── api-mono/
│       ├── api-spec/           # OpenAPI spec (BOATS)
│       │   └── src/            # Spec source files (paths, components, schemas)
│       └── api/                # Express API (generated + domain logic)
│           ├── src/http/       # AUTO-GENERATED — do not edit
│           ├── src/domains/    # YOUR business logic
│           ├── src/database/   # Models and repositories (typegoose/MongoDB)
│           └── src/services/   # Shared services
├── molley.json                 # Manifest: services, frontends, environments and env vars, read by Molley's provisioner
├── deploy/
│   ├── terraform/              # Cloud Run + assets bucket + secrets per environment (envs/dev.tfvars, envs/prod.tfvars)
│   ├── tf.sh                   # terraform for one env: deploy/tf.sh dev apply
│   ├── push-api.sh             # build, push and roll out the API image
│   └── upload-frontends.sh     # build an app and upload its dist/ to the bucket
└── frontends/
    ├── pnpm-workspace.yaml     # Workspace: apis, services, users, admin
    ├── apis/                   # Auto-generated API consumer services
    ├── services/               # Shared frontend services (HttpService, etc.)
    ├── users/                  # React app (Vite + Zustand, plain HTML/CSS, no component library yet)
    └── admin/                  # Staff console (MUI, Molley palette), served at /admin/
```

## Getting Started

### 1. Setup

Everything runs in the cloud; locally the API is a plain Node process and the apps are Vite dev servers.

```bash
cd apis/api-mono/api
cp .env.example .env   # set MONGO_* for your Atlas cluster and AUTH_SECRET (openssl rand -base64 32)
npm install
```

### 2. Install frontend dependencies

```bash
cd frontends
pnpm install
```

### 3. Start the API

```bash
cd apis/api-mono/api
npm run dev:start      # http://localhost:8080, hot-reloads via tsc-watch
```

With `EMAIL_MODE=FILE` (the default in `.env.example`) outgoing emails are written to `apis/api-mono/api/emails/logs`
instead of being sent. Deployed, the app sends through the provider its administrator connects in the admin app under
**Settings → Email** (bring your own Resend, Brevo, SendGrid, Mailgun or SMTP key); see `.claude/rules/platform-capabilities.md`.

### 4. Start the React app

```bash
cd frontends/users
pnpm dev          # Vite dev server on http://localhost:3004/users/
```

The React app calls the API at `http://localhost:8080`. To see it the way it is deployed, run `pnpm build` instead:
with `NODE_ENV=local` the API serves `frontends/users/dist` at `http://localhost:8080/users/` (and the admin at
`/admin/`).

## Authentication

The API hosts [Better Auth](https://www.better-auth.com) under `/api/auth/*` (`apis/api-mono/api/src/services/AuthService.ts`).
Users, sessions and verification tokens live in the app's MongoDB. Every other `/api/*` route requires a session
and gets it as `req.sessionData`; `/api/health` is public.

Out of the box: email + password sign up and sign in, email verification, password reset, magic links, and bearer
tokens for clients that cannot use cookies. Social providers, passkeys, 2FA and organisations are one-line plugin
additions in `AuthService.ts`.

```
AUTH_SECRET=<openssl rand -base64 32>
AUTH_BASE_URL=http://localhost:8080          # empty on Cloud Run, inferred from headers
AUTH_TRUSTED_ORIGINS=http://localhost:3004   # extra origins allowed to sign in; the API's own origin always is
AUTH_REQUIRE_EMAIL_VERIFICATION=false
```

Locally (`EMAIL_MODE=FILE`) the verification, reset and magic link emails are written to `apis/api-mono/api/emails/logs`.
Deployed, nothing is sent until an administrator saves and verifies an email provider in the admin app: sign up still
works, while password reset and magic links are hidden on the users app and answer `409 EMAIL_NOT_CONFIGURED`.
The React app shows a sign in / create account page until a session exists (`frontends/users/src/components/auth/`).

## Scheduled jobs

Anything that must run on a schedule is a file under `apis/api-mono/api/src/jobs` built with `defineJob` and listed
in `src/jobs/index.ts` (see `purgeExpiredSessions.ts`). Jobs ship disabled: an administrator sets the cron and
timezone and turns each one on in the admin app under **Schedules**. Deployed, every enabled schedule is a Cloud
Scheduler job the API creates in its own project (the invoker account and roles come from `deploy/terraform/sa.tf`),
calling `POST /api/internal/jobs/<name>` with an OIDC token the API verifies; a claim on the job record makes a retry
or a second instance skip. Locally there is no Scheduler: the API runs due jobs every 30 seconds itself. A job is one
request and must finish well inside the 300 s request timeout. The full rule is in
`.claude/rules/platform-capabilities.md`.

## Deploying

`deploy/` holds Terraform for a `dev` and a `prod` environment on GCP: one public Cloud Run service (the API, which
also serves the frontends), a private assets bucket, an Artifact Registry repository, the Secret Manager secrets and a
least-privilege service account. Three scripts cover the day-to-day:

```bash
export TF_STATE_BUCKET=<your terraform state bucket>
deploy/tf.sh dev apply                 # create or update the environment
deploy/push-api.sh dev                 # build, push and roll out the API image
deploy/upload-frontends.sh dev users   # build an app and upload it to the bucket
```

`deploy/README.md` walks through the first deploy (secrets, image, public URL) and custom domains.

## Frontend Workspace

The `frontends/` directory is a **pnpm workspace** containing three packages:

- **`apis`** — Auto-generated API consumer classes (one per API endpoint). Generated from the OpenAPI spec. Import as `apis/api-mono/services/HealthService`.
- **`services`** — Shared frontend services like `HttpService` (axios wrapper with interceptors). Import as `services`.
- **`users`** — The React application. Depends on both `apis` and `services` as workspace packages.

This means the React app imports API clients directly:

```typescript
import HealthService from 'apis/api-mono/services/HealthService';
const health = await HealthService.healthGet();
```

## Creating a New API Endpoint

This project follows **API-first development**: design your OpenAPI spec first, generate the server and client code, then implement the business logic.

### 1. Define the path

Create a folder matching your URL structure in `apis/api-mono/api-spec/src/paths/`:

```
paths/widget/get.yml          → GET /widget
paths/widget/post.yml         → POST /widget
paths/widget/{id}/get.yml     → GET /widget/{id}
```

### 2. Define schemas

Add request/response schemas in `api-spec/src/components/schemas/`:

```yaml
# components/schemas/widget/baseAttributes.yml
type: object
properties:
  name:
    type: string
  description:
    type: string

# components/schemas/widget/model.yml
allOf:
  - $ref: ./baseAttributes.yml
  - type: object
    required: [_id, name, createdAt, updatedAt]
    properties:
      _id:
        type: string
        format: uuid
      createdAt:
        type: string
        format: date-time
      updatedAt:
        type: string
        format: date-time
```

### 3. Build the spec

```bash
cd apis/api-mono/api-spec
npm run build
```

### 4. Generate the server

```bash
cd apis/api-mono/api
npm run generate:server
```

This regenerates `src/http/` (routes, validation, interfaces) and creates stub domain files in `src/domains/` if they don't already exist.

### 5. Implement domain logic

Open the generated domain file and implement the methods. Follow the interface contract:

```typescript
// src/domains/WidgetDomain.ts
class WidgetDomain implements WidgetDomainInterface {
  public async widgetGet(req: any): Promise<Widget[]> {
    return WidgetRepository.findAll();
  }
}
```

### 6. Generate frontend API consumers

```bash
cd frontends/apis
npm run generate:api-consumers
```

You can now use `WidgetService` in the React app.

## Key Rules

- **Never edit `src/http/`** — it is regenerated on every `generate:server` run
- **Domain files** are created once and preserved — your business logic lives here
- **All database queries** go through repository classes, never call models directly
- **Always use `$ref`** in OpenAPI specs for parameters and schemas
- **Use `allOf`** for schema composition (never `oneOf` or `anyOf`)
