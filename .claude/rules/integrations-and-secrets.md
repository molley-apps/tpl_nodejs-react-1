# Third-party integrations and their secrets

Anything this app needs from an outside service (an AI provider, a payment processor, a maps or search API, a
CRM, a webhook secret) is a key the app's **administrator** enters in the admin app under **App secrets**. The
code reads it from there, by name, at the moment it is used. It is never an environment variable.

Why this is not optional:

- A deployed environment receives only the variables listed under `env` in `molley.json`. Those are set by
  Molley's provisioner and Terraform; nobody adds to them per app. A key you put in `.env.example` or read from
  `process.env` has no value in dev or prod, so the feature silently runs without it (or on a fallback) and
  nobody can tell from the outside why.
- The person who holds the key is the administrator of this app, not Molley and not a developer. They paste it
  once in the admin app, can change it later, and it applies without a redeploy.

## Using a secret in code

`AppSecretsService` (`apis/api-mono/api/src/services/AppSecretsService.ts`) is the only way to get a secret:

```ts
import AppSecretsService from '@/services/AppSecretsService';

// Throws 409 SECRET_NOT_CONFIGURED naming the key when the administrator has not added it yet.
const apiKey = await AppSecretsService.require('ANTHROPIC_API_KEY');

// Or, when the feature has a path that works without the key:
const apiKey = await AppSecretsService.get('ANTHROPIC_API_KEY'); // string | null
```

- **Name the key in `UPPER_SNAKE_CASE`**, specific to the service (`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`,
  `GOOGLE_MAPS_API_KEY`), and use that exact name everywhere. The administrator adds it under that name.
- **Read it where it is used, not at startup.** One indexed lookup per use is the point: a value saved in the
  admin app applies to the next request, and a missing one is reported per request instead of once at boot.
  Build the provider client from the value you just read; do not keep a client with a baked-in key in module
  scope.
- **Never read a key from `process.env`**, and never add one to `.env.example`, `config.ts`, `molley.json` or
  Terraform. Not for local development either: the admin app runs locally and the secret is entered there once.
- **Tell the user which key is missing.** `require` already answers `409 SECRET_NOT_CONFIGURED` with a message
  naming the key; let that reach the users app and show it. When the feature has a fallback that needs no key,
  it is never silent: the response says which path produced the result and the users app shows it, so the
  administrator can see the integration is not connected.
- **Tell the administrator what to add.** Mention the key name and what it is for in the feature's description
  or pull request, and in the users app message, so the administrator knows what to paste into App secrets.
- Storage is handled for you: values are AES-256-GCM encrypted with a key derived from `AUTH_SECRET`
  (`utils/deriveSettingsKey`), and the admin API only ever returns the last four characters. Do not invent a
  second encryption secret or an `ENCRYPTION_KEY` variable, and do not write your own secrets collection.

## When a secret alone is not enough

Some integrations need more than a key: a provider choice, host and port, a sending address, a verified test.
Outgoing email is the reference: one settings area with its own document in the `appSettings` collection,
`EmailSettingsService` (encrypting with the same utils), `admin/settings/email` endpoints with `get`, `put`,
`delete` and `test/post`, and the Email page in the admin app. Copy that layer by layer
(`EmailSettingsModel`, `EmailSettingsRepository`, `EmailSettingsService`, `AdminEmailDomain`, the spec under
`paths/admin/settings/email` and `components/schemas/admin/settings/email`, `pages/EmailSettings.tsx`,
`store/emailSettingsStore.ts`, `components/settings/EmailSetupBanner.tsx`, the route and sidebar entry) when the
integration needs its own page. Even then, non-secret settings of one integration live in that one document;
never split an integration between settings and environment variables.
