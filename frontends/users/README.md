# App Template

The users app: React + TypeScript + Zustand, built with Vite and served by the API under `/users/`.

## No component library, on purpose

This app ships with **plain HTML and one stylesheet** (`src/styles/index.css`). It is the starting point Molley
generates a product from, and the component library is chosen during that setup, so nothing here is tied to one.
Everything is semantic markup with a handful of classes (`.card`, `.form`, `.field`, `.btn`, `.alert`) and CSS
variables for colours and spacing, which makes the swap mechanical: install the chosen library, replace the
elements in `src/components/`, delete the classes you no longer need.

## What is here

- `src/components/auth/` — sign in, sign up, forgot password and reset password screens against the API's
  Better Auth routes (`/api/auth/*`), plus a magic link option on sign in. `AuthGate` shows them until a session
  exists and honours the `?returnTo=` the API adds when a signed-out user opens a role-gated app.
- `src/components/Greeting.tsx` — a placeholder page with an API health check, to be replaced by the product.
- `src/store/` — Zustand stores.
- `src/utils/startup.ts` — wires the shared `HttpService`/`AuthService` and the generated API clients.

## Getting started

```bash
cd frontends && pnpm install
cd users && pnpm dev      # http://localhost:3004/users/ against the API on :8080 (`npm run dev:start` in apis/api-mono/api)
pnpm build                # dist/ the API serves at /users/ (deployed: uploaded to the bucket's users/ folder)
```
