import { ReactNode, useEffect } from 'react';
import { AuthService } from 'services';
import AuthPage from './AuthPage';
import { safeReturnTo } from './authUrls';

/**
 * Renders the app only when a Better Auth session exists, otherwise the auth
 * screens. If the API sent the user here with ?returnTo=/some/path (a
 * role-gated app they tried to open), they go back there once signed in.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { data: session, isPending } = AuthService.auth.useSession();
  const returnTo = safeReturnTo();

  useEffect(() => {
    if (session && returnTo) {
      window.location.assign(returnTo);
    }
  }, [session, returnTo]);

  if (isPending || (session && returnTo)) {
    return (
      <div className="centered-screen" role="status" aria-label="Loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return <>{children}</>;
}
