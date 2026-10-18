import { defineJob } from '@/jobs/defineJob';
import SessionRepository from '@/database/SessionRepository';

/**
 * Sample job: Better Auth leaves expired session documents behind; this removes them so the collection stays small.
 * Ships disabled, like every job; an administrator turns it on in the admin app.
 */
export default defineJob({
  name: 'purge-expired-sessions',
  description: 'Deletes sessions past their expiry so the sessions collection stays small.',
  defaultSchedule: { cron: '15 3 * * *', timezone: 'UTC' },
  run: async (ctx) => {
    const removed = await SessionRepository.deleteExpired();
    ctx.log(`removed ${removed} expired session(s)`);
    return { removed };
  },
});
