import { FormEvent, useState } from 'react';
import { AuthService } from 'services';
import AuthLayout from './AuthLayout';
import AuthMessages from './AuthMessages';
import { appHomeUrl } from './authUrls';

interface SignInPageProps {
  onSignUp: () => void;
  onForgotPassword: () => void;
}

/**
 * Email and password sign in against POST /api/auth/sign-in/email, with a
 * magic link alternative (POST /api/auth/sign-in/magic-link) for people who
 * would rather not type a password. A successful sign in sets the session
 * cookie; AuthGate's useSession picks it up and renders the app.
 */
export default function SignInPage({ onSignUp, onForgotPassword }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await AuthService.auth.signIn.email({ email, password });

    setBusy(false);
    if (result.error) {
      setError(result.error.message || 'Could not sign in, please try again');
    }
  };

  const sendMagicLink = async () => {
    if (!email) {
      setError('Enter your email first, then request the link');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await AuthService.auth.signIn.magicLink({ email, callbackURL: appHomeUrl() });

    setBusy(false);
    if (result.error) {
      setError(result.error.message || 'Could not send the link, please try again');
      return;
    }
    setNotice('Check your inbox for a sign in link.');
  };

  return (
    <AuthLayout
      title="Sign in"
      footer={
        <>
          <button type="button" className="btn btn--link" onClick={onForgotPassword}>
            Forgot your password?
          </button>
          <button type="button" className="btn btn--link" onClick={sendMagicLink} disabled={busy}>
            Email me a sign in link instead
          </button>
          <span>
            New here?{' '}
            <button type="button" className="btn btn--link" onClick={onSignUp}>
              Create an account
            </button>
          </span>
        </>
      }
    >
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label className="field__label" htmlFor="sign-in-email">
            Email
          </label>
          <input
            id="sign-in-email"
            className="field__input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="sign-in-password">
            Password
          </label>
          <input
            id="sign-in-password"
            className="field__input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <AuthMessages error={error} notice={notice} />

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          Sign in
        </button>
      </form>
    </AuthLayout>
  );
}
