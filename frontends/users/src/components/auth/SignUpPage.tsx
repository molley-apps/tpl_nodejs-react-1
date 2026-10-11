import { FormEvent, useState } from 'react';
import { AuthService } from 'services';
import AuthLayout from './AuthLayout';
import AuthMessages from './AuthMessages';

/**
 * Account creation against POST /api/auth/sign-up/email. firstName and
 * lastName are the app's additional user fields (AuthService.ts on the API);
 * `name` is Better Auth's own required display name.
 *
 * With AUTH_REQUIRE_EMAIL_VERIFICATION=true the API sends a verification
 * email and the user is not signed in until they click it, so the screen
 * says so instead of waiting for a session that will not arrive.
 */
export default function SignUpPage({ onSignIn }: { onSignIn: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

    const result = await AuthService.auth.signUp.email({
      email,
      password,
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
    });

    setBusy(false);
    if (result.error) {
      setError(result.error.message || 'Could not create the account, please try again');
      return;
    }
    // No session token back means email verification is required first
    if (!result.data?.token) {
      setNotice('Account created. Check your inbox and click the verification link to sign in.');
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <span>
          Already have an account?{' '}
          <button type="button" className="btn btn--link" onClick={onSignIn}>
            Sign in
          </button>
        </span>
      }
    >
      <form className="form" onSubmit={submit}>
        <div className="form__row">
          <div className="field">
            <label className="field__label" htmlFor="sign-up-first-name">
              First name
            </label>
            <input
              id="sign-up-first-name"
              className="field__input"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sign-up-last-name">
              Last name
            </label>
            <input
              id="sign-up-last-name"
              className="field__input"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="sign-up-email">
            Email
          </label>
          <input
            id="sign-up-email"
            className="field__input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="sign-up-password">
            Password
          </label>
          <input
            id="sign-up-password"
            className="field__input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="field__hint">At least 8 characters.</span>
        </div>

        <AuthMessages error={error} notice={notice} />

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          Create account
        </button>
      </form>
    </AuthLayout>
  );
}
