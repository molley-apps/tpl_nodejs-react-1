import { useEffect, useState } from 'react';
import SetupService from 'apis/api-mono/services/SetupService';

const SETUP_KEY_PARAM = 'setupKey';

const readSetupKey = () => new URLSearchParams(window.location.search).get(SETUP_KEY_PARAM) || '';

/**
 * Turns the signed-in account into this environment's first administrator when the page was opened with
 * ?setupKey=<ADMIN_SETUP_KEY> (the one-time link Molley shows the owner). Rendered inside the signed-in shell, so a
 * visitor who is not signed in sees the auth screens first and the key survives in the URL until they are.
 * On success the key is dropped from the address bar and the admin app opens.
 */
export default function AdminSetupClaim() {
  const [key] = useState(readSetupKey);
  const [state, setState] = useState<'idle' | 'claiming' | 'failed'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setState('claiming');
    SetupService.setupAdminPost({ key })
      .then(() => {
        if (cancelled) return;
        window.history.replaceState({}, '', window.location.pathname);
        window.location.assign('/admin/');
      })
      .catch((err: { response?: { data?: { body?: string } }; message?: string }) => {
        if (cancelled) return;
        setError(err?.response?.data?.body || err?.message || 'The setup key could not be used');
        setState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key || state === 'idle') return null;

  return (
    <div className={`alert ${state === 'failed' ? 'alert--error' : 'alert--success'}`} role="status">
      {state === 'claiming' ? 'Setting up your administrator access…' : `Administrator setup failed: ${error}`}
    </div>
  );
}
