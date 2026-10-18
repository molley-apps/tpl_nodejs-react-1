import { describe, expect, it } from 'vitest';
import { describeCron } from './describeCron';

describe('describeCron', () => {
  it('renders a cron expression in plain words with 24 hour times', () => {
    expect(describeCron('15 3 * * *')).toBe('At 03:15');
    expect(describeCron(' */2 * * * * ')).toBe('Every 2 minutes');
  });

  it('is empty for an expression it cannot read', () => {
    expect(describeCron('nope')).toBe('');
    expect(describeCron('')).toBe('');
  });
});
