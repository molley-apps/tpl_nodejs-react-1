import config from '@/config';

/**
 * Absolute URL of this app's root, eg http://localhost:8080/users/. Where the
 * emailed magic link and password reset link land (the API appends ?token=…).
 * BASE_URL is Vite's `base`, the prefix the API serves this app under.
 */
export const appHomeUrl = (): string => `${config.app.baseUrl}${import.meta.env.BASE_URL}`;

/**
 * The same-origin path to return to after signing in, if the API sent the
 * user here with ?returnTo=… (eg from a role-gated app). Anything that is not
 * a plain absolute path on this origin is ignored, so the parameter can never
 * bounce someone to another site.
 */
export const safeReturnTo = (search: string = window.location.search): string | null => {
  const value = new URLSearchParams(search).get('returnTo');
  return value && /^\/(?!\/)/.test(value) ? value : null;
};
