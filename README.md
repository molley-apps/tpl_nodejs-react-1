# Node App Template

A full-stack application template using an API-first development workflow. The backend is an Express/TypeScript API generated from an OpenAPI specification. The frontend is a React app that consumes auto-generated API clients via a pnpm workspace.

Authentication is built in: [Better Auth](https://www.better-auth.com) runs inside the API with users stored in MongoDB, so the same sign up / sign in works for the React app, native apps and CLIs. See `apis/api-mono/api/docs/AUTHENTICATION.md`.

It is one deployable: the API serves the React app(s) too, streaming each Vite build from a private GCS bucket under its own prefix (`/users/`, later `/admin/`). One Cloud Run service, one origin, scale to zero; uploading a new build is the whole frontend deploy. See `apis/api-mono/api/docs/FRONTEND_ASSETS.md`.

## Project Structure

```
├── Makefile                    # Docker shortcuts (setup, up, down, logs, reset)
├── .env                        # Local environment variables (not committed)
├── .env.example                # Template for .env
├── docker-compose.dev.yml      # Local dev services (nginx, api, mailhog)
├── nginx/                      # Nginx reverse proxy config
├── apis/
│   └── api-mono/
│       ├── api-spec/           # OpenAPI spec (BOATS)
│       │   └── src/            # Spec source files (paths, components, schemas)
│       └── api/                # Express API (generated + domain logic)
│           ├── src/http/       # AUTO-GENERATED — do not edit
│           ├── src/domains/    # YOUR business logic
│           ├── src/database/   # Models and repositories (typegoose/MongoDB)
│           └── src/services/   # Shared services
└── frontends/
    ├── pnpm-workspace.yaml     # Workspace: apis, services, users
    ├── apis/                   # Auto-generated API consumer services
    ├── services/               # Shared frontend services (HttpService, etc.)
    └── users/                  # React app (Vite + MUI + Zustand)
```

## Getting Started

### 1. Setup

```bash
make setup        # Creates .env from .env.example
```

Edit `.env` with your MongoDB credentials and set `AUTH_SECRET` (`openssl rand -base64 32`).

### 2. Install frontend dependencies

```bash
cd frontends
pnpm install
```

### 3. Start everything

```bash
make up           # Starts nginx, api-mono, and mailhog
```

This brings up:
- **Nginx** on `http://localhost:8999` — reverse proxies to the API
- **API** — Express server (hot-reloads via tsc-watch)
- **Mailhog** — dev email UI on `http://localhost:8025`

### 4. Start the React app

```bash
cd frontends/users
pnpm dev          # Vite dev server on http://localhost:3004/users/
```

The React app calls the API through nginx at `http://localhost:8999`. To see it the way it is deployed, run
`pnpm build` instead: with `NODE_ENV=local` the API serves `frontends/users/dist` at `http://localhost:8999/users/`.

### Makefile Commands

| Command      | Description                          |
|--------------|--------------------------------------|
| `make setup` | Create `.env` from `.env.example`    |
| `make up`    | Start all Docker services            |
| `make up-d`  | Start all services (detached)        |
| `make down`  | Stop all services                    |
| `make logs`  | Tail logs from all services          |
| `make reset` | Stop, remove volumes, and restart    |

## Authentication

The API hosts [Better Auth](https://www.better-auth.com) under `/api/auth/*` (`apis/api-mono/api/src/services/AuthService.ts`).
Users, sessions and verification tokens live in the app's MongoDB. Every other `/api/*` route requires a session
and gets it as `req.sessionData`; `/api/health` is public.

Out of the box: email + password sign up and sign in, email verification, password reset, magic links, and bearer
tokens for clients that cannot use cookies. Social providers, passkeys, 2FA and organisations are one-line plugin
additions in `AuthService.ts`.

```
AUTH_SECRET=<openssl rand -base64 32>
AUTH_BASE_URL=http://localhost:8999          # empty on Cloud Run, inferred from headers
AUTH_TRUSTED_ORIGINS=http://localhost:3004   # extra origins allowed to sign in; the API's own origin always is
AUTH_REQUIRE_EMAIL_VERIFICATION=false
```

Locally the verification, reset and magic link emails land in Mailhog at `http://localhost:8025`.
The React app shows a sign in / create account page until a session exists (`frontends/users/src/components/auth/`).

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
