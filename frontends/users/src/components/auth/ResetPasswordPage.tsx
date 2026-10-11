import { FormEvent, useState } from 'react';
import { AuthService } from 'services';
import AuthLayout from './AuthLayout';
import AuthMessages from './AuthMessages';

interface ResetPasswordPageProps {
  /** The token from the emailed link (?token=…) */
  token: string;
  /** Called once the password is updated, to go back to sign in */
  onDone: () => void;
}

/**
 * POST /api/auth/reset-password with the token from the emailed link.
 */
export default function ResetPasswordPage({ token, onDone }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('The two passwords do not match');
      return;
    }
    setBusy(true);
    setError(null);

    const result = await AuthService.auth.resetPassword({ newPassword: password, token });

    setBusy(false);
    if (result.error) {
      setError(result.error.message || 'Could not update the password, the link may have expired');
      return;
    }
    onDone();
  };

  return (
    <AuthLayout
      title="Choose a new password"
      footer={
        <button type="button" className="btn btn--link" onClick={onDone}>
          Back to sign in
        </button>
      }
    >
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label className="field__label" htmlFor="reset-password">
            New password
          </label>
          <input
            id="reset-password"
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

        <div className="field">
          <label className="field__label" htmlFor="reset-password-confirm">
            Confirm new password
          </label>
          <input
            id="reset-password-confirm"
            className="field__input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <AuthMessages error={error} notice={null} />

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          Update password
        </button>
      </form>
    </AuthLayout>
  );
}
