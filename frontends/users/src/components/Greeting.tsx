import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export default function Greeting() {
  const { greeting, setGreeting, apiHealthy, healthLoading, healthError, checkHealth } = useAppStore();

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const status = healthLoading
    ? { className: 'status', label: 'Checking…' }
    : apiHealthy === true
      ? { className: 'status status--ok', label: 'API is healthy' }
      : apiHealthy === false
        ? { className: 'status status--error', label: healthError || 'API unreachable' }
        : { className: 'status', label: 'Unknown' };

  return (
    <>
      <section className="card">
        <h2>{greeting}</h2>
        <div className="field">
          <label className="field__label" htmlFor="greeting">
            Update greeting
          </label>
          <input id="greeting" className="field__input" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
        </div>
      </section>

      <section className="card">
        <h3>API health</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className={status.className} role="status">
            {status.label}
          </span>
          <button type="button" className="btn" onClick={checkHealth} disabled={healthLoading}>
            Refresh
          </button>
        </div>
      </section>
    </>
  );
}
