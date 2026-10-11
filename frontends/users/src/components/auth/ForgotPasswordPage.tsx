import { FormEvent, useState } from 'react';
import { AuthService } from 'services';
import AuthLayout from './AuthLayout';
import AuthMessages from './AuthMessages';
import { appHomeUrl } from './authUrls';

/**
 * POST /api/auth/request-password-reset. The API emails a link to
 * `redirectTo?token=…`, which is this app's root: AuthPage sees the token in
 * the URL and shows the reset screen. The response is the same whether or not
 * the email exists, so the notice never reveals which.
 */
export default function ForgotPasswordPage({ onSignIn }: { onSignIn: () => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const result = await AuthService.auth.requestPasswordReset({ email, redirectTo: appHomeUrl() });

    setBusy(false);
    if (result.error) {
      setError(result.error.message || 'Could not request a reset, please try again');
      return;
    }
    setNotice('If an account exists for that email, a password reset link is on its way.');
  };

  return (
    <AuthLayout
      title="Reset your password"
      intro="Enter your email and we will send you a link to choose a new password."
      footer={
        <button type="button" className="btn btn--link" onClick={onSignIn}>
          Back to sign in
        </button>
      }
    >
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label className="field__label" htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            className="field__input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <AuthMessages error={error} notice={notice} />

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          Send reset link
        </button>
      </form>
    </AuthLayout>
  );
}
