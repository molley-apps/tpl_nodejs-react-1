import { CronExpressionParser } from 'cron-parser';

/**
 * The first instant after `from` matching a five-field cron expression read in an IANA timezone. Throws on an
 * invalid expression or timezone, so callers can validate by calling it.
 */
export function nextCronRun(cron: string, timezone: string, from: Date = new Date()): Date {
  // Intl is the authority on timezone names; cron-parser accepts some it should not
  new Intl.DateTimeFormat('en-GB', { timeZone: timezone });
  return CronExpressionParser.parse(cron, { tz: timezone, currentDate: from }).next().toDate();
}
