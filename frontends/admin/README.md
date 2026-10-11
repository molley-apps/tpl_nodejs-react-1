# Admin

The staff console: React + TypeScript + MUI (Molley palette, see `src/theme.ts`) + Zustand + React Router, built with
Vite and served by the API under `/admin/`. Only users with a system role (`SUPER_ADMIN`) may load it; the API
redirects everyone else (see `apis/api-mono/api/docs/FRONTEND_ASSETS.md`).

## What is here

A blank canvas with the one area every product needs from day one:

- **Dashboard** — a card per area; add one as the product grows an area.
- **Users** — everyone with an account (accounts come from sign up, so this page never creates them): search,
  filter by system role, grant or remove system roles, see and revoke active sessions, delete an account.

Adding a page: a route in `src/App.tsx`, a sidebar entry in `src/components/layout/Sidebar.tsx`, and for a scoped
staff role its path in `src/utils/systemAccess.ts` (mirrors `SYSTEM_ROLES` on the API).

## API contract

The pages call a generated `AdminService` client that the template's OpenAPI spec does not define yet. Add these
paths to `apis/api-mono/api-spec/src/paths/_admin/users/`, run the spec build, `generate:server` in the API and
`generate:api-consumers` in `frontends/apis`, and the console compiles:

| Method and path | Used for |
|---|---|
| `GET /admin/users?offset&limit&search&role` | the table, response `{ data: User[], meta: { totalResultCount } }` |
| `PUT /admin/users/{userId}/roles` | `{ roles: string[] }`, system roles only |
| `GET /admin/users/{userId}/sessions` | `AdminSession[]`: `_id`, `createdAt`, `expiresAt`, `lastAccessedAt?`, `ipAddress?`, `userAgent?` |
| `DELETE /admin/users/{userId}/sessions` | sign the user out everywhere |
| `DELETE /admin/users/{userId}` | remove the account |

Guard them with `SUPER_ADMIN` on the API (`PermissionService`). Until they exist, `pnpm lint` and `pnpm test` pass
here but `pnpm typecheck` and `pnpm build` do not, so the build pipeline should skip this app for now.

## Getting started

```bash
cd frontends && pnpm install
cd admin && pnpm dev      # http://localhost:3005/admin/ against the API on :8080 (`npm run dev:start` in apis/api-mono/api)
pnpm lint && pnpm test
```
