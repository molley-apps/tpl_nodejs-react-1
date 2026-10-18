import { nextCronRun } from '@/utils/nextCronRun';

describe('nextCronRun', () => {
  it('reads the cron in the given timezone across a DST change', () => {
    // London leaves GMT on 2026-03-29 at 01:00 UTC: 03:15 local is 03:15Z the day before and 02:15Z after
    expect(nextCronRun('15 3 * * *', 'Europe/London', new Date('2026-03-28T00:00:00Z')).toISOString()).toBe('2026-03-28T03:15:00.000Z');
    expect(nextCronRun('15 3 * * *', 'Europe/London', new Date('2026-03-29T00:00:00Z')).toISOString()).toBe('2026-03-29T02:15:00.000Z');
    expect(nextCronRun('*/2 * * * *', 'UTC', new Date('2026-10-18T10:01:00Z')).toISOString()).toBe('2026-10-18T10:02:00.000Z');
  });

  it('rejects an invalid expression or timezone', () => {
    expect(() => nextCronRun('nope', 'UTC')).toThrow();
    expect(() => nextCronRun('61 * * * *', 'UTC')).toThrow();
    expect(() => nextCronRun('* * * * *', 'Mars/Olympus')).toThrow();
  });
});
