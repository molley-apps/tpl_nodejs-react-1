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

## API

The pages call the generated `AdminService` client for these routes, defined in
`apis/api-mono/api-spec/src/paths/admin/users/` and implemented in the API's `AdminDomain`, `AdminUserIdDomain` and
`AdminUserService`. Every one needs the `SUPER_ADMIN` system role (`PermissionService` refuses any `apiAdmin*`
permission code without it).

| Method and path | Used for |
|---|---|
| `GET /admin/users?offset&limit&search&role` | the table, response `{ data: User[], meta: { totalResultCount } }` |
| `PUT /admin/users/{userId}/roles` | `{ roles: string[] }`, system roles only; an admin cannot drop their own `SUPER_ADMIN` |
| `GET /admin/users/{userId}/sessions` | active Better Auth sessions, never the token |
| `DELETE /admin/users/{userId}/sessions` | sign the user out everywhere |
| `DELETE /admin/users/{userId}` | remove the account, its credentials and sessions; an admin cannot delete themselves |

Add an endpoint: spec path, `npm run build` in `api-spec`, `generate:server` in the API, implement the domain
method (logic in a service, queries in a repository), then `node generate-apis.js` in `frontends/apis` so this app
gets the client.

## Getting started

```bash
cd frontends && pnpm install
cd admin && pnpm dev      # http://localhost:3005/admin/ against the API on :8080 (`npm run dev:start` in apis/api-mono/api)
pnpm lint && pnpm typecheck && pnpm test
pnpm build                # dist/ the API serves at /admin/ (deployed: uploaded to the bucket's admin/ folder)
```

The first `SUPER_ADMIN` is granted by setting `roles: ["SUPER_ADMIN"]` on that user's document in Mongo; after
that, admins grant the role from the Users page.
