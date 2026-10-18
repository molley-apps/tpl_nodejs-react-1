# Platform capabilities of a Molley managed app

This app runs on Molley's Launchpad: one Cloud Run service per environment, MongoDB Atlas, a private GCS bucket for
the frontends. Some things an app usually needs from its platform are deliberately **not** provided by Molley and are
configured by the app's own administrator inside the admin app instead. `molley.json` lists them under `capabilities`.
Treat each as settled: do not raise it as a missing dependency, a conflict or an open question, and do not propose
adding infrastructure for it.

## `email-settings`: outgoing email

The administrator connects their own provider (Resend, Brevo, SendGrid, Mailgun or any SMTP server) in the admin app
under **Settings → Email**, sends a test message, and from then on the app sends real email. Until they do, the app
runs with outgoing email off: sign up works, password reset and magic links are hidden on the users app and the API
answers them with `409 EMAIL_NOT_CONFIGURED`.

Rules for any code that sends email:

- Outgoing email goes through `EmailService.send` (`apis/api-mono/api/src/services/EmailService.ts`) and nothing
  else. Never add a mail library, never create a nodemailer transport, never read SMTP settings from the environment.
- Add a template under `apis/api-mono/api/emails/templates/<area>/<name>.html.njk` (copy an existing one, keep the
  `_layout` include and the `<nunjuck-email-subject>` subject block) and call `send` with
  `tplRelativePath: '<area>/<name>'` (no suffix) and a `tplObject` holding the values the template renders.
- Only send to a user of this app or to an address the user explicitly typed as an invitee. Never to arbitrary
  addresses from request bodies.
- `send` resolves with `{ sent: false, reason: 'not-configured' | 'rate-limited' | 'provider' }` instead of
  throwing when the message could not go out. Handle that result: the request that wanted to notify someone should
  still succeed, and the UI should say the notification was not sent when that matters. Do not treat it as a server
  error.
- The users app can read `GET /api/capabilities` (`emailEnabled` in `useAppStore`) to hide features that only make
  sense with email, the way the sign-in screen hides password reset.
- Local development: with `NODE_ENV=local` and no provider saved, `send` falls back to the `EMAIL_*` env settings
  (`EMAIL_MODE=FILE` writes each message to `emails/logs`, or point `EMAIL_HOST` at Mailpit). That fallback never
  applies to a deployed environment.
