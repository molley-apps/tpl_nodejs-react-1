import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields, magicLinkClient } from 'better-auth/client/plugins';

/**
 * Builds the Better Auth browser client. The API hosts Better Auth under /api/auth
 * (see apis/api-mono/api/src/services/AuthService.ts), this client talks to it with cookies.
 */
const buildClient = (baseApiUrl: string) =>
  createAuthClient({
    // Empty when the API serves this app (same origin): let the client use window.location.origin
    baseURL: baseApiUrl || undefined,
    basePath: '/api/auth',
    fetchOptions: {
      credentials: 'include',
    },
    plugins: [
      magicLinkClient(),
      // Mirrors user.additionalFields on the server so sign up and session typing include them
      inferAdditionalFields({
        user: {
          firstName: { type: 'string', required: true },
          lastName: { type: 'string', required: true },
          roles: { type: 'string[]', required: false, input: false },
        },
      }),
    ],
  });

export type AuthClient = ReturnType<typeof buildClient>;

export default class AuthService {
  private static client?: AuthClient;
  private static onLogoutCallback?: () => void;

  static setup(config: { baseApiUrl: string; onLogout?: () => void }) {
    AuthService.client = buildClient(config.baseApiUrl);
    AuthService.onLogoutCallback = config.onLogout;
  }

  /** The Better Auth client: signIn, signUp, signOut, useSession, requestPasswordReset... */
  static get auth(): AuthClient {
    if (!AuthService.client) {
      throw new Error('You must call AuthService.setup (via HttpService.setup) beforehand');
    }
    return AuthService.client;
  }

  static async logout(): Promise<void> {
    try {
      await AuthService.auth.signOut();
    } catch (error) {
      // eslint-disable-next-line no-console -- the failure is swallowed so the local logout still runs; this is its only trace
      console.error('Sign out request failed:', error);
    } finally {
      if (AuthService.onLogoutCallback) {
        AuthService.onLogoutCallback();
      }
    }
  }

  static async isLoggedIn(): Promise<boolean> {
    const { data } = await AuthService.auth.getSession();
    return Boolean(data?.session);
  }
}
