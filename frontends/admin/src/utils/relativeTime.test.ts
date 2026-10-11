import { describe, expect, it } from 'vitest';
import { relativeTime } from './relativeTime';

const NOW = new Date('2026-10-09T12:00:00.000Z');

describe('relativeTime', () => {
  it('describes recent instants in minutes, hours and days', () => {
    expect(relativeTime('2026-10-09T11:59:40.000Z', NOW)).toBe('just now');
    expect(relativeTime('2026-10-09T11:25:00.000Z', NOW)).toBe('35m ago');
    expect(relativeTime('2026-10-09T06:00:00.000Z', NOW)).toBe('6h ago');
    expect(relativeTime('2026-10-06T12:00:00.000Z', NOW)).toBe('3d ago');
  });

  it('falls back to the date once more than a month has passed', () => {
    expect(relativeTime('2026-08-01T12:00:00.000Z', NOW)).toBe(new Date('2026-08-01T12:00:00.000Z').toLocaleDateString());
  });

  it('is empty for an unparseable date', () => {
    expect(relativeTime('nope', NOW)).toBe('');
  });
});
