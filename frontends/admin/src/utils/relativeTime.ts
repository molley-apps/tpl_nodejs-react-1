const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * "just now" / "35m ago" / "6h ago" / "3d ago" — how long ago something
 * happened, for scanning a list of fresh signups. Beyond a month the exact
 * date reads better, so the caller shows that instead.
 */
export function relativeTime(at: string | Date, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(at).getTime();
  if (Number.isNaN(elapsed)) return '';
  if (elapsed < MINUTE_MS) return 'just now';
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  const days = Math.floor(elapsed / DAY_MS);
  if (days <= 31) return `${days}d ago`;
  return new Date(at).toLocaleDateString();
}
